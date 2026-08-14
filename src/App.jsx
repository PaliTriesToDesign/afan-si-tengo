import { lazy, Suspense } from 'react'
import { RouterProvider, useRouter } from './lib/router.jsx'
import Landing from './pages/Landing.jsx'
import { EMERGENCY_NOTICE } from './lib/constants'

// Route-level code splitting: Landing (the page everyone hits first,
// often on a weak connection) stays in the small main bundle. The
// heavier pages — which pull in Leaflet, Firebase, html-to-image,
// qrcode — only download once someone actually navigates to them.
const NeedHelp = lazy(() => import('./pages/NeedHelp.jsx'))
const GiveHelp = lazy(() => import('./pages/GiveHelp.jsx'))
const Donate = lazy(() => import('./pages/Donate.jsx'))
const ManagePost = lazy(() => import('./pages/ManagePost.jsx'))
const SubmitIdea = lazy(() => import('./pages/SubmitIdea.jsx'))
const ReportBug = lazy(() => import('./pages/ReportBug.jsx'))
const SuggestOfficialSite = lazy(() => import('./pages/SuggestOfficialSite.jsx'))
// Dev-only route (see the import.meta.env.DEV guard below) — lets the
// share cards be styled against dummy data without submitting a real
// post. import.meta.env.DEV is false in a production build, so this
// case falls through to Landing there and the page/route is dead code
// Vite strips out — it never ships.
const PreviewShareCard = lazy(() => import('./pages/PreviewShareCard.jsx'))

function Screen() {
  const { path } = useRouter()

  switch (path) {
    case '/necesito-ayuda':
      return <NeedHelp />
    case '/quiero-ayudar':
      return <GiveHelp />
    case '/donar':
      return <Donate />
    case '/gestionar':
      return <ManagePost />
    case '/ideas':
      return <SubmitIdea />
    case '/reportar-error':
      return <ReportBug />
    case '/sugerir-sitio-oficial':
      return <SuggestOfficialSite />
    case '/vista-previa-tarjeta':
      return import.meta.env.DEV ? <PreviewShareCard /> : <Landing />
    default:
      return <Landing />
  }
}

// Footer needs router.navigate, so it has to be a child of
// RouterProvider (a hook can't reach a context from its own parent) —
// pulled out into its own component rather than called inline in App.
function FooterNav() {
  const { navigate } = useRouter()

  function go(to) {
    return (e) => {
      e.preventDefault()
      navigate(to)
    }
  }

  return (
    <nav className="footer-links" aria-label="Comentarios sobre el sitio">
      <a href="/ideas" className="footer-link" onClick={go('/ideas')}>
        Sugerir una idea
      </a>
      <span className="footer-link-sep" aria-hidden="true">·</span>
      <a href="/reportar-error" className="footer-link" onClick={go('/reportar-error')}>
        Reportar un error
      </a>
    </nav>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <div className="app-shell">
        <Suspense fallback={<div className="flow-page">Cargando…</div>}>
          <Screen />
        </Suspense>
        <footer className="app-footer">
          <FooterNav />
          <p className="emergency-notice">{EMERGENCY_NOTICE.es}</p>
        </footer>
      </div>
    </RouterProvider>
  )
}
