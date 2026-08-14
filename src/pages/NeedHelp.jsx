import { useState } from "react";
import { useRouter } from "../lib/router.jsx";
import ManizalesMap from "../components/ManizalesMap.jsx";
import { ChevronLeft } from "../components/Icons.jsx";
import { useShareImage } from "../components/ShareImageCard.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faCompass,
  faClock,
  faPhone,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { createPost, saveMyPost } from "../lib/firebase.js";
import {
  shareOrDownloadImage,
  buildShareCaption,
  postShareUrl,
  copyToClipboard,
} from "../lib/share.js";
import { byteLength } from "../lib/text.js";
import {
  CATEGORIES,
  URGENCY_LEVELS,
  BLOOD_TYPES,
  DESCRIPTION_MAX_BYTES,
} from "../lib/constants";

const STEPS = [
  "category",
  "description",
  "location",
  "urgency",
  "contact",
  "review",
];

// Chips and free text are kept as separate state while editing (so
// toggling a chip never clobbers something the poster already typed),
// then merged into the single `description` string that actually gets
// saved — Firestore, the Give Help list, and the share-image card all
// just read one plain description field, unaware chips exist.
function combineDescription(items, other) {
  const itemsText = items.join(", ");
  const otherText = other.trim();
  if (itemsText && otherText) return `${itemsText}. ${otherText}`;
  return itemsText || otherText;
}

