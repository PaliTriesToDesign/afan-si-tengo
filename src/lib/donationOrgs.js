// Verified organizations actively running campaigns for the August 10,
// 2026 Colombia earthquake, checked directly against each org's own
// site (or, where noted, official news coverage). Money is never
// handled inside this app — these links route straight to the
// official page.
//
// The list is intentionally split by language, not just translated:
// the Spanish page shows Colombia/Manizales-specific channels, the
// English page shows international ones (easier for people abroad to
// trust and donate to). Add new orgs to the matching language array
// below — that's the only file that needs touching.
export const DONATION_ORGS = {
  es: [
    {
      name: "Cruz Roja Colombiana",
      desc: "Campaña oficial del sismo. Apoya salud, agua potable, telecomunicaciones, rescate, alimentación y kits de emergencia.",
      url: "https://ayuda.cruzrojacolombiana.org/emergencia-colombia-terremoto",
    },
    {
      name: "ABACO – Bancos de Alimentos de Colombia",
      desc: "Corredor humanitario nacional. El punto de acopio en Manizales es el Banco de Alimentos de Manizales; los fondos se destinan a transporte humanitario y compra de alimentos.",
      url: "https://donahoy.abaco.org.co/colombia2026",
    },
  ],
  en: [
    {
      name: "Canadian Red Cross",
      desc: "Colombia Earthquake Appeal. Funds support immediate relief, recovery, and preparedness for people affected by the quake.",
      url: "https://give.redcross.ca/page/26CEA?_lang=en",
    },
  ],
};

// Orgs we know about but don't have confirmed donation info for yet
// (no verified link/campaign details to point people to). Shown on
// both language versions as a placeholder, not a live link. Empty for
// now — add entries here (e.g. { name: { es, en } }) as they come up.
export const PENDING_ORGS = [];

export const DONATE_CAUTION = {
  es: "Dona solo a través del sitio oficial de cada organización. Desconfía de solicitudes de dinero por WhatsApp, tarjetas de regalo o transferencias a cuentas personales.",
  en: "Only donate through each organization’s official website. Be wary of requests for money via WhatsApp, gift cards, or personal account transfers.",
};
