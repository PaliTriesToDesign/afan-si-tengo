import { useState } from 'react'
import { reportPost } from '../lib/firebase.js'
import { ACTION_ICONS } from '../lib/icons'
import PostActionButton from './PostActionButton.jsx'

// No login needed to report — just a flag button feeding a simple
// admin review queue (see README for how to check reports).
export default function ReportButton({ postId }) {
  const [sent, setSent] = useState(false)

  async function submit(reason, close) {
    await reportPost(postId, reason)
    setSent(true)
    close()
  }

  return (
    <PostActionButton
      icon={ACTION_ICONS.report}
      label={sent ? 'Reportado — gracias' : 'Reportar esta publicación'}
      active={sent}
    >
      {({ close }) => (
        <>
          <p className="action-tooltip-question">¿Por qué reportas esta publicación?</p>
          <div className="action-tooltip-buttons">
            <button type="button" onClick={() => submit('spam_or_fake', close)}>
              Parece falsa o spam
            </button>
            <button type="button" onClick={() => submit('inappropriate', close)}>
              Contenido inapropiado
            </button>
            <button type="button" onClick={() => submit('resolved_not_updated', close)}>
              Ya fue resuelta
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
