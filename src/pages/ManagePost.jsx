import { useEffect, useState } from 'react'
import { useRouter } from '../lib/router.jsx'
import { getPost, markPostResolved, markPostInProgress, markPostOpen } from '../lib/firebase.js'
import { useShareImage } from '../components/ShareImageCard.jsx'
import { ChevronLeft } from '../components/Icons.jsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLocationDot,
  faCompass,
  faClock,
  faUsers,
  faCircleCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { shareOrDownloadImage, buildShareCaption, postShareUrl } from '../lib/share.js'
import {
  CATEGORIES,
  URGENCY_LEVELS,
  POST_STATUS,
  STATUS_LABELS,
  HELPER_PING_EXPIRY_MS,
  COVERED_VOTE_EXPIRY_MS,
} from '../lib/constants'

export default function ManagePost() {
  const { navigate, query } = useRouter()
  const postId = query.get('post')
  const token = query.get('token')
  const { generate, CardPortal } = useShareImage()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [shareImageUrl, setShareImageUrl] = useState(null)
  const [generatingShare, setGeneratingShare] = useState(false)

  async function handleShareImage() {
    setGeneratingShare(true)
    try {
      const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : null
      const url = await generate(post, postId, createdAt)
      setShareImageUrl(url)
      await shareOrDownloadImage({
        dataUrl: url,
        filename: `ayuda-manizales-${postId}.png`,
        title: 'Afán Sí Tengo',
        text: `${buildShareCaption(post)}\n\n${postShareUrl(postId)}`,
      })
    } catch {
      setError('No se pudo generar la imagen para compartir.')
    } finally {
      setGeneratingShare(false)
    }
  }

  useEffect(() => {
    if (!postId) {
      setError('Enlace incompleto.')
      setLoading(false)
      return
    }
    getPost(postId)
      .then((p) => {
        if (!p) {
          setError('No se encontró esa publicación.')
        } else {
          setPost(p)
        }
      })
      .catch(() => setError('No se pudo cargar la publicación.'))
      .finally(() => setLoading(false))
  }, [postId])

  // Soft check only — the editToken lives in the document itself
  // (see firestore.rules for why this isn't a hard security boundary,
  // just a "don't show controls to strangers" guard consistent with
  // the app's zero-login design).
  const isOwner = post && token && post.editToken === token

  const STATUS_ACTIONS = {
    [POST_STATUS.IN_PROGRESS]: markPostInProgress,
    [POST_STATUS.OPEN]: markPostOpen,
    [POST_STATUS.RESOLVED]: markPostResolved,
  }

  async function handleSetStatus(status) {
    setUpdatingStatus(true)
    try {
      await STATUS_ACTIONS[status](postId)
      setPost((p) => ({ ...p, status }))
    } catch {
      setError('No se pudo actualizar la publicación.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const activeHelpers = (post?.helperPings || []).filter(
    (t) => Date.now() - t < HELPER_PING_EXPIRY_MS,
  ).length

  const activeCoveredVotes = (post?.coveredVotes || []).filter(
    (t) => Date.now() - t < COVERED_VOTE_EXPIRY_MS,
  ).length
  const activeStillNeededVotes = (post?.stillNeededVotes || []).filter(
    (t) => Date.now() - t < COVERED_VOTE_EXPIRY_MS,
  ).length

  return (
    <div className="flow-page">
      {CardPortal}
      <button type="button" className="back-link" onClick={() => navigate('/')}>
        <ChevronLeft /> Atrás
      </button>
      <h2>Gestionar publicación</h2>

      {loading && <p className="empty-state">Cargando…</p>}
      {error && <p className="field-error">{error}</p>}

      {post && !isOwner && (
        <p className="field-error">
          Este enlace no coincide con esta publicación, así que no puedes editarla desde aquí.
        </p>
      )}

      {post && isOwner && (
        <div className="review-card">
          <p>
            <strong>
              {CATEGORIES[post.category]?.icon && (
                <FontAwesomeIcon icon={CATEGORIES[post.category].icon} />
              )}{' '}
              {CATEGORIES[post.category]?.label}
            </strong>
          </p>
          {post.bloodTypes?.length > 0 && (
            <p>
              <FontAwesomeIcon icon={CATEGORIES.blood.icon} /> Tipo: {post.bloodTypes.join(', ')}
            </p>
          )}
          <p>{post.description}</p>
          <p>
            <FontAwesomeIcon icon={faLocationDot} /> <span className="detail-label">Dirección:</span> {post.location?.address}
          </p>
          {post.locationNote && (
            <p>
              <FontAwesomeIcon icon={faCompass} /> <span className="detail-label">Referencia:</span> {post.locationNote}
            </p>
          )}
          <p>
            <FontAwesomeIcon icon={faClock} /> <span className="detail-label">Urgencia:</span> {URGENCY_LEVELS[post.urgency]?.label}
          </p>
          <p>
            Estado: {STATUS_LABELS[post.status]?.icon && (
              <FontAwesomeIcon icon={STATUS_LABELS[post.status].icon} />
            )}{' '}
            {STATUS_LABELS[post.status]?.label}
          </p>
          {activeHelpers > 0 && (
            <p className="helper-count-owner">
              <FontAwesomeIcon icon={faUsers} />{' '}
              {activeHelpers === 1 ? '1 persona avisó que va' : `${activeHelpers} personas avisaron que van`}
            </p>
          )}
          {activeCoveredVotes > 0 && post.status !== POST_STATUS.COVERED && (
            <p className="helper-count-owner">
              <FontAwesomeIcon icon={faCircleCheck} />{' '}
              {activeCoveredVotes} {activeCoveredVotes === 1 ? 'voto dice' : 'votos dicen'} que ya tienen
              suficiente (se marca cubierta automáticamente con 3)
            </p>
          )}
          {activeStillNeededVotes > 0 && post.status === POST_STATUS.COVERED && (
            <p className="helper-count-owner">
              <FontAwesomeIcon icon={faTriangleExclamation} />{' '}
              {activeStillNeededVotes} {activeStillNeededVotes === 1 ? 'voto dice' : 'votos dicen'} que
              todavía se necesita ayuda (se reabre automáticamente con 2)
            </p>
          )}

          {post.status !== POST_STATUS.RESOLVED && (
            <div className="status-actions">
              {post.status === POST_STATUS.OPEN && (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={updatingStatus}
                  onClick={() => handleSetStatus(POST_STATUS.IN_PROGRESS)}
                >
                  Marcar en proceso
                </button>
              )}
              {(post.status === POST_STATUS.IN_PROGRESS || post.status === POST_STATUS.COVERED) && (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={updatingStatus}
                  onClick={() => handleSetStatus(POST_STATUS.OPEN)}
                >
                  {post.status === POST_STATUS.COVERED
                    ? 'No, todavía se necesita ayuda — volver a abierta'
                    : 'Volver a abierta'}
                </button>
              )}
              <button
                type="button"
                className="primary-button"
                disabled={updatingStatus}
                onClick={() => handleSetStatus(POST_STATUS.RESOLVED)}
              >
                {updatingStatus ? 'Actualizando…' : 'Marcar como resuelta'}
              </button>
            </div>
          )}

          {post.status !== POST_STATUS.RESOLVED && (
            <button
              type="button"
              className="secondary-button"
              disabled={generatingShare}
              onClick={handleShareImage}
            >
              {generatingShare ? 'Generando…' : 'Compartir imagen de nuevo'}
            </button>
          )}

          {shareImageUrl && (
            <div className="share-preview">
              <img src={shareImageUrl} alt="Imagen para compartir" />
              <div className="share-preview-actions">
                <a className="secondary-button" href={shareImageUrl} download={`ayuda-manizales-${postId}.png`}>
                  Guardar imagen
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
