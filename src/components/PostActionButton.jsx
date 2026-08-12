import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// Every action on a post card (voy a ayudar, compartir, reportar, ya
// tienen suficiente...) runs through this same shell: tap the icon,
// a small popover opens with a shared trust reminder and whatever
// confirm UI that specific action needs, tap confirm to actually do
// it. Nothing fires on the first tap — that's the point. This app
// has no accounts and no ratings; the only thing standing between a
// tap and a real-world action is the person meaning it, so every
// action gets one extra beat to make that explicit instead of firing
// instantly like a "like" button would.
//
// Icons are FontAwesome for now (see icons.js) — swappable for pixel
// art later without touching this component, same "one-file change"
// principle as the share-image branding placeholder.
const DEFAULT_TRUST_NOTE =
  'Esta app funciona por confianza entre vecinos. Confirma solo si de verdad vas a cumplirlo.'

export default function PostActionButton({
  icon,
  label,
  active = false,
  activeIcon = null,
  trustNote = DEFAULT_TRUST_NOTE,
  children,
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // Closing on outside-tap matters more here than in a typical
  // dropdown: these popovers sit over a scrolling list of posts, and
  // an accidental tap elsewhere shouldn't leave a stale confirm
  // dialog floating over the wrong card.
  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [open])

  function toggle(e) {
    e.stopPropagation()
    if (active) return
    setOpen((o) => !o)
  }

  function close() {
    setOpen(false)
  }

  return (
    <div className="action-btn-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`action-icon-btn${active ? ' is-active' : ''}`}
        aria-label={label}
        aria-expanded={open}
        disabled={active}
        onClick={toggle}
        title={label}
      >
        <FontAwesomeIcon icon={active && activeIcon ? activeIcon : icon} />
      </button>

      {open && (
        <div className="action-tooltip" role="dialog" onClick={(e) => e.stopPropagation()}>
          <span className="action-tooltip-arrow" aria-hidden="true" />
          <p className="action-tooltip-trust">{trustNote}</p>
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  )
}
