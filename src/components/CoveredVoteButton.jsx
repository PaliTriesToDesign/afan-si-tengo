import { useState } from 'react'
import { addCoveredVote, addStillNeededVote } from '../lib/firebase.js'
import { hasRecentVote, recordVote } from '../lib/voteCooldown.js'
import { COVERED_VOTE_COOLDOWN_MS, POST_STATUS } from '../lib/constants'
import { ACTION_ICONS } from '../lib/icons'
import PostActionButton from './PostActionButton.jsx'

// The reciprocal pair that drives COVERED status — see the design
// note in constants.js. Same button slot shows one of two things
// depending on the post's current status:
//   - open / in_progress → "Ya tienen suficiente" (casts a cover vote)
//   - covered             → "Todavía se necesita ayuda" (casts a
//                            reopen vote — this post isn't actually
//                            covered, someone should keep helping)
export default function CoveredVoteButton({ post }) {
  const [justVoted, setJustVoted] = useState(false)
  const [sending, setSending] = useState(false)

  const isCovered = post.status === POST_STATUS.COVERED
  const voteKey = `${isCovered ? 'stillNeeded' : 'covered'}:${post.id}`
  const alreadyVoted = justVoted || hasRecentVote(voteKey, COVERED_VOTE_COOLDOWN_MS)

  async function handleConfirm(close) {
    if (alreadyVoted || sending) return
    setSending(true)
    try {
      if (isCovered) {
        await addStillNeededVote(post.id, post)
      } else {
        await addCoveredVote(post.id, post)
      }
      recordVote(voteKey)
      setJustVoted(true)
      close()
    } catch {
      // Same "silent failure is fine" reasoning as the other vote
      // buttons — worst case the tap just didn't count.
    } finally {
      setSending(false)
    }
  }

  const label = isCovered ? 'Todavía se necesita ayuda' : 'Ya tienen suficiente'
  const question = isCovered
    ? '¿Confirmas que este sitio todavía necesita ayuda? Se marcó como cubierto por error o la situación cambió.'
    : '¿Confirmas que este sitio ya no necesita más ayuda por ahora? Otros vecinos verán esto y no harán el viaje.'

  return (
    <PostActionButton
      icon={isCovered ? ACTION_ICONS.stillNeeded : ACTION_ICONS.covered}
      label={alreadyVoted ? `Ya votaste: ${label.toLowerCase()}` : label}
      active={alreadyVoted}
    >
      {({ close }) => (
        <>
          <p className="action-tooltip-question">{question}</p>
          <div className="action-tooltip-buttons">
            <button
              type="button"
              className="action-tooltip-confirm"
              disabled={sending}
              onClick={() => handleConfirm(close)}
            >
              {sending ? 'Enviando…' : `Sí, ${label.toLowerCase()}`}
            </button>
            <button type="button" className="action-tooltip-cancel" onClick={close}>
              Cancelar
            </button>
          </div>
        </>
      )}
    </PostActionButton>
  )
}
