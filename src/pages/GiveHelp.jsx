import { useEffect, useState, useRef } from "react";
import { useRouter } from "../lib/router.jsx";
import ManizalesMap from "../components/ManizalesMap.jsx";
import { ChevronLeft } from "../components/Icons.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faCompass,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import OfficialSitesList from "../components/OfficialSitesList.jsx";
import IconLegend from "../components/IconLegend.jsx";
import PostDescription from "../components/PostDescription.jsx";
import ReportButton from "../components/ReportButton.jsx";
import HelperPingButton from "../components/HelperPingButton.jsx";
import CoveredVoteButton from "../components/CoveredVoteButton.jsx";
import ShareButton from "../components/ShareButton.jsx";
import { useShareImage } from "../components/ShareImageCard.jsx";
import { listenToOpenPosts } from "../lib/firebase.js";
import {
  shareOrDownloadImage,
  buildShareCaption,
  postShareUrl,
} from "../lib/share.js";
import {
  CATEGORIES,
  URGENCY_LEVELS,
  POST_STATUS,
  STATUS_LABELS,
} from "../lib/constants";

export default function GiveHelp() {
  const { navigate, query } = useRouter();
  const highlightedFromQuery = query.get("post");
  const { generate, CardPortal } = useShareImage();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  // Covered posts stay in the underlying data (see listenToOpenPosts)
  // so the "todavía se necesita ayuda" reversal is always reachable,
  // but they're hidden by default and sorted last so they don't
  // crowd out posts that still need a first look.
  const [showCovered, setShowCovered] = useState(false);
  // Shared between the map and the list: clicking a marker
  // highlights its card, clicking a card pans the map to it.
  const [selectedId, setSelectedId] = useState(highlightedFromQuery);
  // Only one post's card can render into the shared offscreen node
  // at a time, so this both disables the tapped button while it
  // generates and stops a second tap from starting mid-render.
  const [sharingPostId, setSharingPostId] = useState(null);
  const listRefs = useRef({});

  async function handleSharePost(post) {
    if (sharingPostId) return;
    setSharingPostId(post.id);
    try {
      const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : null;
      const dataUrl = await generate(post, post.id, createdAt);
      await shareOrDownloadImage({
        dataUrl,
        filename: `ayuda-manizales-${post.id}.png`,
        title: "Afán Sí Tengo",
        text: `${buildShareCaption(post)}\n\n${postShareUrl(post.id)}`,
      });
    } catch {
      // Best-effort — a failed share here isn't worth an error banner
      // in the middle of the list; the person can just tap again.
    } finally {
      setSharingPostId(null);
    }
  }

  useEffect(() => {
    const unsubscribe = listenToOpenPosts((data) => {
      setPosts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (highlightedFromQuery) setSelectedId(highlightedFromQuery);
  }, [highlightedFromQuery]);

  useEffect(() => {
    if (selectedId && listRefs.current[selectedId]) {
      listRefs.current[selectedId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedId, posts]);

  const filtered = posts
    .filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter)
        return false;
      if (urgencyFilter !== "all" && p.urgency !== urgencyFilter) return false;
      if (!showCovered && p.status === POST_STATUS.COVERED) return false;
      return true;
    })
    // Covered posts sort last regardless of date, so a "probably
    // doesn't need you" post never sits above one that does.
    .sort((a, b) => {
      const aCovered = a.status === POST_STATUS.COVERED ? 1 : 0;
      const bCovered = b.status === POST_STATUS.COVERED ? 1 : 0;
      return aCovered - bCovered;
    });

  const coveredCount = posts.filter(
    (p) => p.status === POST_STATUS.COVERED,
  ).length;

  return (
    <div className="flow-page give-help-page">
      {CardPortal}
      <div className="page-header-row">
        <button
          type="button"
          className="back-link"
          onClick={() => navigate("/")}
        >
          <ChevronLeft /> Atrás
        </button>
        <button
          type="button"
          className="donate-link-button"
          onClick={() => navigate("/donar")}
        >
          Donar
        </button>
      </div>
      <h2>Quiero Ayudar</h2>

      <IconLegend />

      <div className="filters">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            // Native <option> only ever renders plain text — no SVG/icon
            // markup survives inside it, even though emoji (plain
            // unicode characters) used to work here for that reason.
            <option key={key} value={key}>
              {cat.label}
            </option>
          ))}
        </select>
        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
        >
          <option value="all">Toda urgencia</option>
          {Object.entries(URGENCY_LEVELS).map(([key, level]) => (
            <option key={key} value={key}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      {coveredCount > 0 && (
        <label className="covered-toggle">
          <input
            type="checkbox"
            checked={showCovered}
            onChange={(e) => setShowCovered(e.target.checked)}
          />
          Mostrar publicaciones posiblemente cubiertas ({coveredCount})
        </label>
      )}

      <div className="give-help-layout">
        <div className="give-help-map">
          <ManizalesMap
            mode="browse"
            posts={filtered}
            height="100%"
            selectedPostId={selectedId}
            onSelectPost={(post) => setSelectedId(post.id)}
          />
        </div>

        <div className="give-help-list">
          {loading && <p className="empty-state">Cargando publicaciones…</p>}
          {!loading && filtered.length === 0 && (
            <p className="empty-state">
              No hay publicaciones que coincidan con estos filtros.
            </p>
          )}
          {filtered.map((post) => {
            const isCovered = post.status === POST_STATUS.COVERED;
            return (
              <article
                key={post.id}
                ref={(el) => (listRefs.current[post.id] = el)}
                className={`post-card ${post.id === selectedId ? "highlighted" : ""} ${isCovered ? "is-covered" : ""}`}
                onClick={() => setSelectedId(post.id)}
              >
                <div className="post-card-content">
                  <div className="post-card-header">
                    <span className="option-icon">
                      {CATEGORIES[post.category]?.icon && (
                        <FontAwesomeIcon
                          icon={CATEGORIES[post.category].icon}
                        />
                      )}
                    </span>
                    <span>{CATEGORIES[post.category]?.label}</span>
                    <span className={`urgency-badge urgency-${post.urgency}`}>
                      {URGENCY_LEVELS[post.urgency]?.label}
                    </span>
                    {post.category === "blood" &&
                      post.bloodTypes?.length > 0 && (
                        <span className="blood-type-badge">
                          <FontAwesomeIcon icon={CATEGORIES.blood.icon} />{" "}
                          {post.bloodTypes.join(", ")}
                        </span>
                      )}
                  </div>
                  {post.status === POST_STATUS.IN_PROGRESS && (
                    <span className="status-badge status-in-progress">
                      <FontAwesomeIcon
                        icon={STATUS_LABELS[POST_STATUS.IN_PROGRESS].icon}
                      />{" "}
                      {STATUS_LABELS[POST_STATUS.IN_PROGRESS].label}
                    </span>
                  )}
                  {isCovered && (
                    <span className="status-badge status-covered">
                      <FontAwesomeIcon
                        icon={STATUS_LABELS[POST_STATUS.COVERED].icon}
                      />{" "}
                      {STATUS_LABELS[POST_STATUS.COVERED].label}
                    </span>
                  )}
                  <PostDescription text={post.description} />
                  <p className="post-location">
                    <FontAwesomeIcon icon={faLocationDot} />{" "}
                    <span className="detail-label">Dirección:</span>{" "}
                    {post.location?.address}
                  </p>
                  {post.locationNote && (
                    <p className="post-location-note">
                      <FontAwesomeIcon icon={faCompass} />{" "}
                      <span className="detail-label">Referencia:</span>{" "}
                      {post.locationNote}
                    </p>
                  )}
                  {post.contact && (
                    <p className="post-contact">
                      <FontAwesomeIcon icon={faPhone} /> {post.contact}
                    </p>
                  )}
                </div>

                <div className="action-rail">
                  <HelperPingButton
                    postId={post.id}
                    helperPings={post.helperPings}
                  />
                  <ShareButton
                    post={post}
                    sharing={sharingPostId === post.id}
                    onShare={handleSharePost}
                  />
                  <CoveredVoteButton post={post} />
                  <ReportButton postId={post.id} />
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <OfficialSitesList />
    </div>
  );
}
