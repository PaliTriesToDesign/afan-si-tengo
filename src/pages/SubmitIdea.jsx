import { useState } from 'react'
import { useRouter } from '../lib/router.jsx'
import { submitIdea } from '../lib/firebase.js'
import { ChevronLeft } from '../components/Icons.jsx'

// Zero-login feedback form — no fields beyond the text itself. Same
// pattern as ReportBug.jsx (single field, no multi-step flow, since
// there's nothing here that benefits from being split across screens).
export default function SubmitIdea() {
  const { navigate } = useRouter()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await submitIdea(text)
      setSent(true)
    } catch (err) {
      setError('No se pudo enviar tu idea. Intenta de nuevo. ' + (err?.message || ''))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="flow-page">
        <div className="step success-screen">
          <h2>¡Gracias por tu idea!</h2>
          <p>La leeremos para seguir mejorando Afán Sí Tengo.</p>
          <button type="button" className="secondary-button" onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flow-page">
      <button type="button" className="back-link" onClick={() => navigate('/')}>
        <ChevronLeft /> Atrás
      </button>

      <div className="step">
        <h2>Sugerir una idea</h2>
        <p className="step-hint">
          ¿Qué le agregarías o cambiarías a Afán Sí Tengo? No necesitas cuenta ni datos de contacto.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="idea-input">
            Tu idea
          </label>
          <textarea
            id="idea-input"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej: agregar un filtro por barrio, avisar cuando alguien ayuda…"
            autoFocus
          />
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting || !text.trim()}>
            {submitting ? 'Enviando…' : 'Enviar idea'}
          </button>
        </form>
      </div>
    </div>
  )
}