export default function NeedHelp() {
  const { navigate } = useRouter();
  const { generate, CardPortal } = useShareImage();

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({
    category: null,
    items: [], // quick-fill chips the poster tapped (e.g. ['Agua', 'Medicinas'])
    bloodTypes: [], // required (at least one), category === 'blood' only — see BLOOD_TYPES
    description: "", // free text — "algo más" on top of / instead of the chips
    location: null, // { lat, lng } — set by tapping the map, see StepLocation
    address: "", // poster-typed, required — the only address that gets saved
    locationNote: "",
    urgency: null,
    contact: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null); // { postId, editToken, imageDataUrl }

  const step = STEPS[stepIndex];

  function update(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function back() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  // Whatever ends up saved to Firestore is combineDescription(items, free
  // text) — the byte cap has to be checked against THAT combined string,
  // not just the raw textarea, or a post could pass the client-side gate
  // and still get rejected server-side once chips are folded in.
  const finalDescription = combineDescription(form.items, form.description);
  const descriptionWithinLimit =
    byteLength(finalDescription) <= DESCRIPTION_MAX_BYTES;

  const canProceed = {
    category: !!form.category,
    description:
      (form.category === "blood"
        ? form.bloodTypes.length > 0
        : form.items.length > 0 || form.description.trim().length > 0) &&
      descriptionWithinLimit,
    location: !!form.location && form.address.trim().length > 0,
    urgency: !!form.urgency,
    contact: true,
    review: true,
  }[step];

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    const description = combineDescription(form.items, form.description);
    const bloodTypes = form.category === "blood" ? form.bloodTypes : [];
    // Built once and reused for both createPost and generate() below —
    // form.location only ever holds { lat, lng } (see StepLocation),
    // with the poster-typed address as a separate sibling field on
    // form, so the share card (which reads post.location.address) was
    // getting an object shaped differently from the one actually saved
    // to Firestore. Single shared shape here so that can't drift again.
    const location = {
      lat: form.location.lat,
      lng: form.location.lng,
      address: form.address.trim(),
    };
    const locationNote = form.locationNote.trim();
    const contact = form.contact.trim();
    try {
      const { id, editToken } = await createPost({
        category: form.category,
        description,
        bloodTypes,
        location,
        locationNote,
        urgency: form.urgency,
        contact,
      });
      saveMyPost(id, editToken);

      const imageDataUrl = await generate(
        {
          category: form.category,
          description,
          bloodTypes,
          location,
          locationNote,
          urgency: form.urgency,
          contact,
        },
        id,
      ).catch(() => null);

      setResult({
        postId: id,
        editToken,
        imageDataUrl,
        shareCaption: buildShareCaption({
          category: form.category,
          description,
          bloodTypes,
        }),
        shareUrl: postShareUrl(id),
      });
    } catch (err) {
      setSubmitError(
        "No se pudo crear la publicación. Intenta de nuevo. " +
          (err?.message || ""),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <SuccessScreen
        result={result}
        onDone={() => navigate("/")}
        onViewBoard={() => navigate("/quiero-ayudar")}
      />
    );
  }

  return (
    <div className="flow-page">
      {CardPortal}
      <button
        type="button"
        className="back-link"
        onClick={() => (stepIndex === 0 ? navigate("/") : back())}
      >
        <ChevronLeft /> Atrás
      </button>

      <ProgressDots total={STEPS.length} current={stepIndex} />

      {step === "category" && (
        <StepCategory
          value={form.category}
          onSelect={(category) => {
            // Chips (and blood type) are category-specific ("Cobijas"
            // doesn't belong to a Voluntariado post) — switching category
            // must drop whatever was picked under the old one, or a stale
            // selection rides along into the submitted post. Free text
            // resets too, since it's almost always written about the
            // category just left.
            update(
              category === form.category
                ? { category }
                : { category, items: [], bloodTypes: [], description: "" },
            );
            next();
          }}
        />
      )}

      {step === "description" && (
        <StepDescription
          category={form.category}
          items={form.items}
          onItemsChange={(items) => update({ items })}
          bloodTypes={form.bloodTypes}
          onBloodTypesChange={(bloodTypes) => update({ bloodTypes })}
          value={form.description}
          onChange={(description) => update({ description })}
          descriptionBytes={byteLength(finalDescription)}
          descriptionWithinLimit={descriptionWithinLimit}
          onNext={next}
          disabled={!canProceed}
        />
      )}

      {step === "location" && (
        <StepLocation
          value={form.location}
          onChange={(location) => update({ location })}
          address={form.address}
          onAddressChange={(address) => update({ address })}
          note={form.locationNote}
          onNoteChange={(locationNote) => update({ locationNote })}
          onNext={next}
          disabled={!canProceed}
        />
      )}

      {step === "urgency" && (
        <StepUrgency
          value={form.urgency}
          onSelect={(urgency) => {
            update({ urgency });
            next();
          }}
        />
      )}

      {step === "contact" && (
        <StepContact
          contact={form.contact}
          onContactChange={(contact) => update({ contact })}
          onNext={next}
        />
      )}

      {step === "review" && (
        <StepReview
          form={form}
          submitting={submitting}
          error={submitError}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function ProgressDots({ total, current }) {
  return (
    <div className="progress-dots" role="presentation">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`dot ${i <= current ? "active" : ""}`} />
      ))}
    </div>
  );
}

function StepCategory({ value, onSelect }) {
  return (
    <div className="step">
      <h2>¿Qué tipo de ayuda necesitas?</h2>
      <div className="option-grid">
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            type="button"
            className={`option-card ${value === key ? "selected" : ""}`}
            onClick={() => onSelect(key)}
          >
            <span className="option-icon">
              <FontAwesomeIcon icon={cat.icon} />
            </span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepDescription({
  category,
  items,
  onItemsChange,
  bloodTypes,
  onBloodTypesChange,
  value,
  onChange,
  descriptionBytes,
  descriptionWithinLimit,
  onNext,
  disabled,
}) {
  const categoryItems = CATEGORIES[category]?.items || [];
  const isBlood = category === "blood";

  function toggleItem(item) {
    onItemsChange(
      items.includes(item) ? items.filter((i) => i !== item) : [...items, item],
    );
  }

  function toggleBloodType(type) {
    onBloodTypesChange(
      bloodTypes.includes(type)
        ? bloodTypes.filter((t) => t !== type)
        : [...bloodTypes, type],
    );
  }

  return (
    <div className="step">
      <h2>Cuéntanos qué necesitas</h2>

      {isBlood && (
        <>
          {/* Multi-select — a family often doesn't know the exact type,
              or several compatible types would work, so this can't be
              exclusive like a radio group. At least one is required to
              continue (see canProceed in NeedHelp.jsx). */}
          <p className="step-hint">
            ¿Qué tipo(s) de sangre se necesita? — puedes elegir varios
          </p>
          <div className="chip-row" role="group" aria-label="Tipo de sangre">
            {BLOOD_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={bloodTypes.includes(type)}
                className={`chip ${bloodTypes.includes(type) ? "selected" : ""}`}
                onClick={() => toggleBloodType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </>
      )}

      {!isBlood && categoryItems.length > 0 && (
        <>
          <p className="step-hint">
            Toca lo que necesitas — puedes elegir varios
          </p>
          <div
            className="chip-row"
            role="group"
            aria-label="Selecciona lo que necesitas"
          >
            {categoryItems.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip ${items.includes(item) ? "selected" : ""}`}
                aria-pressed={items.includes(item)}
                onClick={() => toggleItem(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      )}

      <label className="field-label" htmlFor="description-input">
        {isBlood
          ? "Detalles adicionales (opcional)"
          : categoryItems.length > 0
            ? "¿Algo más específico? (opcional)"
            : "Describe qué necesitas"}
      </label>
      <textarea
        id="description-input"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          CATEGORIES[category]?.descriptionPlaceholder ||
          "Describe brevemente lo que necesitas…"
        }
        autoFocus={!isBlood && categoryItems.length === 0}
      />
      {/* Live counter measured the same way the server measures it
          (UTF-8 bytes, not characters) — see lib/text.js. Warns before
          the cap, blocks Continuar past it, and says why, instead of
          letting a post silently fail after "Publicar" like before. */}
      <p
        className={`char-counter ${
          !descriptionWithinLimit
            ? "char-counter-over"
            : descriptionBytes > DESCRIPTION_MAX_BYTES * 0.9
              ? "char-counter-warning"
              : ""
        }`}
      >
        {descriptionBytes} / {DESCRIPTION_MAX_BYTES} caracteres
      </p>
      {!descriptionWithinLimit && (
        <p className="field-error">
          Tu descripción es muy larga. Acórtala un poco para poder publicar.
        </p>
      )}
      <button
        type="button"
        className="primary-button"
        disabled={disabled}
        onClick={onNext}
      >
        Continuar
      </button>
    </div>
  );
}

function StepLocation({
  value,
  onChange,
  address,
  onAddressChange,
  note,
  onNoteChange,
  onNext,
  disabled,
}) {
  // No auto-suggested address — Nominatim's guesses weren't reliable
  // enough for Manizales' addressing. The poster marks the exact point
  // on the map, then types the address themselves; that's the only
  // address that ever gets saved.
  return (
    <div className="step">
      <h2>¿Dónde?</h2>
      <ManizalesMap
        mode="pick"
        value={value}
        onChange={onChange}
        height="280px"
      />

      <label className="field-label" htmlFor="address-input">
        Para mayor precisión, escribe por favor la dirección exacta de donde
        necesitas ayuda
      </label>
      <input
        id="address-input"
        type="text"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder="Ej: Calle 23 # 45-67, o el nombre del barrio"
      />

      <label className="field-label" htmlFor="location-note-input">
        Punto de referencia (opcional — si la dirección no es suficiente)
      </label>
      <input
        id="location-note-input"
        type="text"
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Ej: casa azul frente a la tienda, portería del conjunto…"
      />
      <button
        type="button"
        className="primary-button"
        disabled={disabled}
        onClick={onNext}
      >
        Continuar
      </button>
    </div>
  );
}

function StepUrgency({ value, onSelect }) {
  return (
    <div className="step">
      <h2>¿Qué tan urgente es?</h2>
      <div className="option-list">
        {Object.entries(URGENCY_LEVELS).map(([key, level]) => (
          <button
            key={key}
            type="button"
            className={`option-row ${value === key ? "selected" : ""}`}
            onClick={() => onSelect(key)}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepContact({ contact, onContactChange, onNext }) {
  return (
    <div className="step">
      <h2>Datos opcionales</h2>
      <label className="field-label" htmlFor="contact-input">
        Teléfono o WhatsApp (opcional — decides si lo compartes)
      </label>
      <input
        id="contact-input"
        type="tel"
        inputMode="tel"
        value={contact}
        onChange={(e) => onContactChange(e.target.value)}
        placeholder="Ej: 300 123 4567"
      />
      {/* Photo upload removed for now — it needs Firebase Storage,
          which requires the paid Blaze plan. See README for how to
          add it back later if that trade-off becomes worth it. */}

      <button type="button" className="primary-button" onClick={onNext}>
        Continuar
      </button>
    </div>
  );
}

function StepReview({ form, submitting, error, onSubmit }) {
  return (
    <div className="step">
      <h2>Revisa tu publicación</h2>
      <div className="review-card">
        <p>
          <strong>
            {CATEGORIES[form.category]?.icon && (
              <FontAwesomeIcon icon={CATEGORIES[form.category].icon} />
            )}{" "}
            {CATEGORIES[form.category]?.label}
          </strong>
        </p>
        {form.category === "blood" && form.bloodTypes.length > 0 && (
          <p>
            <FontAwesomeIcon icon={CATEGORIES.blood.icon} /> Tipo(s): {form.bloodTypes.join(", ")}
          </p>
        )}
        {combineDescription(form.items, form.description) && (
          <p>{combineDescription(form.items, form.description)}</p>
        )}
        <p>
          <FontAwesomeIcon icon={faLocationDot} /> <span className="detail-label">Dirección:</span> {form.address}
        </p>
        {form.locationNote && (
          <p>
            <FontAwesomeIcon icon={faCompass} /> <span className="detail-label">Referencia:</span>{" "}
            {form.locationNote}
          </p>
        )}
        <p>
          <FontAwesomeIcon icon={faClock} /> <span className="detail-label">Urgencia:</span>{" "}
          {URGENCY_LEVELS[form.urgency]?.label}
        </p>
        {form.contact && (
          <p>
            <FontAwesomeIcon icon={faPhone} /> {form.contact}
          </p>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
      <button
        type="button"
        className="primary-button"
        disabled={submitting}
        onClick={onSubmit}
      >
        {submitting ? "Publicando…" : "Publicar"}
      </button>
    </div>
  );
}

function SuccessScreen({ result, onDone, onViewBoard }) {
  const [sharing, setSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const manageLink = `${window.location.origin}/gestionar?post=${result.postId}&token=${result.editToken}`;

  async function handleShare() {
    setSharing(true);
    try {
      await shareOrDownloadImage({
        dataUrl: result.imageDataUrl,
        filename: `ayuda-manizales-${result.postId}.png`,
        title: "Afán Sí Tengo",
        text: `${result.shareCaption}\n\n${result.shareUrl}`,
      });
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyLink() {
    const ok = await copyToClipboard(manageLink);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  return (
    <div className="flow-page success-screen-page">
      <div className="step success-screen">
        <h2>Tu publicación está en línea</h2>
        <p>Compártela para que más personas la vean.</p>
        <p className="trust-message">
          Confía en tu gente. En momentos así, siempre hay un vecino cerca
          dispuesto a ayudar.
        </p>

        {/* Stacked on mobile; becomes image-left / actions-right on
            desktop (see the min-width media query in styles.css) — an
            image this tall reads poorly squeezed into a narrow centered
            column once there's real width to work with. */}
        <div className="success-screen-layout">
          {result.imageDataUrl && (
            <img
              className="success-screen-share-image"
              src={result.imageDataUrl}
              alt="Imagen para compartir"
            />
          )}

          <div className="success-screen-actions">
            {result.imageDataUrl && (
              <div className="success-screen-group">
                <button
                  type="button"
                  className="primary-button"
                  disabled={sharing}
                  onClick={handleShare}
                >
                  {sharing ? "Abriendo…" : "Compartir imagen"}
                </button>
                <a
                  className="secondary-button"
                  href={result.imageDataUrl}
                  download={`ayuda-manizales-${result.postId}.png`}
                >
                  Descargar imagen
                </a>
              </div>
            )}

            <div className="success-screen-group">
              <p className="manage-link-note">
                Guarda este enlace para marcar tu publicación como resuelta más
                adelante:
              </p>
              <code className="manage-link">{manageLink}</code>
              <button
                type="button"
                className="secondary-button"
                onClick={handleCopyLink}
              >
                {linkCopied ? (
                  <>
                    Enlace copiado <FontAwesomeIcon icon={faCheck} />
                  </>
                ) : (
                  "Copiar enlace"
                )}
              </button>
            </div>

            <div className="success-screen-group">
              <button
                type="button"
                className="secondary-button"
                onClick={onViewBoard}
              >
                Ver el mapa de ayuda
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={onDone}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
