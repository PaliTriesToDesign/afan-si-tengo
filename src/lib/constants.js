import {
  faBoxOpen,
  faPeopleCarryBox,
  faHouse,
  faDroplet,
  faPaw,
  faCircle,
  faWrench,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

// ============================================================
// City config — add another city here later by giving it the
// same shape (label, center, zoom, viewbox). Everything that
// needs "Manizales" (map default, geocoding bounds) reads from
// this object instead of hardcoding coordinates elsewhere.
//
// viewbox is [west, north, east, south] used with Nominatim's
// bounded=1 so geocoding results outside the city are rejected.
// ============================================================
export const CITIES = {
  manizales: {
    label: "Manizales",
    center: [5.070275, -75.517583],
    zoom: 13,
    viewbox: [-75.6, 5.15, -75.44, 4.98],
  },
};

// Only one city for this test phase — this constant is what the
// rest of the app reads. Swapping to a picker later just means
// adding entries to CITIES above and rendering a <select>.
export const ACTIVE_CITY_KEY = "manizales";
export const ACTIVE_CITY = CITIES[ACTIVE_CITY_KEY];

// ============================================================
// Need categories — shared between the Need Help form, the
// Give Help filters, and the share-image template.
// ============================================================
// `items` are quick-fill chips shown above the free-text field in
// StepDescription — tapping one adds it to the list of things needed.
// They speed up the common case but never replace the text field:
// anything specific (a size, a quantity, a medical detail) still goes
// in as free text alongside the selected chips. See the "Need Help
// item chips decision" — chips assist, they don't gate the field.
// Icons here are the "main feature" set — FontAwesome for now, but
// these four (plus the landing page's need/give/donate buttons,
// which reuse volunteer/blood-adjacent icons) are the ones flagged
// to eventually become custom pixel-art sprites. Every render site
// reads from this one object, so swapping FontAwesome -> pixel art
// later is a change here, not a hunt through every page.
export const CATEGORIES = {
  supplies: {
    label: "Suministros",
    icon: faBoxOpen,
    items: [
      "Agua",
      "Comida",
      "Medicinas",
      "Cobijas",
      "Pañales",
      "Botiquín",
      "Linterna / pilas",
      "Aseo personal",
    ],
    descriptionPlaceholder: "Ej: talla de ropa, cuántas personas, alguna alergia o condición médica…",
  },
  volunteer: {
    label: "Voluntariado / mano de obra",
    // Deliberately not faHandshake — that's already ACTION_ICONS.helperPing
    // (see lib/icons.js), and a volunteer-category post shows both icons
    // on the same card, so reusing it would put two identical icons with
    // different meanings side by side.
    icon: faPeopleCarryBox,
    items: [
      "Remover escombros",
      "Transporte",
      "Cocinar",
      "Cuidado de niños",
      "Atención médica",
      "Carga pesada",
    ],
    descriptionPlaceholder: "Ej: cuántas manos se necesitan, herramientas requeridas, horario…",
  },
  housing: {
    label: "Alojamiento temporal",
    icon: faHouse,
    items: [
      "Para 1 persona",
      "Para una familia",
      "Por unos días",
      "Por unas semanas",
    ],
    descriptionPlaceholder: "Ej: cuántas personas, con o sin mascotas, condiciones del espacio…",
  },
  // No `items` chips — blood type is its own required field, not
  // this category's item list. NeedHelp.jsx's StepDescription
  // branches on category === 'blood' to render BLOOD_TYPES as its
  // own multi-select chip row, and canProceed requires at least one
  // type before continuing.
  blood: {
    label: "Sangre",
    icon: faDroplet,
    descriptionPlaceholder: "Ej: cantidad de unidades, para qué procedimiento, plazo…",
  },
  // Scope is deliberately narrow: temporary care/fostering + supplies,
  // not lost & found matching. A lost/found board is a two-sided
  // matching problem (a "found" post and a "lost" post need to find
  // EACH OTHER) that doesn't fit this app's one-directional need →
  // helper model — that's a bigger, separate feature if it happens.
  pets: {
    label: "Mascotas",
    icon: faPaw,
    items: [
      "Cuidado temporal",
      "Comida para mascotas",
      "Transportadora / jaula",
      "Correa / arnés",
      "Arena para gatos",
      "Medicina veterinaria",
      "Vacunación",
      "Baño / peluquería",
    ],
    descriptionPlaceholder: "Ej: especie, tamaño, cuánto tiempo se necesita el cuidado…",
  },
};

// Multi-select, at least one required for category "blood" — a poster
// often doesn't know the exact type or several compatible types would
// work, so this can't be an exclusive radio choice. Captured as its
// own field (not folded into free text) so it stays scannable/filterable.
export const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "No sé"];

