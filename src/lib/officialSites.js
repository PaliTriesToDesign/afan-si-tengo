// Predetermined "Official Sites" pins for the Give Help map — purely
// informational, no post-style actions (no report, no share, no
// helper ping). Each entry renders as a bigger, square, rounded-corner
// marker (see officialSiteIcon in ManizalesMap.jsx) so it reads as
// "official reference point" at a glance, distinct from the teardrop
// pins used for community need postings.
//
// Add a new site by appending an object with this same shape —
// nothing else in the app needs to change.
//
// COORDINATES: `lat`/`lng` are only set once verified against a real
// map (not guessed from the street address — Manizales' address grid
// doesn't reliably convert to lat/lng, same reason ManizalesMap.jsx
// dropped auto-geocoding for the Need Help flow). Entries with
// lat: null are skipped when rendering — to finish one, open Google
// Maps, search the address below, right-click the pin → "¿Qué hay
// aquí?" to copy the coordinates, then paste them in and you're done.
// Text-only labels — no per-type color or icon. Map markers and the
// legend use one consistent style for every official site (see
// officialSiteIcon in ManizalesMap.jsx and .official-marker-pin in
// styles.css), so a single "Sitio oficial" legend entry actually
// matches everything on the map instead of standing in for a handful
// of different colors.
export const OFFICIAL_SITE_TYPES = {
  gobierno: { label: "Gobierno" },
  salud: { label: "Salud / Emergencias" },
  bomberos: { label: "Bomberos" },
  albergue: { label: "Albergue / Escenario deportivo" },
  educacion: { label: "Universidad" },
  otros: { label: "Otro sitio oficial" },
};

export const OFFICIAL_SITES = [
  {
    id: "alcaldia-manizales",
    name: "Alcaldía de Manizales",
    type: "gobierno",
    address:
      "Centro Administrativo Municipal (CAM), Calle 19 No. 21-44, Manizales",
    lat: 5.0677423,
    lng: -75.5198961,
    website: "https://manizales.gov.co",
    instagram: "https://www.instagram.com/alcaldiademanizales/",
  },
  {
    id: "coliseo-mayor",
    name: "Coliseo Mayor Jorge Arango Uribe",
    type: "albergue",
    address:
      "Cra. 24, sector Palogrande (junto al Estadio Palogrande), Manizales",
    lat: 5.05804,
    lng: -75.48845,
    // No sitio/IG propio — lo gestiona la Secretaría de Deporte bajo
    // los canales generales de la Alcaldía.
    website: "https://manizales.gov.co",
    instagram: "https://www.instagram.com/alcaldiademanizales/",
  },
  {
    id: "coliseo-menor",
    name: "Coliseo Menor Ramón Marín Vargas",
    type: "albergue",
    address: "Sector Palogrande, junto al Coliseo Mayor, Manizales",
    lat: 5.055944843287264,
    lng: -75.4879020426807,
    website: "https://manizales.gov.co",
    instagram: "https://www.instagram.com/alcaldiademanizales/",
  },
  {
    id: "cruz-roja-caldas",
    name: "Cruz Roja Colombiana – Seccional Caldas",
    type: "salud",
    address: "Carrera 21 #69-350, Av. Kevin Ángel, Manizales",
    lat: 5.051172128002588,
    lng: -75.48193129140962,
    website: "https://www.cruzrojacaldas.org/",
    instagram: "https://www.instagram.com/seccional_caldas/",
  },
  {
    id: "bomberos-fundadores",
    name: "Cuerpo Oficial de Bomberos de Manizales — Estación Fundadores",
    type: "bomberos",
    address: "Carrera 20 #32-29, Manizales",
    lat: 5.068952688884844,
    lng: -75.51000527406552,
    website: "https://manizales.gov.co/category/cuerpo-oficial-de-bomberos/",
    // Sin IG propia confirmada para el cuerpo oficial (no confundir
    // con @bomberosmanizales, que es el cuerpo de voluntarios, una
    // entidad distinta) — se usa el canal de la Alcaldía.
    instagram: "https://www.instagram.com/alcaldiademanizales/",
  },
  {
    id: "bomberos-palogrande",
    name: "Cuerpo Oficial de Bomberos de Manizales — Estación Palogrande",
    type: "bomberos",
    address: "Calle 62, sector Palogrande, Manizales",
    lat: 5.058273624264865,
    lng: -75.48975570097045,
    website: "https://manizales.gov.co/category/cuerpo-oficial-de-bomberos/",
    instagram: "https://www.instagram.com/alcaldiademanizales/",
  },
  {
    id: "universidad-de-caldas",
    name: "Universidad de Caldas",
    type: "educacion",
    address: "Calle 65 #26-10, Ciudad Universitaria, Manizales",
    lat: null, // TODO: verificar coordenadas exactas (ver nota arriba)
    lng: null,
    website: "https://www.ucaldas.edu.co/portal/",
    instagram: "https://www.instagram.com/udecaldas/",
  },
  {
    id: "universidad-nacional-manizales",
    name: "Universidad Nacional de Colombia — Sede Manizales",
    type: "educacion",
    address: "Carrera 27 #64-60, Manizales",
    lat: null, // TODO: verificar coordenadas exactas (ver nota arriba)
    lng: null,
    website: "https://manizales.unal.edu.co/",
    instagram: "https://www.instagram.com/manizalesunal/",
  },
];
