// src/pages/ProgramDetail.jsx
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

// Split a multi-line text into paragraph nodes; blank lines become <br />.
const renderMultiline = (text) => {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (trimmed === "") return <br key={i} />;
    // Bullet support, same convention as the AI answers
    if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
      return (
        <div key={i} className="pd-list-line">
          <span className="pd-list-bullet">•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    }
    return <p key={i}>{trimmed}</p>;
  });
};

function ProgramDetail() {
  const { slug } = useParams();
  const [status, setStatus] = useState("loading");
  const [program, setProgram] = useState(null);
  const [showPreloader, setShowPreloader] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const articleRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/client/programs/${slug}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;

        if (json.success) {
          setProgram(json.data);
          setStatus("ready");
        } else {
          setStatus("notfound");
        }
      } catch (err) {
        console.error("Program detail load error:", err);
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
    if (!program) return;
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
  }, [program]);

  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "notfound" || status === "error" || !program) {
    return (
      <>
        <NavBar />
        <main className="pd-missing">
          <span className="pd-missing-icon">📚</span>
          <h1>Program not found</h1>
          <p>
            The program you're looking for doesn't exist or is no longer
            available.
          </p>
          <Link to="/programs" className="pd-btn-primary">
            Back to Programs
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />

      {/* Reading progress bar */}
      <div className="pd-progress" aria-hidden="true">
        <div
          className="pd-progress-bar"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <main className="pd-page">
        {/* Breadcrumbs */}
        <nav className="pd-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="sep">›</span>
          <Link to="/programs">Programs</Link>
          <span className="sep">›</span>
          <span className="current">{program.name}</span>
        </nav>

        {/* Hero */}
        <header className="pd-hero">
          <div className="pd-hero-meta-top">
            <span
              className={`pd-level-badge pd-level-badge--${(
                program.level || ""
              ).toLowerCase()}`}
            >
              {levelLabel(program.level)}
            </span>
            {program.department_name && (
              <Link
                to={`/programs?department=${program.department_slug}`}
                className="pd-dept-link"
              >
                {program.department_name}
              </Link>
            )}
            {program.is_featured ? (
              <span className="pd-featured-pill">★ Featured</span>
            ) : null}
          </div>

          <h1 className="pd-hero-title">{program.name}</h1>

          {program.short_description && (
            <p className="pd-hero-sub">{program.short_description}</p>
          )}

          <div className="pd-hero-meta">
            {program.duration && (
              <span className="pd-meta-item">
                <span className="pd-meta-icon">⏱️</span>
                Duration: <strong>{program.duration}</strong>
              </span>
            )}
            {program.level && (
              <span className="pd-meta-item">
                <span className="pd-meta-icon">🎓</span>
                Level: <strong>{levelLabel(program.level)}</strong>
              </span>
            )}
            {program.department_name && (
              <span className="pd-meta-item">
                <span className="pd-meta-icon">🏛️</span>
                Department: <strong>{program.department_name}</strong>
              </span>
            )}
          </div>
        </header>

        {/* Featured image */}
        {program.image_url && (
          <figure className="pd-hero-image">
            <img
              src={resolveImage(program.image_url)}
              alt={program.name}
            />
          </figure>
        )}

        {/* Body */}
        <div className="pd-layout">
          <article className="pd-article" ref={articleRef}>
            {program.full_description && (
              <section className="pd-section">
                <h2 className="pd-section-title">About this program</h2>
                <div className="pd-section-body">
                  {renderMultiline(program.full_description)}
                </div>
              </section>
            )}

            {program.entry_requirements && (
              <section className="pd-section">
                <h2 className="pd-section-title">Entry requirements</h2>
                <div className="pd-section-body">
                  {renderMultiline(program.entry_requirements)}
                </div>
              </section>
            )}

            {program.career_opportunities && (
              <section className="pd-section">
                <h2 className="pd-section-title">Career opportunities</h2>
                <div className="pd-section-body">
                  {renderMultiline(program.career_opportunities)}
                </div>
              </section>
            )}

            {!program.full_description &&
              !program.entry_requirements &&
              !program.career_opportunities && (
                <p className="pd-empty-note">
                  More details about this program are coming soon. Contact the
                  admissions office for full information.
                </p>
              )}

            <div className="pd-cta-bar">
              <Link to="/admissions#apply" className="pd-btn-primary">
                Apply for this program →
              </Link>
              <Link to="/programs" className="pd-btn-secondary">
                ← Back to Programs
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="pd-sidebar">
            <div className="pd-sidebar-section">
              <h3 className="pd-sidebar-title">Quick facts</h3>
              <ul className="pd-facts">
                <li>
                  <span className="pd-fact-label">Level</span>
                  <span className="pd-fact-value">
                    {levelLabel(program.level)}
                  </span>
                </li>
                {program.duration && (
                  <li>
                    <span className="pd-fact-label">Duration</span>
                    <span className="pd-fact-value">{program.duration}</span>
                  </li>
                )}
                {program.department_name && (
                  <li>
                    <span className="pd-fact-label">Department</span>
                    <span className="pd-fact-value">
                      {program.department_name}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {program.related && program.related.length > 0 && (
              <div className="pd-sidebar-section">
                <h3 className="pd-sidebar-title">More from this department</h3>
                <ul className="pd-related-list">
                  {program.related.map((r) => (
                    <li key={r.id} className="pd-related-item">
                      <Link to={`/programs/${r.slug}`} className="pd-related-link">
                        <div className="pd-related-thumb">
                          {r.image_url ? (
                            <img
                              src={resolveImage(r.image_url)}
                              alt={r.name}
                              loading="lazy"
                            />
                          ) : (
                            <div className="pd-related-placeholder">📚</div>
                          )}
                        </div>
                        <div className="pd-related-info">
                          <span className="pd-related-level">
                            {levelLabel(r.level)}
                          </span>
                          <span className="pd-related-title">{r.name}</span>
                          {r.short_description && (
                            <span className="pd-related-excerpt">
                              {truncate(r.short_description, 70)}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pd-sidebar-section pd-sidebar-cta">
              <h3 className="pd-sidebar-title">Ready to apply?</h3>
              <p>
                Applications are open. Start your journey at HANIKA today.
              </p>
              <Link to="/admissions#apply" className="pd-btn-primary pd-btn-block">
                Apply Now
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <style>{`
        .pd-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* Reading progress */
        .pd-progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: transparent;
          z-index: 200;
          pointer-events: none;
        }
        .pd-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #893C87, #B96AAE);
          transition: width 0.08s linear;
        }

        /* Breadcrumbs */
        .pd-breadcrumbs {
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
        .pd-breadcrumbs a {
          color: #893C87;
          text-decoration: none;
          font-weight: 500;
        }
        .pd-breadcrumbs a:hover { text-decoration: underline; }
        .pd-breadcrumbs .sep { color: #B5ADB5; }
        .pd-breadcrumbs .current {
          color: #6B646B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        /* Hero */
        .pd-hero {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 24px 0;
          text-align: center;
        }
        .pd-hero-meta-top {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          align-items: center;
          margin-bottom: 18px;
        }
        .pd-level-badge {
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #FFFFFF;
          background: #6B646B;
        }
        .pd-level-badge--certificate { background: #4A90D9; }
        .pd-level-badge--diploma    { background: #2E7D32; }
        .pd-level-badge--degree     { background: #D69E2E; }

        .pd-dept-link {
          font-size: 12px;
          font-weight: 700;
          color: #893C87;
          background: #F3EAF2;
          padding: 5px 14px;
          border-radius: 999px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .pd-dept-link:hover { background: #E7D3E6; }

        .pd-featured-pill {
          font-size: 11px;
          font-weight: 700;
          color: #1a1a1a;
          background: linear-gradient(135deg, #FFB800, #FF8C00);
          padding: 5px 12px;
          border-radius: 999px;
          letter-spacing: 0.5px;
        }

        .pd-hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(30px, 4.4vw, 48px);
          font-weight: 600;
          color: #241F24;
          line-height: 1.18;
          margin: 0 0 14px;
          letter-spacing: -0.4px;
        }
        .pd-hero-sub {
          font-size: 17px;
          line-height: 1.6;
          color: #6B646B;
          max-width: 680px;
          margin: 0 auto 22px;
        }
        .pd-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          padding-bottom: 28px;
          border-bottom: 1px solid #E1D9E0;
        }
        .pd-meta-item {
          font-size: 13px;
          color: #6B646B;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .pd-meta-item strong { color: #241F24; font-weight: 600; }
        .pd-meta-icon { font-size: 14px; }

        /* Hero image */
        .pd-hero-image {
          max-width: 1080px;
          margin: 32px auto 0;
          padding: 0 24px;
        }
        .pd-hero-image img {
          display: block;
          width: 100%;
          max-height: 520px;
          object-fit: cover;
          border-radius: 16px;
          box-shadow: 0 20px 48px rgba(41, 20, 40, 0.12);
        }

        /* Layout */
        .pd-layout {
          max-width: 1160px;
          margin: 40px auto 0;
          padding: 0 24px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 48px;
          align-items: start;
        }

        /* Article */
        .pd-article {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 40px 44px 36px;
        }
        .pd-section { margin-bottom: 32px; }
        .pd-section:last-child { margin-bottom: 0; }

        .pd-section-title {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid #F0E6EF;
        }

        .pd-section-body {
          font-size: 16px;
          line-height: 1.75;
          color: #292329;
        }
        .pd-section-body p { margin: 0 0 12px; }
        .pd-section-body p:last-child { margin-bottom: 0; }

        .pd-list-line {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
          align-items: flex-start;
        }
        .pd-list-bullet {
          color: #B96AAE;
          font-weight: 700;
          line-height: 1.75;
          flex-shrink: 0;
        }

        .pd-empty-note {
          font-size: 15px;
          color: #6B646B;
          font-style: italic;
          margin: 0 0 24px;
        }

        .pd-cta-bar {
          margin-top: 36px;
          padding-top: 28px;
          border-top: 1px solid #E1D9E0;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pd-btn-primary {
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
        .pd-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .pd-btn-block { width: 100%; }

        .pd-btn-secondary {
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
        .pd-btn-secondary:hover { background: #E7D3E6; }

        /* Sidebar */
        .pd-sidebar {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .pd-sidebar-section {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 22px 22px 22px;
        }
        .pd-sidebar-title {
          font-family: 'Fraunces', serif;
          font-size: 17px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 16px;
        }
        .pd-sidebar-cta p {
          font-size: 13.5px;
          line-height: 1.55;
          color: #6B646B;
          margin: 0 0 16px;
        }

        /* Facts */
        .pd-facts {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pd-facts li {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }
        .pd-fact-label {
          font-size: 12.5px;
          color: #8A7E88;
          font-weight: 500;
        }
        .pd-fact-value {
          font-size: 13.5px;
          color: #241F24;
          font-weight: 600;
          text-align: right;
        }

        /* Related */
        .pd-related-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pd-related-link {
          display: flex;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          align-items: flex-start;
        }
        .pd-related-thumb {
          width: 56px;
          height: 56px;
          flex-shrink: 0;
          border-radius: 10px;
          overflow: hidden;
          background: #F3EAF2;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pd-related-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pd-related-placeholder { font-size: 24px; color: #B96AAE; }
        .pd-related-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .pd-related-level {
          font-size: 10.5px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 3px;
        }
        .pd-related-title {
          font-size: 14px;
          font-weight: 600;
          color: #241F24;
          line-height: 1.35;
        }
        .pd-related-link:hover .pd-related-title { color: #893C87; }
        .pd-related-excerpt {
          font-size: 12px;
          color: #8A7E88;
          margin-top: 3px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Missing state */
        .pd-missing {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 80px 24px;
        }
        .pd-missing-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
        }
        .pd-missing h1 {
          font-family: 'Fraunces', serif;
          font-size: 30px;
          color: #241F24;
          margin: 0 0 12px;
        }
        .pd-missing p {
          color: #6B646B;
          font-size: 15px;
          margin: 0 0 24px;
          max-width: 420px;
        }

        /* Responsive */
        @media (max-width: 960px) {
          .pd-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .pd-sidebar { position: static; order: 2; }
          .pd-article { padding: 32px 28px 28px; }
        }
        @media (max-width: 640px) {
          .pd-breadcrumbs { padding-top: 20px; font-size: 12.5px; }
          .pd-hero { padding: 20px 20px 0; }
          .pd-hero-title { font-size: 26px; }
          .pd-hero-sub { font-size: 15px; }
          .pd-hero-meta { gap: 12px; font-size: 12px; }
          .pd-hero-image { padding: 0 16px; margin-top: 24px; }
          .pd-hero-image img { border-radius: 10px; }
          .pd-layout { padding: 0 16px; margin-top: 24px; }
          .pd-article { padding: 26px 22px 22px; }
          .pd-section-title { font-size: 19px; }
          .pd-section-body { font-size: 15.5px; }
          .pd-cta-bar { flex-direction: column; }
          .pd-cta-bar > * { width: 100%; text-align: center; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pd-progress-bar,
          .pd-btn-primary,
          .pd-btn-secondary,
          .pd-related-link { transition: none !important; }
        }
      `}</style>
    </>
  );
}

export default ProgramDetail;