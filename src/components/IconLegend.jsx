import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { InfoCircle } from "./Icons.jsx";
import { ACTION_ICONS } from "../lib/icons";

// Desktop gets a hover title on each icon button (see PostActionButton
// — title={label}). That doesn't exist on a touchscreen, so this is
// the tap-to-open equivalent: one explainer covering all four actions
// at once, instead of repeating a 5th icon on every single card (which
// would undo the work put into keeping cards compact). Also carries
// the three-word framing for why the whole confirm-tooltip system
// exists in the first place — not just what each icon does.
const ITEMS = [
  {
    icon: ACTION_ICONS.helperPing,
    label: "Voy a ayudar",
    desc: "Avisa a otros que vas a ir a ayudar con esta publicación.",
  },
  {
    icon: ACTION_ICONS.share,
    label: "Compartir",
    desc: "Genera una imagen de esta publicación para compartir en redes o WhatsApp.",
  },
  {
    icon: ACTION_ICONS.covered,
    label: "Ya tienen suficiente / Todavía se necesita ayuda",
    desc: "Avisa si este sitio ya está cubierto, o si en realidad todavía necesita ayuda.",
  },
  {
    icon: ACTION_ICONS.report,
    label: "Reportar",
    desc: "Marca una publicación falsa, inapropiada o que ya fue resuelta.",
  },
];

export default function IconLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="icon-legend">
      <button
        type="button"
        className="icon-legend-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <InfoCircle size={15} /> ¿Qué significan los íconos?
      </button>

      {open && (
        <div className="icon-legend-panel">
          <ul className="icon-legend-list">
            {ITEMS.map((item) => (
              <li key={item.label}>
                <span className="icon-legend-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <p>{item.desc}</p>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