// Hard ceiling on the saved `description` field, measured in UTF-8
// bytes (see lib/text.js byteLength) — MUST match the cap in
// firestore.rules (`description.size() <= DESCRIPTION_MAX_BYTES`) or
// the two drift and posts start failing again with no clear reason.
// Was 500 — raised after a real donation-list post (a full supply
// list for a shelter, ~900 bytes) got silently rejected. 3000 gives
// real headroom for a structured list like that one while still
// keeping individual posts scannable on a card/map popup.
export const DESCRIPTION_MAX_BYTES = 3000;

// `color` drives the map marker + legend so urgency is readable
// at a glance while panning the city, not just inside each card.
export const URGENCY_LEVELS = {
  now: { label: "Ahora mismo", order: 0, color: "#d64526" },
  today: { label: "Hoy", order: 1, color: "#c98a1b" },
  week: { label: "Esta semana", order: 2, color: "#3f7a52" },
};

export const POST_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  COVERED: "covered",
  RESOLVED: "resolved",
};

// Shown on post cards / the map popup / ManagePost. OPEN/IN_PROGRESS/
// RESOLVED are poster-controlled and authoritative (set only via the
// manage link — see the "Give Help status tracking" decision).
// COVERED is different: it's crowd-inferred from "ya tienen
// suficiente" votes (see below), not poster-confirmed, so it's kept
// reversible and visually distinct from a real "Resuelta".
export const STATUS_LABELS = {
  [POST_STATUS.OPEN]: { label: "Abierta", icon: faCircle },
  [POST_STATUS.IN_PROGRESS]: { label: "En proceso", icon: faWrench },
  [POST_STATUS.COVERED]: { label: "Posiblemente cubierta", icon: faCircleCheck },
  [POST_STATUS.RESOLVED]: { label: "Resuelta", icon: faCircleCheck },
};

// ============================================================
// "Voy a ayudar" helper pings — a zero-login, non-authoritative
// signal so people don't pile onto the same post. Each ping is a
// client-side timestamp (ms) stored in the post's `helperPings`
// array. A ping only counts as "active" for HELPER_PING_EXPIRY_MS
// after it was made, so the count self-clears instead of needing
// a backend job to expire it. HELPER_PING_COOLDOWN_MS is how long
// a single browser's own tap keeps showing "Ya avisaste" before it
// could ping the same post again (stored in localStorage, not
// Firestore — it's just a courtesy against accidental double-taps,
// not real deduplication, matching the app's soft-trust model).
// ============================================================
export const HELPER_PING_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8h
export const HELPER_PING_COOLDOWN_MS = 60 * 60 * 1000; // 1h

// ============================================================
// "Ya tienen suficiente" / "Todavía se necesita ayuda" — the
// reciprocal pair that drives the COVERED status. Same shape as
// helper pings (timestamped arrays, expiry, per-browser cooldown),
// but these two DO change post status once a threshold is crossed:
//
// - 3 active "ya tienen suficiente" votes → status flips to COVERED
//   (grayed out, dropped to the bottom of Give Help, hidden behind
//   a "mostrar cubiertas" toggle — but never fully deleted).
// - 2 active "todavía se necesita ayuda" votes on a COVERED post →
//   status flips back to OPEN. The reopen bar is deliberately lower
//   than the cover bar: in a safety context, wrongly showing a post
//   as still needing help is the cheaper mistake, so reopening
//   should be easier than locking.
//
// Both thresholds are intentionally small (not 1) so a single bad-
// faith or premature vote can't flip real-world state on its own.
// ============================================================
export const COVERED_VOTE_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8h
export const COVERED_VOTE_COOLDOWN_MS = 60 * 60 * 1000; // 1h
export const COVERED_VOTE_THRESHOLD = 3;
export const STILL_NEEDED_VOTE_THRESHOLD = 2;

// Colombia-wide emergency numbers shown as a persistent reminder
// that this app is a community coordination tool, not an
// official emergency service.
export const EMERGENCY_NOTICE = {
  es: "Esta es una herramienta comunitaria, no un servicio de emergencia oficial. Para emergencias reales, llama al 123, Cruz Roja o Bomberos.",
  en: "This is a community tool, not an official emergency service. For real emergencies, call 123, the Red Cross, or the Fire Department.",
};
