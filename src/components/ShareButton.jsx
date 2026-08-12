import { ACTION_ICONS } from '../lib/icons'
import PostActionButton from './PostActionButton.jsx'

// Wraps the existing share-image flow (see GiveHelp.jsx's
// handleSharePost, which owns the actual generate() call — the
// offscreen render target is shared across the whole page, so only
// one post can be mid-generation at a time) in the same confirm-
// tooltip shell as the other card actions.
export default function ShareButton({ post, sharing, onShare }) {
  async function handleConfirm(close) {
    if (sharing) return
    await onShare(post)
    close()
  }

  return (
    <PostActionButton icon={ACTION_ICONS.share} label="Compartir esta publicación">
      {({ close }) => (
        <>
          <p className="action-tooltip-question">
            Comparte esta publicación para que más personas la vean. Revisa que la información
            siga siendo correcta antes de compartirla.
          </p>
          <div className="action-tooltip-buttons">
            <button
              type="button"
              className="action-tooltip-confirm"
              disabled={sharing}
              onClick={() => handleConfirm(close)}
            >
              {sharing ? 'Generando…' : 'Compartir'}
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
