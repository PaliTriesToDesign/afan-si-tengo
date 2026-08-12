import { useState } from 'react'
import { addHelperPing } from '../lib/firebase.js'
import { hasRecentlyPinged, recordPing } from '../lib/helperPings.js'
import { HELPER_PING_EXPIRY_MS } from '../lib/constants'
import { ACTION_ICONS } from '../lib/icons'
import PostActionButton from './PostActionButton.jsx'

// "Voy a ayudar" — a soft, zero-login signal so people don't all
// converge on the same post. Not a claim system: no accountability,
// no way to "un-ping", and the count expires on its own (see
// constants.js). Just enough friction reduction to avoid duplicate
// trips, without the account/coordination overhead a real claim flow
// would need.
export default function HelperPingButton({ postId, helperPings = [] }) {
  const [justPinged, setJustPinged] = useState(false)
  const [sending, setSending] = useState(false)

  const activeCount = helperPings.filter((t) => Date.now() - t < HELPER_PING_EXPIRY_MS).length
  const alreadyPinged = justPinged || hasRecentlyPinged(postId)

  async function handleConfirm(close) {
    if (alreadyPinged || sending) return
    setSending(true)
    try {
      await addHelperPing(postId, helperPings)
      recordPing(postId)
      setJustPinged(true)
      close()
    } catch {
      // Silent failure is fine here — worst case the tap just didn't
      // count, nothing for the user to recover from.
    } finally {
      setSending(false)
    }
  }

  return (
    <PostActionButton
      icon={ACTION_ICONS.helperPing}
      label={alreadyPinged ? 'Ya avisaste que vas a ayudar' : 'Voy a ayudar'}
      active={alreadyPinged}
    >
      {({ close }) => (
        <>
          <p className="action-tooltip-question">¿Vas a ir a ayudar con esta publicación?</p>
          <div className="action-tooltip-buttons">
            <button
              type="button"
              className="action-tooltip-confirm"
              disabled={sending}
              onClick={() => handleConfirm(close)}
            >
              {sending ? 'Enviando…' : 'Sí, voy a ayudar'}
            </button>
            <button type="button" className="action-tooltip-cancel" onClick={close}>
              Cancelar
            </button>
          </div>
          {activeCount > 0 && (
            <p className="action-vote-count">
              {activeCount === 1 ? '1 persona va' : `${activeCount} personas van`}
            </p>
          )}
        </>
      )}
    </PostActionButton>
  )
}
