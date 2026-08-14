import { useEffect, useRef, useState } from 'react'

// Clamps a post's description to 4 lines and only shows "... leer
// más" when the text actually overflows at that clamp — a short
// description shouldn't get a pointless toggle. `expanded` lives
// here, one instance per card (GiveHelp.jsx renders one of these per
// post), so expanding one card's text never affects any other.
export default function PostDescription({ text }) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    // Only worth measuring while clamped — once expanded there's
    // nothing left to detect, and re-measuring on every render of an
    // already-expanded card would be wasted work.
    setOverflowing(el.scrollHeight > el.clientHeight + 1)
  }, [text, expanded])

  return (
    <div className="post-description">
      <p ref={ref} className={expanded ? '' : 'post-description-clamped'}>
        {text}
      </p>
      {overflowing && (
        <button
          type="button"
          className="post-description-toggle"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((v) => !v)
          }}
        >
          {expanded ? 'Leer menos' : '… leer más'}
        </button>
      )}
    </div>
  )
}
