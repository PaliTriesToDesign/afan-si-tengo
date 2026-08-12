// Generic version of the per-browser cooldown pattern used by helper
// pings (see helperPings.js) — reused here for the covered /
// still-needed votes so one browser can't cast the same vote over
// and over. `key` should be unique per post *and* per vote type
// (e.g. `covered:${postId}`, `stillNeeded:${postId}`), since those
// are independent votes on the same post.
const VOTED_KEY = 'ayudaManizales.votedKeys'

function readVoted() {
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY)) || {}
  } catch {
    return {}
  }
}

function writeVoted(map) {
  localStorage.setItem(VOTED_KEY, JSON.stringify(map))
}

export function hasRecentVote(key, cooldownMs) {
  const voted = readVoted()
  const at = voted[key]
  return typeof at === 'number' && Date.now() - at < cooldownMs
}

export function recordVote(key) {
  const voted = readVoted()
  voted[key] = Date.now()
  writeVoted(voted)
}
