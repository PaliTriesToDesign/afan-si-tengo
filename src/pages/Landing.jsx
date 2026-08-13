import { useState } from "react";
import { useRouter } from "../lib/router.jsx";
import { useAwarenessShareImage } from "../components/ShareImageCard.jsx";
import { shareOrDownloadImage } from "../lib/share.js";
import { ACTIVE_CITY } from "../lib/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLifeRing, faBullhorn } from "@fortawesome/free-solid-svg-icons";

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
      {/* Cathedral tower, crumbling — 9-frame pixel-art loop, see
          .landing-cathedral / @keyframes cathedral-crumble in
          styles.css for the frame timing and sprite sheet layout. */}
      <div className="landing-cathedral" aria-hidden="true" />

      {/* Everything but the cathedral — wrapped so it can sit beside
          the tower on desktop while staying a single stacked column
          on mobile. See .landing-content in styles.css. */}
      <div className="landing-content">
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
            <span className="big-button-icon">
              <span className="pixel-sprite pixel-sprite-hand-up" />
            </span>
            Necesito Ayuda
          </button>

          <button
            type="button"
            className="big-button give"
            onClick={() => navigate("/quiero-ayudar")}
          >
            <span className="big-button-icon">
              <span className="pixel-sprite pixel-sprite-hand-down" />
            </span>
            Quiero Ayudar
          </button>

          <button
            type="button"
            className="big-button donate"
            onClick={() => navigate("/donar")}
          >
            <span className="big-button-icon">
              <span className="pixel-sprite pixel-sprite-coin" />
            </span>
            Donar $
          </button>
        </div>

        <button
          type="button"
          className="share-app-link"
          disabled={sharingAwareness}
          onClick={handleShareAwareness}
        >
          {sharingAwareness ? (
            "Generando…"
          ) : (
            <>
              <FontAwesomeIcon icon={faBullhorn} /> Comparte esta iniciativa
            </>
          )}
        </button>
      </div>
    </div>
  );
}
