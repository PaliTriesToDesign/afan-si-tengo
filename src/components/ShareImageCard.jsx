import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { CATEGORIES, URGENCY_LEVELS, ACTIVE_CITY } from "../lib/constants";
import { postShareUrl } from "../lib/share.js";

// Instagram/WhatsApp Story dimensions.
const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

// Card shows the same detail level as the live posting (full
// address, contact if provided) — a deliberate call to prioritize
// actionability over the more conservative "neighborhood only"
// default, made with eyes open to the tradeoff of that leaving
// the app and circulating on social media.

// A relative "hace X" would be baked into a static PNG at the
// moment it's generated and never update — it goes wrong (or
// misleadingly fresh) the instant anyone views it later than that
// exact second. An absolute date stays true no matter when the
// image is viewed, so that's what the card shows instead.
function formatDateEs(date) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
  }).format(date);
}

// A QR only helps if the viewer has a second device and bothers to
// scan it — a lot of consumption happens as a flat image scrolling
// past in a forwarded WhatsApp chain, where a plain, copy-paste-able
// URL underneath is what actually gets used. Protocol stripped since
// it reads cleaner and nobody's typing "https://" by hand anyway.
function displayUrl(url) {
  return url.replace(/^https?:\/\//, "");
}

/**
 * Every new "Need Help" post turns into a downloadable share
 * image — the site alone won't reach enough people, so this is
 * treated as a core feature. Generated fully client-side (no
 * backend image service needed).
 *
 * Usage: const { generate, CardPortal } = useShareImage()
 *   - render {CardPortal} once, anywhere in the tree
 *   - call await generate(post, postId, createdAt?) to get back a
 *     PNG data URL. createdAt (a JS Date) is optional — omit it at
 *     creation time (the post is brand new, so today's date is
 *     correct by default); pass the real post.createdAt when
 *     regenerating the image later, e.g. from the manage-post page,
 *     so the printed date reflects when the post actually went up.
 */
export function useShareImage() {
  const nodeRef = useRef(null);
  const [post, setPost] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [postedAt, setPostedAt] = useState(null);

  const generate = useCallback(async (postData, postId, createdAt = null) => {
    const url = postShareUrl(postId);
    const qr = await QRCode.toDataURL(url, { width: 320, margin: 1 });

    setQrDataUrl(qr);
    setShareUrl(url);
    setPost(postData);
    setPostedAt(createdAt);

    // Let React paint the hidden card with the new data before capturing it.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    return toPng(nodeRef.current, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      pixelRatio: 1,
    });
  }, []);

  const CardPortal = (
    <div className="share-card-offscreen" aria-hidden="true">
      <div
        ref={nodeRef}
        className="share-card"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        {post && (
          <>
            {/* Top cluster = the facts someone scrolling past has to
                register in half a second: what kind of help, how
                urgent, and — for blood — the one detail that's a hard
                match/no-match. Everything below is read only by
                someone who's already stopped scrolling. */}

            {/* Logo/branding placeholder — swap for a real asset later. */}
            <div className="share-card-logo-placeholder" />

            <div className="share-card-category">
              <span className="share-card-icon">
                {CATEGORIES[post.category]?.icon}
              </span>
              <span>{CATEGORIES[post.category]?.label}</span>
            </div>

            <div
              className="share-card-urgency"
              style={{ background: URGENCY_LEVELS[post.urgency]?.color }}
            >
              ⏱ {URGENCY_LEVELS[post.urgency]?.label}
            </div>

            {/* Blood type is the one piece of info that has to land in
                a half-second glance at a forwarded story — a passerby
                either matches it or scrolls past, so it gets its own
                high-contrast badge instead of living inside the
                description paragraph with everything else. */}
            {post.bloodTypes?.length > 0 && (
              <div className="share-card-blood-type">
                🩸 Tipo {post.bloodTypes.join(" / ")}
              </div>
            )}

            <h2 className="share-card-headline">
              Se necesita ayuda en {ACTIVE_CITY.label}
            </h2>

            <p className="share-card-description">{post.description}</p>

            {/* Where, then how to reach — in that order, since knowing
                the place is what lets a helper decide "can I go,"
                before the phone number becomes relevant. Icon + label
                + value on each line, same three-part pattern as the
                review card's .detail-label. */}
            <p className="share-card-address">
              📍 <span className="share-card-label">Dirección:</span>{" "}
              {post.location?.address}
            </p>
            {post.locationNote && (
              <p className="share-card-note">
                🧭 <span className="share-card-label">Referencia:</span>{" "}
                {post.locationNote}
              </p>
            )}
            {post.contact && (
              <p className="share-card-contact">
                📞 <span className="share-card-label">Contacto:</span>{" "}
                {post.contact}
              </p>
            )}

            {/* How to help — QR for a second device, plain URL for a
                forwarded screenshot, CTA tying the two together. */}
            {qrDataUrl && (
              <img className="share-card-qr" src={qrDataUrl} alt="" />
            )}
            {shareUrl && (
              <p className="share-card-url">{displayUrl(shareUrl)}</p>
            )}
            <p className="share-card-cta">
              Escanea o visita el sitio para ayudar
            </p>

            {/* Lowest-priority fact on the card — when it was posted
                matters far less than what/where/how, so it's pushed
                to the bottom in the smallest, most muted text. */}
            <p className="share-card-date">
              Publicado el {formatDateEs(postedAt || new Date())}
            </p>

            <p className="share-card-trust">
              Confía en tu gente. En momentos así, siempre hay un vecino cerca
              dispuesto a ayudar.
            </p>

            <p className="share-card-footer">Imagen creada en afansitengo.co</p>
          </>
        )}
      </div>
    </div>
  );

  return { generate, CardPortal };
}

