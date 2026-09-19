// src/pages/Events.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";
const PAGE_SIZE = 12;

const resolveImage = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

const formatShortDate = (value) => {
  if (!value) return { day: "--", month: "---", year: "----" };
  try {
    const d = new Date(value);
    return {
      day: d.getDate().toString().padStart(2, "0"),
      month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      year: d.getFullYear().toString(),
    };
  } catch {
    return { day: "--", month: "---", year: "----" };
  }
};

const truncate = (text, max = 140) => {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
};

function Events() {
  const [status, setStatus] = useState("loading");
  const [showPreloader, setShowPreloader] = useState(true);

  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 0,
    has_more: false,
  });

  const [upcomingFilter, setUpcomingFilter] = useState("true"); // "true" | "false" | ""
  const [activeCategory, setActiveCategory] = useState(null); // null = All

  const [loadingMore, setLoadingMore] = useState(false);

  // Detail modal
  const [viewingEvent, setViewingEvent] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const modalRef = useRef(null);

  // -------- Initial load --------
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const [catRes, evRes] = await Promise.all([
          fetch(`${API_BASE}/api/client/events/categories`, {
            credentials: "include",
          }),
          fetch(
            `${API_BASE}/api/client/events?upcoming=true&page=1&limit=${PAGE_SIZE}`,
            { credentials: "include" }
          ),
        ]);

        const catJson = await catRes.json();
        const evJson = await evRes.json();

        if (cancelled) return;

        if (catJson.success) setCategories(catJson.data || []);
        if (evJson.success) {
          setEvents(evJson.data || []);
          setPagination(
            evJson.pagination || {
              page: 1,
              limit: PAGE_SIZE,
              total: evJson.data?.length || 0,
              total_pages: 1,
              has_more: false,
            }
          );
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Events load error:", err);
        if (!cancelled) setStatus("error");
      } finally {
        setTimeout(() => setShowPreloader(false), 800);
      }
    }

    loadAll();

    // Optional: track visit like Gallery does
    fetch(`${API_BASE}/api/client/visits/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page_url: "/events" }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // -------- Fetch helper --------
  const fetchEvents = useCallback(async ({ upcoming, category, page }) => {
    const url = new URL(`${API_BASE}/api/client/events`);
    url.searchParams.set("page", page);
    url.searchParams.set("limit", PAGE_SIZE);
    if (upcoming) url.searchParams.set("upcoming", upcoming);
    if (category) url.searchParams.set("category", category);

    const res = await fetch(url.toString(), { credentials: "include" });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to load events");
    return json.data;
  }, []);

  const handleUpcomingChange = async (value) => {
    setUpcomingFilter(value);
    setLoadingMore(true);
    try {
      const fresh = await fetchEvents({
        upcoming: value,
        category: activeCategory,
        page: 1,
      });
      setEvents(fresh || []);
      setPagination((p) => ({
        ...p,
        page: 1,
        total: fresh?.length ?? 0,
        total_pages: 1,
        has_more: false,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCategoryChange = async (slug) => {
    setActiveCategory(slug);
    setLoadingMore(true);
    try {
      const fresh = await fetchEvents({
        upcoming: upcomingFilter,
        category: slug,
        page: 1,
      });
      setEvents(fresh || []);
      setPagination((p) => ({
        ...p,
        page: 1,
        total: fresh?.length ?? 0,
        total_pages: 1,
        has_more: false,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    if (!pagination.has_more || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = pagination.page + 1;
      const fresh = await fetchEvents({
        upcoming: upcomingFilter,
        category: activeCategory,
        page: next,
      });
      setEvents((prev) => [...prev, ...(fresh || [])]);
      setPagination((p) => ({ ...p, page: next }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  // -------- Detail modal --------
  const openEvent = async (event) => {
    setLoadingDetail(true);
    setViewingEvent({ ...event, images: [], related: [] });

    try {
      const res = await fetch(
        `${API_BASE}/api/client/events/${event.slug || event.id}`,
        { credentials: "include" }
      );
      const json = await res.json();
      if (json.success) {
        setViewingEvent(json.data);
      } else {
        setViewingEvent(null);
      }
    } catch (err) {
      console.error("Event detail error:", err);
      setViewingEvent(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeEvent = () => setViewingEvent(null);

  // Esc closes modal; lock body scroll
  useEffect(() => {
    if (!viewingEvent) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeEvent();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [viewingEvent]);

  useEffect(() => {
    if (viewingEvent && modalRef.current) modalRef.current.focus();
  }, [viewingEvent]);

  // -------- Render states --------
  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "error") {
    return (
      <>
        <NavBar />
        <div className="events-error">
          <h2>Couldn't load events</h2>
          <p>Please refresh the page to try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Retry
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="events-page">
        <section className="events-header">
          <h1>Events & Activities</h1>
          <p>
            Stay up to date with everything happening at HANIKA — conferences,
            workshops, ceremonies, sports, and more.
          </p>
        </section>

        {/* Filter row: Upcoming/Past toggle + category chips */}
        <section className="events-filters">
          <div className="events-toggle-group" role="tablist">
            <button
              role="tab"
              aria-selected={upcomingFilter === "true"}
              className={`filter-toggle ${
                upcomingFilter === "true" ? "active" : ""
              }`}
              onClick={() => handleUpcomingChange("true")}
            >
              Upcoming
            </button>
            <button
              role="tab"
              aria-selected={upcomingFilter === "false"}
              className={`filter-toggle ${
                upcomingFilter === "false" ? "active" : ""
              }`}
              onClick={() => handleUpcomingChange("false")}
            >
              Past
            </button>
            <button
              role="tab"
              aria-selected={upcomingFilter === ""}
              className={`filter-toggle ${
                upcomingFilter === "" ? "active" : ""
              }`}
              onClick={() => handleUpcomingChange("")}
            >
              All
            </button>
          </div>

          {categories.length > 0 && (
            <div className="events-chips">
              <button
                type="button"
                className={`filter-chip ${activeCategory === null ? "active" : ""}`}
                onClick={() => handleCategoryChange(null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  type="button"
                  className={`filter-chip ${
                    activeCategory === cat.category ? "active" : ""
                  }`}
                  onClick={() => handleCategoryChange(cat.category)}
                >
                  {cat.category}
                  <span className="chip-count">{cat.count}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="events-content">
          {events.length === 0 ? (
            <div className="events-empty">
              <span className="events-empty-icon">📅</span>
              <h3>No events found</h3>
              <p>
                {upcomingFilter === "true"
                  ? "No upcoming events at the moment. Check back soon."
                  : upcomingFilter === "false"
                  ? "No past events to display."
                  : "No events match the current filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="events-grid">
                {events.map((ev) => {
                  const { day, month } = formatShortDate(ev.event_date);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      className="event-card"
                      onClick={() => openEvent(ev)}
                      aria-label={`View ${ev.title}`}
                    >
                      <div className="event-card-media">
                        {ev.featured_image ? (
                          <img
                            src={resolveImage(ev.featured_image)}
                            alt={ev.title}
                            loading="lazy"
                          />
                        ) : (
                          <div className="event-card-placeholder">🎉</div>
                        )}
                        <div className="event-card-date">
                          <span className="event-card-day">{day}</span>
                          <span className="event-card-month">{month}</span>
                        </div>
                        {ev.is_featured ? (
                          <span className="event-card-badge">★ Featured</span>
                        ) : null}
                      </div>

                      <div className="event-card-overlay">
                        <span className="tile-title">{ev.title}</span>
                        {ev.category && (
                          <span className="tile-category">{ev.category}</span>
                        )}
                      </div>

                      <div className="event-card-body">
                        {ev.category && (
                          <span className="event-card-category">
                            {ev.category}
                          </span>
                        )}
                        <h3 className="event-card-title">{ev.title}</h3>
                        <p className="event-card-excerpt">
                          {truncate(ev.description, 110)}
                        </p>
                        <div className="event-card-meta">
                          {ev.location && (
                            <span className="event-meta-item">
                              <span className="event-meta-icon">📍</span>
                              {ev.location}
                            </span>
                          )}
                          {ev.start_time && (
                            <span className="event-meta-item">
                              <span className="event-meta-icon">🕐</span>
                              {ev.start_time}
                              {ev.end_time ? ` – ${ev.end_time}` : ""}
                            </span>
                          )}
                        </div>
                        <span className="event-card-cta">
                          View details
                          <span className="event-card-arrow">→</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {pagination.has_more && (
                <div className="events-loadmore-wrap">
                  <button
                    type="button"
                    className="events-loadmore"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading…" : "Load More"}
                  </button>
                </div>
              )}

              <p className="events-count">
                Showing {events.length}
                {pagination.total ? ` of ${pagination.total}` : ""} event
                {events.length === 1 ? "" : "s"}
              </p>
            </>
          )}
        </section>
      </main>

      <Footer />

      {/* ============ Detail modal ============ */}
      {viewingEvent && (
        <div
          className="event-modal-overlay"
          ref={modalRef}
          tabIndex={-1}
          onClick={closeEvent}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="event-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="event-modal-close"
              onClick={closeEvent}
              aria-label="Close"
            >
              ×
            </button>

            <div className="event-modal-hero">
              {viewingEvent.featured_image ? (
                <img
                  src={resolveImage(viewingEvent.featured_image)}
                  alt={viewingEvent.title}
                />
              ) : (
                <div className="event-modal-hero-placeholder">🎉</div>
              )}
            </div>

            <div className="event-modal-body">
              {viewingEvent.category && (
                <span className="event-modal-category">
                  {viewingEvent.category}
                </span>
              )}
              <h2 className="event-modal-title">{viewingEvent.title}</h2>

              <div className="event-modal-meta">
                <div className="event-modal-meta-item">
                  <span className="event-modal-meta-label">Date</span>
                  <span className="event-modal-meta-value">
                    {formatDate(viewingEvent.event_date)}
                    {viewingEvent.end_date &&
                      viewingEvent.end_date !== viewingEvent.event_date && (
                        <> — {formatDate(viewingEvent.end_date)}</>
                      )}
                  </span>
                </div>
                {(viewingEvent.start_time || viewingEvent.end_time) && (
                  <div className="event-modal-meta-item">
                    <span className="event-modal-meta-label">Time</span>
                    <span className="event-modal-meta-value">
                      {viewingEvent.start_time || "—"}
                      {viewingEvent.end_time
                        ? ` – ${viewingEvent.end_time}`
                        : ""}
                    </span>
                  </div>
                )}
                {viewingEvent.location && (
                  <div className="event-modal-meta-item">
                    <span className="event-modal-meta-label">Location</span>
                    <span className="event-modal-meta-value">
                      {viewingEvent.location}
                    </span>
                  </div>
                )}
              </div>

              {loadingDetail ? (
                <div className="event-modal-loading">
                  <div className="event-modal-spinner" />
                </div>
              ) : (
                <>
                  {viewingEvent.description && (
                    <div className="event-modal-description">
                      {viewingEvent.description
                        .split("\n")
                        .map((line, i) =>
                          line.trim() === "" ? (
                            <br key={i} />
                          ) : (
                            <p key={i}>{line}</p>
                          )
                        )}
                    </div>
                  )}

                  {viewingEvent.images && viewingEvent.images.length > 0 && (
                    <div className="event-modal-gallery">
                      <h3 className="event-modal-section-title">Gallery</h3>
                      <div className="event-modal-gallery-grid">
                        {viewingEvent.images.map((img) => (
                          <a
                            key={img.id}
                            href={resolveImage(img.image_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="event-modal-gallery-item"
                            title={img.caption || ""}
                          >
                            <img
                              src={resolveImage(img.image_url)}
                              alt={img.caption || ""}
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingEvent.related &&
                    viewingEvent.related.length > 0 && (
                      <div className="event-modal-related">
                        <h3 className="event-modal-section-title">
                          You might also like
                        </h3>
                        <div className="event-modal-related-list">
                          {viewingEvent.related.map((r) => (
                            <button
                              key={r.id}
                              className="event-modal-related-item"
                              onClick={() => openEvent(r)}
                            >
                              <div className="event-modal-related-thumb">
                                {r.featured_image ? (
                                  <img
                                    src={resolveImage(r.featured_image)}
                                    alt={r.title}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="event-modal-related-placeholder">
                                    🎉
                                  </div>
                                )}
                              </div>
                              <div className="event-modal-related-info">
                                <span className="event-modal-related-title">
                                  {r.title}
                                </span>
                                <span className="event-modal-related-date">
                                  {formatDate(r.event_date)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ============ Page shell ============ */
        .events-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
        }

        /* ============ Header (matches Gallery) ============ */
        .events-header {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          padding: 80px 24px 60px;
          text-align: center;
        }
        .events-header h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(32px, 4vw, 48px);
          margin: 0 0 12px;
        }
        .events-header p {
          font-size: 16px;
          color: #EBD9E9;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ============ Filters ============ */
        .events-filters {
          max-width: 1240px;
          margin: 0 auto;
          padding: 32px 24px 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .events-toggle-group {
          display: flex;
          gap: 4px;
          background: #F3EAF2;
          padding: 4px;
          border-radius: 10px;
          width: fit-content;
          margin: 0 auto;
        }
        .filter-toggle {
          padding: 8px 22px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #6B646B;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .filter-toggle:hover { color: #4A444A; }
        .filter-toggle.active {
          background: #FFFFFF;
          color: #893C87;
          box-shadow: 0 2px 8px rgba(137, 60, 135, 0.12);
        }

        .events-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }
        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 500;
          color: #4A444A;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .filter-chip:hover {
          border-color: #893C87;
          color: #893C87;
        }
        .filter-chip.active {
          background: #893C87;
          border-color: #893C87;
          color: #FFFFFF;
        }
        .chip-count {
          font-size: 12px;
          background: rgba(0, 0, 0, 0.08);
          padding: 1px 8px;
          border-radius: 999px;
        }
        .filter-chip.active .chip-count {
          background: rgba(255, 255, 255, 0.25);
        }

        /* ============ Content ============ */
        .events-content {
          max-width: 1240px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        /* ============ Grid ============ */
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        /* ============ Event card ============ */
        .event-card {
          position: relative;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
          text-align: left;
          padding: 0;
          font-family: inherit;
        }
        .event-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(41, 20, 40, 0.12);
        }
        .event-card:focus-visible {
          outline: 3px solid rgba(137, 60, 135, 0.4);
          outline-offset: 2px;
        }

        .event-card-media {
          position: relative;
          width: 100%;
          padding-top: 60%;
          background: #F3EAF2;
          overflow: hidden;
        }
        .event-card-media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        .event-card:hover .event-card-media img {
          transform: scale(1.06);
        }
        .event-card-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
          color: #B96AAE;
        }

        .event-card-date {
          position: absolute;
          top: 14px;
          left: 14px;
          background: #FFFFFF;
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 54px;
        }
        .event-card-day {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 700;
          color: #893C87;
          line-height: 1;
        }
        .event-card-month {
          font-size: 10px;
          font-weight: 700;
          color: #6B646B;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .event-card-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          background: linear-gradient(135deg, #FFB800, #FF8C00);
          color: #1a1a1a;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(255, 184, 0, 0.35);
        }

        /* Hover overlay (Gallery style) */
        .event-card-overlay {
          position: absolute;
          inset: auto 0 0 0;
          background: linear-gradient(transparent, rgba(41, 20, 40, 0.85));
          padding: 40px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .event-card:hover .event-card-overlay,
        .event-card:focus-visible .event-card-overlay {
          opacity: 1;
        }
        .tile-title {
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
        }
        .tile-category {
          color: #EBD9E9;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .event-card-body {
          padding: 18px 20px 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .event-card-category {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 6px;
        }
        .event-card-title {
          font-family: 'Fraunces', serif;
          font-size: 19px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 8px;
          line-height: 1.3;
        }
        .event-card-excerpt {
          font-size: 14px;
          line-height: 1.55;
          color: #6B646B;
          margin: 0 0 14px;
          flex: 1;
        }
        .event-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
        }
        .event-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #6B646B;
        }
        .event-meta-icon { font-size: 13px; }
        .event-card-cta {
          font-size: 13px;
          font-weight: 700;
          color: #893C87;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding-top: 12px;
          border-top: 1px solid #E1D9E0;
        }
        .event-card-arrow { transition: transform 0.2s ease; }
        .event-card:hover .event-card-arrow { transform: translateX(4px); }

        /* ============ Empty ============ */
        .events-empty {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 60px 24px;
          text-align: center;
          max-width: 480px;
          margin: 0 auto;
        }
        .events-empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .events-empty h3 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          color: #241F24;
          margin: 0 0 8px;
        }
        .events-empty p {
          color: #6B646B;
          margin: 0;
          line-height: 1.5;
        }

        /* ============ Load-more + count ============ */
        .events-loadmore-wrap {
          display: flex;
          justify-content: center;
          margin-top: 40px;
        }
        .events-loadmore {
          padding: 14px 40px;
          background: #893C87;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .events-loadmore:hover:not(:disabled) { background: #6F2F6D; }
        .events-loadmore:disabled { opacity: 0.6; cursor: wait; }

        .events-count {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #6B646B;
        }

        /* ============ Error ============ */
        .events-error {
          text-align: center;
          padding: 80px 24px;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .events-error h2 {
          color: #893C87;
          font-size: 28px;
          margin-bottom: 8px;
        }
        .events-error p {
          color: #6B646B;
          margin-bottom: 20px;
        }
        .retry-btn {
          padding: 12px 32px;
          background: #893C87;
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .retry-btn:hover { background: #6F2F6D; }

        /* ============ Detail modal ============ */
        .event-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20, 10, 20, 0.85);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          outline: none;
          animation: em-fade 0.2s ease;
        }
        @keyframes em-fade { from { opacity: 0; } to { opacity: 1; } }

        .event-modal {
          background: #FFFFFF;
          border-radius: 16px;
          max-width: 860px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          animation: em-slide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes em-slide {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .event-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          font-size: 26px;
          line-height: 1;
          color: #241F24;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: background 0.15s ease;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        }
        .event-modal-close:hover { background: #FFFFFF; }

        .event-modal-hero {
          position: relative;
          width: 100%;
          padding-top: 45%;
          background: #F3EAF2;
          overflow: hidden;
          border-radius: 16px 16px 0 0;
        }
        .event-modal-hero img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .event-modal-hero-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 84px;
          color: #B96AAE;
        }

        .event-modal-body {
          padding: 28px 32px 36px;
        }
        .event-modal-category {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 10px;
        }
        .event-modal-title {
          font-family: 'Fraunces', serif;
          font-size: 30px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 20px;
          line-height: 1.25;
        }

        .event-modal-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          background: #F8F5F7;
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 24px;
        }
        .event-modal-meta-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .event-modal-meta-label {
          font-size: 11px;
          font-weight: 700;
          color: #8A7E88;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .event-modal-meta-value {
          font-size: 14px;
          font-weight: 500;
          color: #241F24;
        }

        .event-modal-description {
          font-size: 15px;
          line-height: 1.7;
          color: #4A444A;
          margin-bottom: 24px;
        }
        .event-modal-description p { margin: 0 0 12px; }
        .event-modal-description p:last-child { margin-bottom: 0; }

        .event-modal-section-title {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 16px;
        }

        .event-modal-gallery,
        .event-modal-related {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #E1D9E0;
        }
        .event-modal-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }
        .event-modal-gallery-item {
          display: block;
          aspect-ratio: 1;
          border-radius: 10px;
          overflow: hidden;
          background: #F3EAF2;
          transition: transform 0.15s ease;
          cursor: zoom-in;
        }
        .event-modal-gallery-item:hover { transform: scale(1.03); }
        .event-modal-gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .event-modal-related-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .event-modal-related-item {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 10px;
          background: #FBF9FA;
          border: 1px solid #E1D9E0;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .event-modal-related-item:hover {
          border-color: #893C87;
          background: #F8F2F8;
        }
        .event-modal-related-thumb {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          overflow: hidden;
          background: #F3EAF2;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .event-modal-related-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .event-modal-related-placeholder {
          font-size: 24px;
          color: #B96AAE;
        }
        .event-modal-related-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .event-modal-related-title {
          font-size: 14px;
          font-weight: 600;
          color: #241F24;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.3;
        }
        .event-modal-related-date {
          font-size: 12px;
          color: #8A7E88;
          margin-top: 3px;
        }

        .event-modal-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
        }
        .event-modal-spinner {
          width: 36px;
          height: 36px;
          border: 4px solid #F3EAF2;
          border-top-color: #893C87;
          border-radius: 50%;
          animation: modalSpin 0.8s linear infinite;
        }
        @keyframes modalSpin { to { transform: rotate(360deg); } }

        /* ============ Responsive ============ */
        @media (max-width: 640px) {
          .events-header { padding: 64px 20px 44px; }
          .events-header h1 { font-size: 30px; }
          .events-header p { font-size: 15px; }

          .events-filters { padding: 24px 16px 0; }
          .events-toggle-group { width: 100%; }
          .filter-toggle { flex: 1; padding: 8px 12px; }

          .events-content { padding: 28px 16px 60px; }
          .events-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
          }

          .event-modal-overlay { padding: 12px; }
          .event-modal-body { padding: 22px 20px 28px; }
          .event-modal-title { font-size: 24px; }
          .event-modal-meta { padding: 14px 16px; }
          .event-modal-gallery-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .event-card,
          .event-card-media img,
          .event-modal,
          .event-modal-gallery-item,
          .event-card-overlay,
          .event-card-arrow {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}

export default Events;