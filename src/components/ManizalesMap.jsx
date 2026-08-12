import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { icon as faIcon } from '@fortawesome/fontawesome-svg-core'
import { faLocationDot, faCompass, faPhone, faUsers } from '@fortawesome/free-solid-svg-icons'
import { ACTIVE_CITY, CATEGORIES, URGENCY_LEVELS, POST_STATUS, STATUS_LABELS, HELPER_PING_EXPIRY_MS } from '../lib/constants'
import { OFFICIAL_SITES, OFFICIAL_SITE_TYPES } from '../lib/officialSites'

// Markers and popups here are built from raw HTML strings for Leaflet
// (not JSX — Leaflet owns that DOM directly), so <FontAwesomeIcon>
// can't be used. This renders the same icon defs to a standalone SVG
// string instead — same source-of-truth icons, just a different
// output format for this one file.
function faSvg(iconDef) {
  return faIcon(iconDef).html.join('')
}

// Vite-bundler fix for Leaflet's default marker icons, which
// otherwise resolve to broken paths in a bundled build.
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})
L.Marker.prototype.options.icon = DefaultIcon

// Bigger, square, rounded-corner marker for OFFICIAL_SITES — kept
// visually distinct from the round teardrop pins above so it reads
// as "official reference point," not a community posting. One
// consistent color/style for every site (styled in .official-marker-
// pin), not per-type, so the single "Sitio oficial" legend entry
// matches every pin on the map.
function officialSiteIcon() {
  return L.divIcon({
    className: 'official-marker',
    html: `<span class="official-marker-pin"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  })
}

// Teardrop pin colored by urgency (so a glance at the map shows
// where the most urgent needs are clustered) with the category
// emoji inside, same shape people already know from Google Maps.
function categoryIcon(post) {
  const cat = CATEGORIES[post.category]
  const color = URGENCY_LEVELS[post.urgency]?.color || '#6b7280'
  const isCovered = post.status === POST_STATUS.COVERED
  return L.divIcon({
    className: `category-marker${isCovered ? ' category-marker-covered' : ''}`,
    html: `<span class="category-marker-pin" style="background:${color}"><span class="category-marker-emoji">${faSvg(cat?.icon || faLocationDot)}</span></span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  })
}

/**
 * mode="pick": tap the map to choose a single location. Calls
 * onChange({ lat, lng }) — that's it. No auto-geocoded address:
 * Nominatim's guesses weren't accurate enough for Manizales, so the
 * poster now selects the exact point themselves and types their own
 * address in NeedHelp.jsx's StepLocation. This component only ever
 * hands back coordinates.
 *
 * mode="browse": shows one marker per post in `posts`. Calls
 * onSelectPost(post) when a marker is tapped.
 */