/**
 * A second, non-post-specific share card: not tied to any single
 * need, just an awareness asset for the platform as a whole. Meant
 * to be handed to people with existing reach — a community WhatsApp
 * group admin, a local page — so one repost from an account with
 * real local following can outperform a lot of individual peer
 * shares. Same dimensions and visual language as the post card, so
 * the two feel like they belong to the same thing when they
 * circulate side by side.
 *
 * Usage: const { generate, CardPortal } = useAwarenessShareImage()
 *   - render {CardPortal} once, anywhere in the tree
 *   - call await generate() to get back a PNG data URL
 */
export function useAwarenessShareImage() {
  const nodeRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [homeUrl, setHomeUrl] = useState(null);

  const generate = useCallback(async () => {
    const url = `${window.location.origin}/`;
    const qr = await QRCode.toDataURL(url, { width: 320, margin: 1 });

    setQrDataUrl(qr);
    setHomeUrl(url);
    setReady(true);

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );

    return toPng(nodeRef.current, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      pixelRatio: 1,
    });
  }, []);

  const CardPortal = (
    <div className="share-card-offscreen" aria-hidden="true">
      <div
        ref={nodeRef}
        className="share-card"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        {ready && (
          <>
            {/* Logo/branding placeholder — swap for a real asset later. */}
            <div className="share-card-logo-placeholder" />

            <h2 className="share-card-headline">Manizales necesita ayuda</h2>

            <p className="share-card-description">
              Súmate a la red comunitaria que conecta a quienes necesitan ayuda
              con quienes pueden darla después del terremoto.
            </p>

            {qrDataUrl && (
              <img className="share-card-qr" src={qrDataUrl} alt="" />
            )}
            {homeUrl && <p className="share-card-url">{displayUrl(homeUrl)}</p>}
            <p className="share-card-cta">Escanea o visita el sitio</p>

            <p className="share-card-trust">
              Confía en tu gente. En momentos así, siempre hay un vecino cerca
              dispuesto a ayudar.
            </p>

            <p className="share-card-footer">Imagen creada en afansitengo.co</p>
          </>
        )}
      </div>
    </div>
  );

  return { generate, CardPortal };
}
