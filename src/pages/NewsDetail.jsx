// src/pages/NewsDetail.jsx
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

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

const readingTime = (text) => {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
};

function NewsDetail() {
  const { slug } = useParams();
  const [status, setStatus] = useState("loading");
  const [article, setArticle] = useState(null);
  const [showPreloader, setShowPreloader] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const articleRef = useRef(null);

  // -------- Load --------
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/client/news/${slug}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;

        if (json.success) {
          setArticle(json.data);
          setStatus("ready");
        } else {
          setStatus("notfound");
        }
      } catch (err) {
        console.error("News detail load error:", err);
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

  // -------- Reading progress bar --------
  useEffect(() => {
    if (!article) return;
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
  }, [article]);

  // -------- Render states --------
  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "notfound" || status === "error" || !article) {
    return (
      <>
        <NavBar />
        <main className="nd-missing">
          <span className="nd-missing-icon">📰</span>
          <h1>Article not found</h1>
          <p>
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/news" className="nd-btn-primary">
            Back to News
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const readMins = readingTime(article.content);

  return (
    <>
      <NavBar />

      {/* Reading progress bar */}
      <div className="nd-progress" aria-hidden="true">
        <div
          className="nd-progress-bar"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <main className="nd-page">
        {/* Breadcrumbs */}
        <nav className="nd-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="sep">›</span>
          <Link to="/news">News</Link>
          <span className="sep">›</span>
          <span className="current">{article.title}</span>
        </nav>

        {/* Hero */}
        <header className="nd-hero">
          {article.category && (
            <span className="nd-hero-category">{article.category}</span>
          )}
          <h1 className="nd-hero-title">{article.title}</h1>

          <div className="nd-hero-meta">
            {article.author && (
              <span className="nd-meta-item">✍️ {article.author}</span>
            )}
            {article.published_at && (
              <span className="nd-meta-item">
                {formatDate(article.published_at)}
              </span>
            )}
            <span className="nd-meta-item">🕐 {readMins} min read</span>
            {typeof article.views === "number" && (
              <span className="nd-meta-item">👁️ {article.views} views</span>
            )}
          </div>
        </header>

        {/* Featured image */}
        {article.featured_image && (
          <figure className="nd-hero-image">
            <img
              src={resolveImage(article.featured_image)}
              alt={article.title}
            />
          </figure>
        )}

        {/* Body — two-column on wide screens */}
        <div className="nd-layout">
          <article className="nd-article" ref={articleRef}>
            {article.excerpt && (
              <p className="nd-lead">{article.excerpt}</p>
            )}

            <div className="nd-content">
              {article.content
                ? article.content.split("\n").map((line, i) => {
                    const trimmed = line.trim();
                    if (trimmed === "") return <br key={i} />;
                    return <p key={i}>{trimmed}</p>;
                  })
                : null}
            </div>

            <div className="nd-back-wrap">
              <Link to="/news" className="nd-btn-secondary">
                ← Back to News
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="nd-sidebar">
            {article.related && article.related.length > 0 && (
              <div className="nd-sidebar-section">
                <h3 className="nd-sidebar-title">Related articles</h3>
                <ul className="nd-related-list">
                  {article.related.map((r) => (
                    <li key={r.id} className="nd-related-item">
                      <Link to={`/news/${r.slug}`} className="nd-related-link">
                        <div className="nd-related-thumb">
                          {r.featured_image ? (
                            <img
                              src={resolveImage(r.featured_image)}
                              alt={r.title}
                              loading="lazy"
                            />
                          ) : (
                            <div className="nd-related-placeholder">📰</div>
                          )}
                        </div>
                        <div className="nd-related-info">
                          {r.category && (
                            <span className="nd-related-cat">
                              {r.category}
                            </span>
                          )}
                          <span className="nd-related-title">{r.title}</span>
                          {r.published_at && (
                            <span className="nd-related-date">
                              {formatDate(r.published_at)}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="nd-sidebar-section">
              <h3 className="nd-sidebar-title">Share</h3>
              <div className="nd-share">
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    window.location.href
                  )}&text=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nd-share-btn"
                >
                  Twitter / X
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    window.location.href
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nd-share-btn"
                >
                  Facebook
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    window.location.href
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nd-share-btn"
                >
                  LinkedIn
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `${article.title} ${window.location.href}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nd-share-btn"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <style>{`
        .nd-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* Reading progress bar */
        .nd-progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: transparent;
          z-index: 200;
          pointer-events: none;
        }
        .nd-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #893C87, #B96AAE);
          transition: width 0.08s linear;
        }

        /* Breadcrumbs */
        .nd-breadcrumbs {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 24px 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #8A7E88;
        }
        .nd-breadcrumbs a {
          color: #893C87;
          text-decoration: none;
          font-weight: 500;
        }
        .nd-breadcrumbs a:hover { text-decoration: underline; }
        .nd-breadcrumbs .sep { color: #B5ADB5; }
        .nd-breadcrumbs .current {
          color: #6B646B;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Hero */
        .nd-hero {
          max-width: 820px;
          margin: 0 auto;
          padding: 24px 24px 0;
          text-align: center;
        }
        .nd-hero-category {
          display: inline-block;
          font-size: 11.5px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          background: #F3EAF2;
          padding: 5px 14px;
          border-radius: 999px;
          margin-bottom: 16px;
        }
        .nd-hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(28px, 4.2vw, 46px);
          font-weight: 600;
          color: #241F24;
          line-height: 1.18;
          margin: 0 0 22px;
          letter-spacing: -0.4px;
        }
        .nd-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          justify-content: center;
          align-items: center;
          padding-bottom: 28px;
          border-bottom: 1px solid #E1D9E0;
        }
        .nd-meta-item {
          font-size: 13px;
          color: #6B646B;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* Featured image */
        .nd-hero-image {
          max-width: 1000px;
          margin: 32px auto 0;
          padding: 0 24px;
        }
        .nd-hero-image img {
          display: block;
          width: 100%;
          height: auto;
          max-height: 520px;
          object-fit: cover;
          border-radius: 14px;
          box-shadow: 0 20px 48px rgba(41, 20, 40, 0.12);
        }

        /* Layout */
        .nd-layout {
          max-width: 1160px;
          margin: 40px auto 0;
          padding: 0 24px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 56px;
          align-items: start;
        }

        /* Article body */
        .nd-article {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 40px 44px 36px;
          border: 1px solid #E1D9E0;
        }
        .nd-lead {
          font-family: 'Fraunces', serif;
          font-size: 19px;
          line-height: 1.6;
          color: #4A444A;
          font-style: italic;
          margin: 0 0 28px;
          padding-left: 18px;
          border-left: 3px solid #B96AAE;
        }
        .nd-content {
          font-size: 16.5px;
          line-height: 1.8;
          color: #292329;
          font-family: 'Inter', sans-serif;
        }
        .nd-content p {
          margin: 0 0 18px;
        }
        .nd-content p:last-child { margin-bottom: 0; }

        .nd-back-wrap {
          margin-top: 36px;
          padding-top: 24px;
          border-top: 1px solid #E1D9E0;
        }
        .nd-btn-secondary {
          display: inline-block;
          padding: 12px 24px;
          background: #F3EAF2;
          color: #6F2F6D;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          border-radius: 8px;
          transition: background 0.15s ease;
        }
        .nd-btn-secondary:hover { background: #E7D3E6; }

        /* Sidebar */
        .nd-sidebar {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .nd-sidebar-section {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 22px 22px 24px;
        }
        .nd-sidebar-title {
          font-family: 'Fraunces', serif;
          font-size: 17px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 16px;
        }

        /* Related list */
        .nd-related-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .nd-related-link {
          display: flex;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          align-items: flex-start;
        }
        .nd-related-thumb {
          width: 64px;
          height: 64px;
          flex-shrink: 0;
          border-radius: 10px;
          overflow: hidden;
          background: #F3EAF2;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nd-related-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .nd-related-placeholder { font-size: 26px; color: #B96AAE; }
        .nd-related-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .nd-related-cat {
          font-size: 10.5px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 3px;
        }
        .nd-related-title {
          font-size: 14px;
          font-weight: 600;
          color: #241F24;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .nd-related-link:hover .nd-related-title { color: #893C87; }
        .nd-related-date {
          font-size: 12px;
          color: #8A7E88;
          margin-top: 4px;
        }

        /* Share buttons */
        .nd-share {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .nd-share-btn {
          flex: 1 1 calc(50% - 4px);
          text-align: center;
          padding: 9px 12px;
          background: #F8F5F7;
          border: 1px solid #E1D9E0;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          color: #4A444A;
          text-decoration: none;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .nd-share-btn:hover {
          background: #F3EAF2;
          border-color: #B96AAE;
          color: #893C87;
        }

        /* Missing state */
        .nd-missing {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 80px 24px;
        }
        .nd-missing-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
        }
        .nd-missing h1 {
          font-family: 'Fraunces', serif;
          font-size: 30px;
          color: #241F24;
          margin: 0 0 12px;
        }
        .nd-missing p {
          color: #6B646B;
          font-size: 15px;
          margin: 0 0 24px;
          max-width: 420px;
        }
        .nd-btn-primary {
          display: inline-block;
          padding: 12px 28px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14.5px;
          transition: all 0.15s ease;
        }
        .nd-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }

        /* Responsive */
        @media (max-width: 960px) {
          .nd-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .nd-sidebar {
            position: static;
            order: 2;
          }
          .nd-article {
            padding: 32px 28px 28px;
          }
        }
        @media (max-width: 640px) {
          .nd-breadcrumbs { padding-top: 20px; font-size: 12.5px; }
          .nd-hero { padding-top: 20px; }
          .nd-hero-title { font-size: 26px; }
          .nd-hero-meta { gap: 12px; font-size: 12px; }
          .nd-hero-image { padding: 0 16px; margin-top: 24px; }
          .nd-hero-image img { border-radius: 10px; }
          .nd-layout { padding: 0 16px; margin-top: 24px; }
          .nd-article { padding: 26px 20px 22px; }
          .nd-lead { font-size: 17px; }
          .nd-content { font-size: 15.5px; }
          .nd-share-btn { flex-basis: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .nd-progress-bar,
          .nd-related-link,
          .nd-btn-primary,
          .nd-btn-secondary,
          .nd-share-btn { transition: none !important; }
        }
      `}</style>
    </>
  );
}

export default NewsDetail;