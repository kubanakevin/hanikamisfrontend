// src/pages/DepartmentDetail.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const resolveImage = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

const truncate = (text, max = 120) => {
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

const renderMultiline = (text) => {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (trimmed === "") return <br key={i} />;
    if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
      return (
        <div key={i} className="dd-list-line">
          <span className="dd-list-bullet">•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    }
    return <p key={i}>{trimmed}</p>;
  });
};

function DepartmentDetail() {
  const { slug } = useParams();
  const [status, setStatus] = useState("loading");
  const [department, setDepartment] = useState(null);
  const [showPreloader, setShowPreloader] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const articleRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/client/departments/${slug}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;

        if (json.success) {
          setDepartment(json.data);
          setStatus("ready");
        } else {
          setStatus("notfound");
        }
      } catch (err) {
        console.error("Department detail load error:", err);
        if (!cancelled) setStatus("error");
      } finally {
        setTimeout(() => setShowPreloader(false), 800);
      }
    }

    load();
    window.scrollTo({ top: 0, behavior: "instant" });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!department) return;
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const start = el.offsetTop;
      const height = el.offsetHeight;
      const scrolled = window.scrollY - start;
      const pct = Math.min(Math.max(scrolled / height, 0), 1) * 100;
      setReadingProgress(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [department]);

  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "notfound" || status === "error" || !department) {
    return (
      <>
        <NavBar />
        <main className="dd-missing">
          <span className="dd-missing-icon">🏛️</span>
          <h1>Department not found</h1>
          <p>
            The department you're looking for doesn't exist or is no longer
            available.
          </p>
          <Link to="/departments" className="dd-btn-primary">
            Back to Departments
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const programs = department.programs || [];
  const related = department.related || [];

  return (
    <>
      <NavBar />

      {/* Reading progress bar */}
      <div className="dd-progress" aria-hidden="true">
        <div
          className="dd-progress-bar"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <main className="dd-page">
        {/* Breadcrumbs */}
        <nav className="dd-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="sep">›</span>
          <Link to="/departments">Departments</Link>
          <span className="sep">›</span>
          <span className="current">{department.name}</span>
        </nav>

        {/* Hero */}
        <header className="dd-hero">
          <div className="dd-hero-initial">
            {department.name.charAt(0).toUpperCase()}
          </div>

          <h1 className="dd-hero-title">{department.name}</h1>

          <div className="dd-hero-meta">
            {department.head_of_department && (
              <span className="dd-meta-item">
                <span className="dd-meta-icon">👤</span>
                Head: <strong>{department.head_of_department}</strong>
              </span>
            )}
            <span className="dd-meta-item">
              <span className="dd-meta-icon">📚</span>
              <strong>{programs.length}</strong>{" "}
              {programs.length === 1 ? "program" : "programs"}
            </span>
          </div>
        </header>

        {/* Layout */}
        <div className="dd-layout">
          <article className="dd-article" ref={articleRef}>
            {department.description && (
              <section className="dd-section">
                <h2 className="dd-section-title">About this department</h2>
                <div className="dd-section-body">
                  {renderMultiline(department.description)}
                </div>
              </section>
            )}

            {!department.description && (
              <p className="dd-empty-note">
                More information about this department is coming soon.
              </p>
            )}

            {/* Programs */}
            {programs.length > 0 ? (
              <section className="dd-section">
                <h2 className="dd-section-title">
                  Programs offered ({programs.length})
                </h2>
                <div className="dd-programs-grid">
                  {programs.map((p) => (
                    <Link
                      key={p.id}
                      to={`/programs/${p.slug}`}
                      className="dd-program-card"
                    >
                      <div className="dd-program-media">
                        {p.image_url ? (
                          <img
                            src={resolveImage(p.image_url)}
                            alt={p.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="dd-program-placeholder">📚</div>
                        )}
                        <span
                          className={`dd-program-level dd-program-level--${(
                            p.level || ""
                          ).toLowerCase()}`}
                        >
                          {levelLabel(p.level)}
                        </span>
                        {p.is_featured ? (
                          <span className="dd-program-featured">★</span>
                        ) : null}
                      </div>
                      <div className="dd-program-body">
                        <h3 className="dd-program-title">{p.name}</h3>
                        {p.duration && (
                          <p className="dd-program-meta">
                            <span className="dd-program-meta-icon">⏱️</span>
                            {p.duration}
                          </p>
                        )}
                        {p.short_description && (
                          <p className="dd-program-desc">
                            {truncate(p.short_description, 100)}
                          </p>
                        )}
                        <span className="dd-program-cta">
                          View program <span className="arrow">→</span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : (
              <section className="dd-section">
                <h2 className="dd-section-title">Programs offered</h2>
                <p className="dd-empty-note">
                  No programs are currently listed for this department. Please
                  check back soon.
                </p>
              </section>
            )}

            <div className="dd-cta-bar">
              <Link to="/programs" className="dd-btn-primary">
                Browse all programs →
              </Link>
              <Link to="/admissions#apply" className="dd-btn-secondary">
                Apply now
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="dd-sidebar">
            <div className="dd-sidebar-section">
              <h3 className="dd-sidebar-title">At a glance</h3>
              <ul className="dd-facts">
                <li>
                  <span className="dd-fact-label">Programs</span>
                  <span className="dd-fact-value">{programs.length}</span>
                </li>
                {department.head_of_department && (
                  <li>
                    <span className="dd-fact-label">Head</span>
                    <span className="dd-fact-value">
                      {department.head_of_department}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {related.length > 0 && (
              <div className="dd-sidebar-section">
                <h3 className="dd-sidebar-title">Other departments</h3>
                <ul className="dd-related-list">
                  {related.map((r) => (
                    <li key={r.id} className="dd-related-item">
                      <Link
                        to={`/departments/${r.slug}`}
                        className="dd-related-link"
                      >
                        <div className="dd-related-initial">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="dd-related-info">
                          <span className="dd-related-title">{r.name}</span>
                          <span className="dd-related-count">
                            {r.program_count}{" "}
                            {r.program_count === 1 ? "program" : "programs"}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="dd-sidebar-section dd-sidebar-cta">
              <h3 className="dd-sidebar-title">Ready to apply?</h3>
              <p>
                Applications are open. Start your journey at HANIKA today.
              </p>
              <Link
                to="/admissions#apply"
                className="dd-btn-primary dd-btn-block"
              >
                Apply Now
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <style>{`
        .dd-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* Progress */
        .dd-progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: transparent;
          z-index: 200;
          pointer-events: none;
        }
        .dd-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #893C87, #B96AAE);
          transition: width 0.08s linear;
        }

        /* Breadcrumbs */
        .dd-breadcrumbs {
          max-width: 1160px;
          margin: 0 auto;
          padding: 24px 24px 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #8A7E88;
        }
        .dd-breadcrumbs a {
          color: #893C87;
          text-decoration: none;
          font-weight: 500;
        }
        .dd-breadcrumbs a:hover { text-decoration: underline; }
        .dd-breadcrumbs .sep { color: #B5ADB5; }
        .dd-breadcrumbs .current {
          color: #6B646B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        /* Hero */
        .dd-hero {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 24px 0;
          text-align: center;
        }
        .dd-hero-initial {
          width: 88px;
          height: 88px;
          border-radius: 20px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          font-family: 'Fraunces', serif;
          font-size: 40px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 12px 32px rgba(137, 60, 135, 0.28);
        }
        .dd-hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(30px, 4.4vw, 48px);
          font-weight: 600;
          color: #241F24;
          line-height: 1.18;
          margin: 0 0 20px;
          letter-spacing: -0.4px;
        }
        .dd-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          justify-content: center;
          padding-bottom: 28px;
          border-bottom: 1px solid #E1D9E0;
        }
        .dd-meta-item {
          font-size: 13.5px;
          color: #6B646B;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .dd-meta-item strong { color: #241F24; font-weight: 600; }
        .dd-meta-icon { font-size: 14px; }

        /* Layout */
        .dd-layout {
          max-width: 1160px;
          margin: 40px auto 0;
          padding: 0 24px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 48px;
          align-items: start;
        }

        /* Article */
        .dd-article {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 40px 44px 36px;
        }
        .dd-section { margin-bottom: 36px; }
        .dd-section:last-of-type { margin-bottom: 0; }

        .dd-section-title {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid #F0E6EF;
        }
        .dd-section-body {
          font-size: 16px;
          line-height: 1.75;
          color: #292329;
        }
        .dd-section-body p { margin: 0 0 12px; }
        .dd-section-body p:last-child { margin-bottom: 0; }

        .dd-list-line {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
          align-items: flex-start;
        }
        .dd-list-bullet {
          color: #B96AAE;
          font-weight: 700;
          line-height: 1.75;
          flex-shrink: 0;
        }

        .dd-empty-note {
          font-size: 15px;
          color: #6B646B;
          font-style: italic;
          margin: 0;
        }

        /* Programs grid */
        .dd-programs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 18px;
        }
        .dd-program-card {
          display: flex;
          flex-direction: column;
          background: #FBF9FA;
          border: 1px solid #E1D9E0;
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dd-program-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(41, 20, 40, 0.10);
          border-color: #E7D3E6;
        }
        .dd-program-media {
          position: relative;
          width: 100%;
          padding-top: 56%;
          background: #F3EAF2;
          overflow: hidden;
        }
        .dd-program-media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }
        .dd-program-card:hover .dd-program-media img { transform: scale(1.05); }
        .dd-program-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          color: #B96AAE;
        }
        .dd-program-level {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #FFFFFF;
          background: #6B646B;
        }
        .dd-program-level--certificate { background: #4A90D9; }
        .dd-program-level--diploma    { background: #2E7D32; }
        .dd-program-level--degree     { background: #D69E2E; }

        .dd-program-featured {
          position: absolute;
          top: 10px;
          right: 10px;
          background: linear-gradient(135deg, #FFB800, #FF8C00);
          color: #1a1a1a;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }
        .dd-program-body {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .dd-program-title {
          font-family: 'Fraunces', serif;
          font-size: 16px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 6px;
          line-height: 1.3;
        }
        .dd-program-meta {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #6B646B;
          margin: 0 0 8px;
        }
        .dd-program-meta-icon { font-size: 12px; }
        .dd-program-desc {
          font-size: 13px;
          line-height: 1.55;
          color: #6B646B;
          margin: 0 0 12px;
          flex: 1;
        }
        .dd-program-cta {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12.5px;
          font-weight: 700;
          color: #893C87;
          padding-top: 10px;
          border-top: 1px solid #E1D9E0;
        }
        .dd-program-cta .arrow { transition: transform 0.2s ease; }
        .dd-program-card:hover .dd-program-cta .arrow { transform: translateX(4px); }

        /* CTA bar */
        .dd-cta-bar {
          margin-top: 36px;
          padding-top: 28px;
          border-top: 1px solid #E1D9E0;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .dd-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 26px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 14.5px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dd-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .dd-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 26px;
          background: #F3EAF2;
          color: #6F2F6D;
          border-radius: 8px;
          font-size: 14.5px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s ease;
        }
        .dd-btn-secondary:hover { background: #E7D3E6; }
        .dd-btn-block { width: 100%; }

        /* Sidebar */
        .dd-sidebar {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .dd-sidebar-section {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 22px;
        }
        .dd-sidebar-title {
          font-family: 'Fraunces', serif;
          font-size: 17px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 16px;
        }
        .dd-sidebar-cta p {
          font-size: 13.5px;
          line-height: 1.55;
          color: #6B646B;
          margin: 0 0 16px;
        }

        .dd-facts {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dd-facts li {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }
        .dd-fact-label {
          font-size: 12.5px;
          color: #8A7E88;
          font-weight: 500;
        }
        .dd-fact-value {
          font-size: 13.5px;
          color: #241F24;
          font-weight: 600;
          text-align: right;
        }

        .dd-related-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dd-related-link {
          display: flex;
          gap: 12px;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        .dd-related-initial {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #F3EAF2;
          color: #893C87;
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dd-related-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .dd-related-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #241F24;
          line-height: 1.35;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .dd-related-link:hover .dd-related-title { color: #893C87; }
        .dd-related-count {
          font-size: 11.5px;
          color: #8A7E88;
          margin-top: 2px;
        }

        /* Missing */
        .dd-missing {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 80px 24px;
        }
        .dd-missing-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
        }
        .dd-missing h1 {
          font-family: 'Fraunces', serif;
          font-size: 30px;
          color: #241F24;
          margin: 0 0 12px;
        }
        .dd-missing p {
          color: #6B646B;
          font-size: 15px;
          margin: 0 0 24px;
          max-width: 420px;
        }

        /* Responsive */
        @media (max-width: 960px) {
          .dd-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .dd-sidebar { position: static; order: 2; }
          .dd-article { padding: 32px 28px 28px; }
        }
        @media (max-width: 640px) {
          .dd-breadcrumbs { padding-top: 20px; font-size: 12.5px; }
          .dd-hero { padding: 20px 20px 0; }
          .dd-hero-initial { width: 72px; height: 72px; font-size: 32px; }
          .dd-hero-title { font-size: 26px; }
          .dd-hero-meta { gap: 12px; font-size: 12.5px; }
          .dd-layout { padding: 0 16px; margin-top: 24px; }
          .dd-article { padding: 26px 22px 22px; }
          .dd-section-title { font-size: 19px; }
          .dd-section-body { font-size: 15.5px; }
          .dd-programs-grid { grid-template-columns: 1fr; gap: 14px; }
          .dd-cta-bar { flex-direction: column; }
          .dd-cta-bar > * { width: 100%; text-align: center; }
        }

        @media (prefers-reduced-motion: reduce) {
          .dd-progress-bar,
          .dd-btn-primary,
          .dd-btn-secondary,
          .dd-program-card,
          .dd-related-link { transition: none !important; }
        }
      `}</style>
    </>
  );
}

export default DepartmentDetail;