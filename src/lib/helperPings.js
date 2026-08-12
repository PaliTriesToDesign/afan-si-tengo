import { HELPER_PING_COOLDOWN_MS } from './constants'

// ============================================================
// Local, per-browser record of "Voy a ayudar" taps. This is
// deliberately separate from the `helperPings` field stored in
// Firestore (see firebase.js / constants.js): the Firestore array is
// the shared count everyone sees, this localStorage record is just
// "did *this* browser already tap the button recently" — so someone
// can't inflate a post's count by mashing the button, and so the
// button can show "Ya avisaste ✓" instead of just being clickable
// forever. Like the rest of the app's trust model, it's a courtesy,
// not real enforcement — clearing localStorage resets it.
// ============================================================
const PINGED_KEY = 'ayudaManizales.pingedPosts'

function readPinged() {
  try {
    return JSON.parse(localStorage.getItem(PINGED_KEY)) || {}
  } catch {
    return {}
  }
}

function writePinged(map) {
  localStorage.setItem(PINGED_KEY, JSON.stringify(map))
}

// True if this browser pinged this post within the cooldown window.
export function hasRecentlyPinged(postId) {
  const pinged = readPinged()
  const at = pinged[postId]
  return typeof at === 'number' && Date.now() - at < HELPER_PING_COOLDOWN_MS
}

export function recordPing(postId) {
  const pinged = readPinged()
  pinged[postId] = Date.now()
  writePinged(pinged)
}