export default function ManizalesMap({
  mode = 'browse',
  value = null,
  onChange,
  posts = [],
  onSelectPost,
  selectedPostId = null,
  height = '320px',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const pickMarkerRef = useRef(null)
  const browseMarkersRef = useRef([])
  const markersByIdRef = useRef({})
  const officialMarkersRef = useRef([])

  // Init map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = L.map(containerRef.current).setView(ACTIVE_CITY.center, ACTIVE_CITY.zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    mapRef.current = map

    if (mode === 'pick') {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        placePickMarker(lat, lng)
        onChange?.({ lat, lng })
      })
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function placePickMarker(lat, lng) {
    const map = mapRef.current
    if (!map) return
    if (pickMarkerRef.current) {
      pickMarkerRef.current.setLatLng([lat, lng])
    } else {
      pickMarkerRef.current = L.marker([lat, lng]).addTo(map)
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 15))
  }

  // Reflect an externally-set value (e.g. restoring a draft).
  useEffect(() => {
    if (mode === 'pick' && value?.lat && value?.lng) {
      placePickMarker(value.lat, value.lng)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, value?.lat, value?.lng])

  // Render post markers in browse mode.
  useEffect(() => {
    if (mode !== 'browse') return
    const map = mapRef.current
    if (!map) return

    browseMarkersRef.current.forEach((m) => map.removeLayer(m))
    browseMarkersRef.current = []
    markersByIdRef.current = {}

    const bounds = []
    posts.forEach((post) => {
      if (!post.location?.lat || !post.location?.lng) return
      const marker = L.marker([post.location.lat, post.location.lng], {
        icon: categoryIcon(post),
      }).addTo(map)
      marker.bindPopup(popupHtml(post))
      marker.on('click', () => onSelectPost?.(post))
      browseMarkersRef.current.push(marker)
      markersByIdRef.current[post.id] = marker
      bounds.push([post.location.lat, post.location.lng])
    })

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 })
    } else {
      map.setView(ACTIVE_CITY.center, ACTIVE_CITY.zoom)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, posts])

  // OFFICIAL_SITES markers — rendered once per mount in browse mode,
  // independent of `posts`/filters (they're always-on reference
  // points, not something people filter away). Sites with lat: null
  // are skipped until their coordinates are verified — see the note
  // at the top of officialSites.js.
  useEffect(() => {
    if (mode !== 'browse') return
    const map = mapRef.current
    if (!map) return

    officialMarkersRef.current.forEach((m) => map.removeLayer(m))
    officialMarkersRef.current = []

    OFFICIAL_SITES.forEach((site) => {
      if (site.lat == null || site.lng == null) return
      const marker = L.marker([site.lat, site.lng], { icon: officialSiteIcon() }).addTo(map)
      marker.bindPopup(officialPopupHtml(site))
      officialMarkersRef.current.push(marker)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Picking a card in the list (or a `?post=` link) pans the map
  // to that marker and pops it open, so the map and list always
  // point at the same posting.
  useEffect(() => {
    if (mode !== 'browse' || !selectedPostId) return
    const map = mapRef.current
    const marker = markersByIdRef.current[selectedPostId]
    if (!map || !marker) return
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true })
    marker.openPopup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedPostId, posts])

  return (
    <div className="manizales-map">
      {mode === 'browse' && (
        <div className="map-legend">
          {Object.entries(URGENCY_LEVELS).map(([key, level]) => (
            <span key={key} className="map-legend-item">
              <span className="map-legend-dot" style={{ background: level.color }} />
              {level.label}
            </span>
          ))}
          <span className="map-legend-item">
            <span className="map-legend-square" />
            Sitio oficial
          </span>
        </div>
      )}
      <div ref={containerRef} style={{ height }} className="map-container" />
      {mode === 'pick' && <p className="map-hint">Toca el mapa para marcar la ubicación exacta.</p>}
      {mode === 'browse' && posts.length === 0 && (
        <p className="map-hint">No hay publicaciones para mostrar en el mapa todavía.</p>
      )}
    </div>
  )
}

function popupHtml(post) {
  const cat = CATEGORIES[post.category]
  const urgency = URGENCY_LEVELS[post.urgency]
  const activeHelpers = (post.helperPings || []).filter((t) => Date.now() - t < HELPER_PING_EXPIRY_MS).length
  return `
    <div class="map-popup">
      <div class="map-popup-header">
        <span>${faSvg(cat?.icon || faLocationDot)} ${escapeHtml(cat?.label || '')}</span>
        ${urgency ? `<span class="map-popup-urgency" style="color:${urgency.color}">${escapeHtml(urgency.label)}</span>` : ''}
      </div>
      ${post.status === POST_STATUS.IN_PROGRESS ? `<p class="map-popup-status">${faSvg(STATUS_LABELS[POST_STATUS.IN_PROGRESS].icon)} ${escapeHtml(STATUS_LABELS[POST_STATUS.IN_PROGRESS].label)}</p>` : ''}
      ${post.status === POST_STATUS.COVERED ? `<p class="map-popup-status map-popup-status-covered">${faSvg(STATUS_LABELS[POST_STATUS.COVERED].icon)} ${escapeHtml(STATUS_LABELS[POST_STATUS.COVERED].label)}</p>` : ''}
      ${post.bloodTypes?.length > 0 ? `<p class="map-popup-blood">${faSvg(CATEGORIES.blood.icon)} Tipo: ${escapeHtml(post.bloodTypes.join(', '))}</p>` : ''}
      <p>${escapeHtml(post.description || '')}</p>
      ${post.location?.address ? `<p class="map-popup-address">${faSvg(faLocationDot)} <span class="detail-label">Dirección:</span> ${escapeHtml(post.location.address)}</p>` : ''}
      ${post.locationNote ? `<p class="map-popup-note">${faSvg(faCompass)} <span class="detail-label">Referencia:</span> ${escapeHtml(post.locationNote)}</p>` : ''}
      ${post.contact ? `<p class="map-popup-contact">${faSvg(faPhone)} ${escapeHtml(post.contact)}</p>` : ''}
      ${activeHelpers > 0 ? `<p class="map-popup-helpers">${faSvg(faUsers)} ${activeHelpers === 1 ? '1 persona va' : `${activeHelpers} personas van`}</p>` : ''}
    </div>
  `
}

// OFFICIAL_SITES popup — deliberately minimal: title, address, and
// links only. No status, no contact, no action buttons — these pins
// are fully informative, never something a person "resolves."
function officialPopupHtml(site) {
  const meta = OFFICIAL_SITE_TYPES[site.type] || OFFICIAL_SITE_TYPES.otros
  return `
    <div class="official-popup">
      <div class="official-popup-title">${escapeHtml(site.name)}</div>
      <p class="official-popup-type">${escapeHtml(meta.label)}</p>
      <p class="official-popup-address">${escapeHtml(site.address)}</p>
      <div class="official-popup-links">
        ${site.website ? `<a href="${escapeHtml(site.website)}" target="_blank" rel="noopener noreferrer">Sitio web</a>` : ''}
        ${site.instagram ? `<a href="${escapeHtml(site.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ''}
      </div>
    </div>
  `
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c])
}
