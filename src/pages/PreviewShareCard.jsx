import { useEffect } from 'react'
import { useShareImage, useAwarenessShareImage } from '../components/ShareImageCard.jsx'

// Dev-only tool — see the route guard in App.jsx, this page doesn't
// exist in production builds. It exists so the share cards can be
// styled without submitting a real post every time.
//
// Deliberately fills every optional field at once (blood types AND
// a "supplies" category together, a contact number, a location note)
// so every conditional block in ShareImageCard.jsx renders in one
// shot — an unrealistic post, but a useful one for CSS work.
const DUMMY_POST = {
  category: 'supplies',
  description:
    'Agua, comida no perecedera y medicinas para una familia de 4 personas, incluye un bebé de 6 meses.',
  bloodTypes: ['O+', 'A-'],
  location: {
    lat: 5.0703,
    lng: -75.5138,
    address: 'Carrera 23 # 45-67, Barrio Chachafruto',
  },
  locationNote: 'Casa azul frente a la tienda, portón negro',
  urgency: 'now',
  contact: '300 123 4567',
}
const DUMMY_POST_ID = 'preview-1234567890'

export default function PreviewShareCard() {
  const postCard = useShareImage()
  const awarenessCard = useAwarenessShareImage()

  useEffect(() => {
    postCard.generate(DUMMY_POST, DUMMY_POST_ID).catch(() => {})
    awarenessCard.generate().catch(() => {})
    // Only ever run once, on mount — the "Volver a generar" button
    // below re-triggers it manually after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flow-page">
      <h2>Vista previa — tarjetas para compartir</h2>
      <p className="step-hint">
        Para verlas aquí en la página (en vez de fuera de pantalla), comenta
        temporalmente <code>position: fixed; left: -10000px;</code> en{' '}
        <code>.share-card-offscreen</code> dentro de{' '}
        <code>src/styles.css</code> — y recuerda volver a activarlo antes de
        publicar. Mientras esté comentado, cualquier otra página que también
        genere una tarjeta (Necesito Ayuda, Gestionar, el botón Compartir en
        Quiero Ayudar) la mostrará igual de visible ahí, no solo aquí.
      </p>

      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          postCard.generate(DUMMY_POST, DUMMY_POST_ID)
          awarenessCard.generate()
        }}
      >
        Volver a generar
      </button>

      {postCard.CardPortal}
      {awarenessCard.CardPortal}
    </div>
  )
}
