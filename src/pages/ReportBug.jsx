import { useState } from 'react'
import { useRouter } from '../lib/router.jsx'
import { submitBugReport } from '../lib/firebase.js'
import { ChevronLeft } from '../components/Icons.jsx'

// Zero-login bug report — no fields beyond the text itself. See
// SubmitIdea.jsx for the matching "suggest an idea" form; both are
// deliberately the same shape.
export default function ReportBug() {
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
      await submitBugReport(text)
      setSent(true)
    } catch (err) {
      setError('No se pudo enviar el reporte. Intenta de nuevo. ' + (err?.message || ''))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="flow-page">
        <div className="step success-screen">
          <h2>¡Gracias por avisarnos!</h2>
          <p>Vamos a revisarlo lo antes posible.</p>
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
        <h2>Reportar un error</h2>
        <p className="step-hint">
          ¿Algo no funcionó como esperabas? Cuéntanos qué pasó. No necesitas cuenta ni datos de contacto.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="bug-input">
            ¿Qué salió mal?
          </label>
          <textarea
            id="bug-input"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej: el mapa no carga en mi celular, no me dejó publicar…"
            autoFocus
          />
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting || !text.trim()}>
            {submitting ? 'Enviando…' : 'Enviar reporte'}
          </button>
        </form>
      </div>
    </div>
  )
}
