import { useRouter } from '../lib/router.jsx'
import { OFFICIAL_SITES, OFFICIAL_SITE_TYPES } from '../lib/officialSites'

// Always-visible list of official sites, shown below the map/post
// list on Give Help — unlike the map pins (see officialSiteIcon in
// ManizalesMap.jsx), these cards don't need lat/lng to render, so a
// site still shows up here even before its coordinates are verified.
// Purely informational: title, address, links — no report/share/
// helper actions, same as the map popup. Deliberately no icons/
// color accents on the cards themselves — text-only, clean layout.
export default function OfficialSitesList() {
  const { navigate } = useRouter()

  return (
    <div className="official-sites-section">
      <h3>Sitios oficiales</h3>
      <p className="official-sites-hint">
        Información de referencia — alcaldía, salud, bomberos, albergues y universidades activas en la respuesta.
      </p>
      <div className="official-sites-grid">
        {OFFICIAL_SITES.map((site) => {
          const meta = OFFICIAL_SITE_TYPES[site.type] || OFFICIAL_SITE_TYPES.otros
          return (
            <article key={site.id} className="official-site-card">
              <h4>{site.name}</h4>
              <span className="official-site-card-type">{meta.label}</span>
              <p className="official-site-card-address">{site.address}</p>
              <div className="official-site-card-links">
                {site.website && (
                  <a href={site.website} target="_blank" rel="noopener noreferrer">
                    Sitio web
                  </a>
                )}
                {site.instagram && (
                  <a href={site.instagram} target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                )}
              </div>
            </article>
          )
        })}

        <article className="official-site-card official-site-card-suggest">
          <h4>¿Falta un sitio?</h4>
          <p className="official-site-card-address">
            Sugiere otro sitio oficial y lo revisamos antes de publicarlo.
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/sugerir-sitio-oficial')}
          >
            Sugerir otro
          </button>
        </article>
      </div>
    </div>
  )
}
