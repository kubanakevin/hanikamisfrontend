// src/pages/Programs.jsx
import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

const truncate = (text, max = 140) => {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
};

const LEVEL_LABELS = {
  certificate: "Certificate",
  diploma: "Diploma",
  degree: "Degree",
};

const levelLabel = (level) =>
  LEVEL_LABELS[level?.toLowerCase()] || level || "Program";

function ProgramsPublic() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState("loading");
  const [showPreloader, setShowPreloader] = useState(true);

  const [programs, setPrograms] = useState([]);
  const [levels, setLevels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 0,
    has_more: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Read initial filter values from URL (so /programs?level=diploma works)
  const initialLevel = searchParams.get("level") || null;
  const initialDepartment = searchParams.get("department") || null;
  const [activeLevel, setActiveLevel] = useState(initialLevel);
  const [activeDepartment, setActiveDepartment] = useState(initialDepartment);

  // -------- Initial load --------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [levelsRes, deptsRes, listRes] = await Promise.all([
          fetch(`${API_BASE}/api/client/programs/levels`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/client/programs/departments`, {
            credentials: "include",
          }),
          fetch(
            `${API_BASE}/api/client/programs?page=1&limit=${PAGE_SIZE}` +
              (initialLevel ? `&level=${initialLevel}` : "") +
              (initialDepartment ? `&department=${initialDepartment}` : ""),
            { credentials: "include" }
          ),
        ]);

        const levelsJson = await levelsRes.json();
        const deptsJson = await deptsRes.json();
        const listJson = await listRes.json();
        if (cancelled) return;

        if (levelsJson.success) setLevels(levelsJson.data || []);
        if (deptsJson.success) setDepartments(deptsJson.data || []);
        if (listJson.success) {
          setPrograms(listJson.data || []);
          setPagination(
            listJson.pagination || {
              page: 1,
              limit: PAGE_SIZE,
              total: listJson.data?.length || 0,
              total_pages: 1,
              has_more: false,
            }
          );
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Programs load error:", err);
        if (!cancelled) setStatus("error");
      } finally {
        setTimeout(() => setShowPreloader(false), 800);
      }
    }

    load();

    fetch(`${API_BASE}/api/client/visits/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page_url: "/programs" }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- Fetch helper --------
  const fetchList = useCallback(async ({ level, department, page }) => {
    const url = new URL(`${API_BASE}/api/client/programs`);
    url.searchParams.set("page", page);
    url.searchParams.set("limit", PAGE_SIZE);
    if (level) url.searchParams.set("level", level);
    if (department) url.searchParams.set("department", department);

    const res = await fetch(url.toString(), { credentials: "include" });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to load programs");
    return json;
  }, []);

  const updateUrl = (level, department) => {
    const next = new URLSearchParams();
    if (level) next.set("level", level);
    if (department) next.set("department", department);
    setSearchParams(next, { replace: true });
  };

  const handleLevelChange = async (level) => {
    setActiveLevel(level);
    updateUrl(level, activeDepartment);
    setLoadingMore(true);
    try {
      const json = await fetchList({ level, department: activeDepartment, page: 1 });
      setPrograms(json.data || []);
      setPagination(json.pagination || { page: 1, has_more: false, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDepartmentChange = async (department) => {
    setActiveDepartment(department);
    updateUrl(activeLevel, department);
    setLoadingMore(true);
    try {
      const json = await fetchList({ level: activeLevel, department, page: 1 });
      setPrograms(json.data || []);
      setPagination(json.pagination || { page: 1, has_more: false, total: 0 });
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
      const json = await fetchList({
        level: activeLevel,
        department: activeDepartment,
        page: next,
      });
      setPrograms((prev) => [...prev, ...(json.data || [])]);
      setPagination(json.pagination || pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  // -------- Render states --------
  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "error") {
    return (
      <>
        <NavBar />
        <div className="programs-error">
          <h2>Couldn't load programs</h2>
          <p>Please refresh the page to try again.</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
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
      <main className="programs-page">
        <section className="programs-header">
          <h1>Our Programs</h1>
          <p>
            Explore the full range of academic programs offered across our
            departments. Every program combines classroom learning with
            hands-on training.
          </p>
        </section>

        {/* Level chips */}
        {levels.length > 0 && (
          <section className="programs-filters">
            <div className="programs-filter-row">
              <span className="programs-filter-label">Level</span>
              <div className="programs-chips">
                <button
                  type="button"
                  className={`filter-chip ${activeLevel === null ? "active" : ""}`}
                  onClick={() => handleLevelChange(null)}
                >
                  All levels
                </button>
                {levels.map((lv) => (
                  <button
                    key={lv.level}
                    type="button"
                    className={`filter-chip ${
                      activeLevel === lv.level ? "active" : ""
                    }`}
                    onClick={() => handleLevelChange(lv.level)}
                  >
                    {levelLabel(lv.level)}
                    <span className="chip-count">{lv.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Department chips */}
            {departments.length > 0 && (
              <div className="programs-filter-row">
                <span className="programs-filter-label">Department</span>
                <div className="programs-chips">
                  <button
                    type="button"
                    className={`filter-chip ${
                      activeDepartment === null ? "active" : ""
                    }`}
                    onClick={() => handleDepartmentChange(null)}
                  >
                    All departments
                  </button>
                  {departments.map((d) => (
                    <button
                      key={d.slug}
                      type="button"
                      className={`filter-chip ${
                        activeDepartment === d.slug ? "active" : ""
                      }`}
                      onClick={() => handleDepartmentChange(d.slug)}
                    >
                      {d.name}
                      <span className="chip-count">{d.program_count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="programs-content">
          {programs.length === 0 ? (
            <div className="programs-empty">
              <span className="programs-empty-icon">📚</span>
              <h3>No programs found</h3>
              <p>Try a different filter, or check back soon.</p>
            </div>
          ) : (
            <>
              <div className="programs-grid">
                {programs.map((p) => (
                  <article key={p.id} className="program-card">
                    <Link to={`/programs/${p.slug}`} className="program-card-link">
                      <div className="program-card-media">
                        {p.image_url ? (
                          <img
                            src={resolveImage(p.image_url)}
                            alt={p.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="program-card-placeholder">📚</div>
                        )}
                        <span
                          className={`level-badge level-badge--${(
                            p.level || ""
                          ).toLowerCase()}`}
                        >
                          {levelLabel(p.level)}
                        </span>
                        {p.is_featured ? (
                          <span className="program-card-featured">★ Featured</span>
                        ) : null}
                      </div>

                      <div className="program-card-body">
                        <span className="program-card-department">
                          {p.department_name}
                        </span>
                        <h3 className="program-card-title">{p.name}</h3>
                        {p.short_description && (
                          <p className="program-card-excerpt">
                            {truncate(p.short_description, 130)}
                          </p>
                        )}
                        <div className="program-card-meta">
                          {p.duration && (
                            <span className="program-meta-item">
                              <span className="program-meta-icon">⏱️</span>
                              {p.duration}
                            </span>
                          )}
                        </div>
                        <span className="program-card-cta">
                          View program <span className="arrow">→</span>
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              {pagination.has_more && (
                <div className="programs-loadmore-wrap">
                  <button
                    type="button"
                    className="programs-loadmore"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading…" : "Load More"}
                  </button>
                </div>
              )}

              <p className="programs-count">
                Showing {programs.length}
                {pagination.total ? ` of ${pagination.total}` : ""} program
                {programs.length === 1 ? "" : "s"}
              </p>
            </>
          )}
        </section>
      </main>

      <Footer />

      <style>{`
        .programs-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
        }

        /* Header */
        .programs-header {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          padding: 80px 24px 60px;
          text-align: center;
        }
        .programs-header h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(32px, 4vw, 48px);
          margin: 0 0 12px;
        }
        .programs-header p {
          font-size: 16px;
          color: #EBD9E9;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Filters */
        .programs-filters {
          max-width: 1240px;
          margin: 0 auto;
          padding: 32px 24px 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .programs-filter-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }
        .programs-filter-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #8A7E88;
          padding-top: 9px;
          flex-shrink: 0;
          min-width: 96px;
        }
        .programs-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          flex: 1;
          min-width: 0;
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
          font-family: inherit;
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
          background: rgba(0,0,0,0.08);
          padding: 1px 8px;
          border-radius: 999px;
        }
        .filter-chip.active .chip-count {
          background: rgba(255,255,255,0.25);
        }

        /* Content */
        .programs-content {
          max-width: 1240px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        .programs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        /* Card */
        .program-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .program-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(41, 20, 40, 0.10);
        }
        .program-card-link {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          height: 100%;
        }
        .program-card-media {
          position: relative;
          width: 100%;
          padding-top: 58%;
          background: #F3EAF2;
          overflow: hidden;
        }
        .program-card-media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .program-card:hover .program-card-media img {
          transform: scale(1.05);
        }
        .program-card-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
          color: #B96AAE;
        }

        .level-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #FFFFFF;
          background: #6B646B;
        }
        .level-badge--certificate { background: #4A90D9; }
        .level-badge--diploma    { background: #2E7D32; }
        .level-badge--degree     { background: #D69E2E; }

        .program-card-featured {
          position: absolute;
          top: 14px;
          right: 14px;
          padding: 4px 10px;
          border-radius: 12px;
          background: linear-gradient(135deg, #FFB800, #FF8C00);
          color: #1a1a1a;
          font-size: 11px;
          font-weight: 700;
        }

        .program-card-body {
          padding: 20px 22px 22px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .program-card-department {
          font-size: 11px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 6px;
        }
        .program-card-title {
          font-family: 'Fraunces', serif;
          font-size: 19px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 8px;
          line-height: 1.3;
        }
        .program-card-excerpt {
          font-size: 14px;
          line-height: 1.55;
          color: #6B646B;
          margin: 0 0 14px;
          flex: 1;
        }
        .program-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
        }
        .program-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #6B646B;
        }
        .program-meta-icon { font-size: 13px; }

        .program-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #893C87;
          padding-top: 12px;
          border-top: 1px solid #E1D9E0;
        }
        .program-card-cta .arrow { transition: transform 0.2s ease; }
        .program-card:hover .program-card-cta .arrow { transform: translateX(4px); }

        /* Empty */
        .programs-empty {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 60px 24px;
          text-align: center;
          max-width: 480px;
          margin: 0 auto;
        }
        .programs-empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .programs-empty h3 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          color: #241F24;
          margin: 0 0 8px;
        }
        .programs-empty p { color: #6B646B; margin: 0; }

        /* Load-more + count */
        .programs-loadmore-wrap {
          display: flex;
          justify-content: center;
          margin-top: 40px;
        }
        .programs-loadmore {
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
        .programs-loadmore:hover:not(:disabled) { background: #6F2F6D; }
        .programs-loadmore:disabled { opacity: 0.6; cursor: wait; }
        .programs-count {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #6B646B;
        }

        /* Error */
        .programs-error {
          text-align: center;
          padding: 80px 24px;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .programs-error h2 {
          color: #893C87;
          font-size: 28px;
          margin-bottom: 8px;
        }
        .programs-error p { color: #6B646B; margin-bottom: 20px; }
        .retry-btn {
          padding: 12px 32px;
          background: #893C87;
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .retry-btn:hover { background: #6F2F6D; }

        /* Responsive */
        @media (max-width: 720px) {
          .programs-header { padding: 64px 20px 44px; }
          .programs-header h1 { font-size: 30px; }
          .programs-header p { font-size: 15px; }
          .programs-filters { padding: 24px 16px 0; }
          .programs-filter-row { flex-direction: column; gap: 8px; }
          .programs-filter-label { padding-top: 0; }
          .programs-content { padding: 28px 16px 60px; }
          .programs-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .program-card,
          .program-card-media img,
          .program-card-cta .arrow { transition: none !important; }
        }
      `}</style>
    </>
  );
}

export default ProgramsPublic;