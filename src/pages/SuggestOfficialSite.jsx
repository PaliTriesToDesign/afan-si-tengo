import { useState } from 'react'
import { useRouter } from '../lib/router.jsx'
import { submitOfficialSiteSuggestion } from '../lib/firebase.js'
import { ChevronLeft } from '../components/Icons.jsx'

// Zero-login form for "Sugerir otro" on the official sites section
// (see OfficialSitesList.jsx). Same write-only, hand-reviewed shape
// as SubmitIdea.jsx / ReportBug.jsx — nothing here publishes
// automatically. A suggestion only becomes a real card/pin once it's
// reviewed and added to OFFICIAL_SITES in officialSites.js.
export default function SuggestOfficialSite() {
  const { navigate } = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const canSubmit = name.trim() && address.trim() && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      await submitOfficialSiteSuggestion({ name, address, website, instagram, notes })
      setSent(true)
    } catch (err) {
      setError('No se pudo enviar la sugerencia. Intenta de nuevo. ' + (err?.message || ''))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="flow-page">
        <div className="step success-screen">
          <h2>¡Gracias!</h2>
          <p>Vamos a revisar el sitio y lo agregamos si corresponde.</p>
          <button type="button" className="secondary-button" onClick={() => navigate('/quiero-ayudar')}>
            Volver a Quiero Ayudar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flow-page">
      <button type="button" className="back-link" onClick={() => navigate('/quiero-ayudar')}>
        <ChevronLeft /> Atrás
      </button>

      <div className="step">
        <h2>Sugerir un sitio oficial</h2>
        <p className="step-hint">
          ¿Falta un sitio en la lista (alcaldía, salud, bomberos, albergue, universidad)? Cuéntanos y lo
          revisamos antes de publicarlo. No necesitas cuenta.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="site-name">Nombre del sitio</label>
          <input
            id="site-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Cruz Roja Caldas, Universidad de Caldas…"
            autoFocus
          />

          <label className="field-label" htmlFor="site-address">Dirección</label>
          <input
            id="site-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Calle 19 No. 21-44, Manizales"
          />

          <label className="field-label" htmlFor="site-website">Sitio web (opcional)</label>
          <input
            id="site-website"
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://…"
          />

          <label className="field-label" htmlFor="site-instagram">Instagram (opcional)</label>
          <input
            id="site-instagram"
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/…"
          />

          <label className="field-label" htmlFor="site-notes">Notas (opcional)</label>
          <textarea
            id="site-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: qué tipo de ayuda ofrece, por qué debería estar en la lista…"
          />

          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={!canSubmit}>
            {submitting ? 'Enviando…' : 'Enviar sugerencia'}
          </button>
        </form>
      </div>
    </div>
  )
}
