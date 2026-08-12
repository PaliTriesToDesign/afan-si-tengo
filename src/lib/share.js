import { CATEGORIES } from './constants'

// The deep link a scanned QR / shared URL should open — straight to
// the specific posting, already highlighted (see GiveHelp.jsx's
// `highlightedFromQuery`). Centralized here so the card, the
// SuccessScreen, ManagePost, and the Give Help share button all
// build the exact same link instead of drifting apart.
export function postShareUrl(postId) {
  return `${window.location.origin}/quiero-ayudar?post=${postId}`
}

// Short caption that rides along with navigator.share's `text`
// field. WhatsApp Status and most non-Instagram share targets keep
// it (Instagram Stories strips shared text, but the card image
// carries the same info there anyway) — this saves the sharer from
// composing anything themselves at the exact moment they're
// stressed and moving fast.
export function buildShareCaption(post) {
  const label = CATEGORIES[post.category]?.label || 'Ayuda'
  // Blood type folded into the caption itself, not just the image —
  // Instagram strips shared text but WhatsApp keeps it, and a WhatsApp
  // forward often shows the caption before the image finishes loading.
  const bloodSuffix =
    post.bloodTypes?.length > 0 ? ` (Tipo ${post.bloodTypes.join('/')})` : ''
  const desc = (post.description || '').trim()
  const shortDesc = desc.length > 100 ? `${desc.slice(0, 97)}…` : desc
  return `Se necesita ayuda en Manizales — ${label}${bloodSuffix}: ${shortDesc}`
}

async function dataUrlToFile(dataUrl, filename) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  return new File([blob], filename, { type: blob.type || 'image/png' })
}

function triggerDownload(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// Tries the native share sheet first — on a phone, that's two taps
// to WhatsApp Status, a specific group chat, or Instagram, instead
// of "find the file in the gallery, open the other app, attach it
// manually." Falls back to a plain download wherever file sharing
// isn't supported (most desktop browsers, some older mobile
// browsers). Returns what actually happened so callers can decide
// whether to still show an inline preview/manual download link.
export async function shareOrDownloadImage({ dataUrl, filename, title, text }) {
  try {
    const file = await dataUrlToFile(dataUrl, filename)
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text })
      return 'shared'
    }
  } catch (err) {
    // AbortError just means the person closed the share sheet without
    // picking anything — not a failure worth falling back from.
    if (err?.name === 'AbortError') return 'cancelled'
  }
  triggerDownload(dataUrl, filename)
  return 'downloaded'
}

// Copies text to the clipboard, with a manual fallback for browsers/
// contexts where the async Clipboard API isn't available (older
// mobile browsers, some in-app browsers) — a person saving their
// manage link is exactly the moment a silent failure would hurt.
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through to the manual fallback below
    }
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok
}
