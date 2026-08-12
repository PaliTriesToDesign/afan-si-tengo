import { useState } from "react";
import { useRouter } from "../lib/router.jsx";
import { useAwarenessShareImage } from "../components/ShareImageCard.jsx";
import { shareOrDownloadImage } from "../lib/share.js";
import { ACTIVE_CITY } from "../lib/constants";

export default function Landing() {
  const { navigate } = useRouter();
  const { generate, CardPortal } = useAwarenessShareImage();
  const [sharingAwareness, setSharingAwareness] = useState(false);

  // Not tied to any post — an asset for spreading word of the whole
  // platform, meant to be handed to people with existing reach
  // (a community group admin, a local page) rather than only
  // circulating peer-to-peer through individual postings.
  async function handleShareAwareness() {
    setSharingAwareness(true);
    try {
      const dataUrl = await generate();
      await shareOrDownloadImage({
        dataUrl,
        filename: "afan-si-tengo.png",
        title: "Afán Sí Tengo",
        text: `Manizales necesita ayuda — súmate a esta red vecinal (sin registro, sin cuentas): ${window.location.origin}/`,
      });
    } catch {
      // Best-effort secondary action — no error state needed here.
    } finally {
      setSharingAwareness(false);
    }
  }

  return (
    <div className="landing">
      {CardPortal}
      {/* Logo/branding placeholder — swap this block for a real
          logo or pixel-art asset later without touching layout. */}
      <div className="brand-placeholder" aria-hidden="true" />

      <h1>Afán Sí Tengo: {ACTIVE_CITY.label}</h1>
      <p className="landing-subtitle">
        Conecta a quienes necesitan ayuda con quienes quieren ayudar.
      </p>

      <div className="landing-buttons">
        <button
          type="button"
          className="big-button need"
          onClick={() => navigate("/necesito-ayuda")}
        >
          <span className="big-button-icon">🆘</span>
          Necesito Ayuda
        </button>

        <button
          type="button"
          className="big-button give"
          onClick={() => navigate("/quiero-ayudar")}
        >
          <span className="big-button-icon">🤝</span>
          Quiero Ayudar
        </button>

        <button
          type="button"
          className="big-button donate"
          onClick={() => navigate("/donar")}
        >
          <span className="big-button-icon">💛</span>
          Donar $
        </button>
      </div>

      <button
        type="button"
        className="share-app-link"
        disabled={sharingAwareness}
        onClick={handleShareAwareness}
      >
        {sharingAwareness ? "Generando…" : "📣 Comparte esta iniciativa"}
      </button>
    </div>
  );
}
