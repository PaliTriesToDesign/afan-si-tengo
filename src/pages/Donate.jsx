import { useState } from 'react'
import { useRouter } from '../lib/router.jsx'
import { DONATION_ORGS, PENDING_ORGS, DONATE_CAUTION } from '../lib/donationOrgs'
import { ChevronLeft, ChevronRight } from '../components/Icons.jsx'

const TEXT = {
  es: {
    back: 'Atrás',
    title: 'Donar $',
    intro:
      'Esta app no recibe dinero directamente. Aquí tienes organizaciones verificadas que están respondiendo a este terremoto.',
    linkCta: 'Donar',
    pendingLabel: 'Información próximamente',
    comingSoon: {
      title: 'Más organizaciones próximamente',
      desc: 'Estamos verificando otras campañas activas. Esta lista se irá ampliando.',
    },
  },
  en: {
    back: 'Back',
    title: 'Donate $',
    intro:
      'This app never handles money directly. Here are verified organizations responding to this earthquake.',
    linkCta: 'Donate',
    pendingLabel: 'Info coming soon',
    comingSoon: {
      title: 'More organizations coming soon',
      desc: "We're verifying other active campaigns. This list will keep growing.",
    },
  },
}

export default function Donate() {
  const { navigate, query } = useRouter()
  // Language lives in the URL (?lang=en) so a link copied/shared while
  // viewing the English version opens straight into English for whoever
  // receives it — no toggle click required on their end.
  const [lang, setLang] = useState(query.get('lang') === 'en' ? 'en' : 'es')
  const t = TEXT[lang]

  function selectLang(next) {
    setLang(next)
    const params = new URLSearchParams(window.location.search)
    params.set('lang', next)
    // replaceState (not the router's navigate/pushState) so toggling
    // language doesn't stack up browser-back history entries.
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
  }

  return (
    <div className="flow-page">
      <div className="page-header-row">
        <button type="button" className="back-link" onClick={() => navigate('/')}>
          <ChevronLeft /> {t.back}
        </button>

        <div className="lang-toggle" role="group" aria-label="Language / Idioma">
          <button
            type="button"
            className={lang === 'es' ? 'lang-option active' : 'lang-option'}
            onClick={() => selectLang('es')}
            aria-pressed={lang === 'es'}
          >
            ES
          </button>
          <button
            type="button"
            className={lang === 'en' ? 'lang-option active' : 'lang-option'}
            onClick={() => selectLang('en')}
            aria-pressed={lang === 'en'}
          >
            EN
          </button>
        </div>
      </div>

      <h2>{t.title}</h2>
      <p className="step-hint">{t.intro}</p>

      <div className="org-grid">
        {DONATION_ORGS[lang].map((org) => (
          <a
            key={org.name}
            className="org-card"
            href={org.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>{org.name}</h3>
            <p className="org-desc">{org.desc}</p>
            <span className="org-link">{t.linkCta} <ChevronRight /></span>
          </a>
        ))}

        {PENDING_ORGS.map((org) => (
          <div key={org.name.es} className="org-card org-card-soon">
            <h3>{org.name[lang]}</h3>
            <p className="org-desc">{t.pendingLabel}</p>
          </div>
        ))}

        <div className="org-card org-card-soon">
          <h3>{t.comingSoon.title}</h3>
          <p className="org-desc">{t.comingSoon.desc}</p>
        </div>
      </div>

      <p className="donate-caution">{DONATE_CAUTION[lang]}</p>
    </div>
  )
}
