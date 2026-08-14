import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons'
import { copyToClipboard } from '../lib/share.js'

// Small copy-to-clipboard icon for phone numbers — same idea as the
// one wired into the map popup (see ManizalesMap.jsx), just as a
// normal React component since post cards render as JSX, not raw
// HTML strings.
export default function CopyButton({ text, label = 'Copiar número' }) {
  const [copied, setCopied] = useState(false)

  async function handleClick(e) {
    e.stopPropagation()
    const ok = await copyToClipboard(text)
    if (!ok) return
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      className={`copy-button${copied ? ' copy-button-done' : ''}`}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
    </button>
  )
}
