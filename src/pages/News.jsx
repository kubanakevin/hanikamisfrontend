// src/pages/News.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";
const PAGE_SIZE = 9;

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

const truncate = (text, max = 160) => {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
};

function NewsPublic() {
  const [status, setStatus] = useState("loading");
  const [showPreloader, setShowPreloader] = useState(true);

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // null = All
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 0,
    has_more: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // -------- Initial load --------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [catRes, listRes] = await Promise.all([
          fetch(`${API_BASE}/api/client/news/categories`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/client/news?page=1&limit=${PAGE_SIZE}`, {
            credentials: "include",
          }),
        ]);

        const catJson = await catRes.json();
        const listJson = await listRes.json();
        if (cancelled) return;

        if (catJson.success) setCategories(catJson.data || []);
        if (listJson.success) {
          setArticles(listJson.data || []);
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
        console.error("News load error:", err);
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
      body: JSON.stringify({ page_url: "/news" }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // -------- Helpers --------
  const fetchList = useCallback(async ({ category, page }) => {
    const url = new URL(`${API_BASE}/api/client/news`);
    url.searchParams.set("page", page);
    url.searchParams.set("limit", PAGE_SIZE);
    if (category) url.searchParams.set("category", category);

    const res = await fetch(url.toString(), { credentials: "include" });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to load news");
    return json;
  }, []);

  const handleCategoryChange = async (category) => {
    setActiveCategory(category);
    setLoadingMore(true);
    try {
      const json = await fetchList({ category, page: 1 });
      setArticles(json.data || []);
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
      const json = await fetchList({ category: activeCategory, page: next });
      setArticles((prev) => [...prev, ...(json.data || [])]);
      setPagination(json.pagination || pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  // -------- Render --------
  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "error") {
    return (
      <>
        <NavBar />
        <div className="news-error">
          <h2>Couldn't load news</h2>
          <p>Please refresh the page to try again.</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const [featured, ...rest] = articles;

  return (
    <>
      <NavBar />
      <main className="news-page">
        <section className="news-header">
          <h1>News & Updates</h1>
          <p>
            The latest stories, announcements, and milestones from HANIKA
            Anglican Integrated Polytechnic.
          </p>
        </section>

        {categories.length > 0 && (
          <section className="news-filters">
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
          </section>
        )}

        <section className="news-content">
          {articles.length === 0 ? (
            <div className="news-empty">
              <span className="news-empty-icon">📰</span>
              <h3>No articles yet</h3>
              <p>Check back soon for the latest news and updates.</p>
            </div>
          ) : (
            <>
              {/* Featured article */}
              {featured && (
                <article className="news-featured">
                  <Link to={`/news/${featured.slug}`} className="news-featured-link">
                    <div className="news-featured-media">
                      {featured.featured_image ? (
                        <img
                          src={resolveImage(featured.featured_image)}
                          alt={featured.title}
                          loading="eager"
                        />
                      ) : (
                        <div className="news-featured-placeholder">📰</div>
                      )}
                    </div>
                    <div className="news-featured-body">
                      {featured.category && (
                        <span className="news-featured-category">
                          {featured.category}
                        </span>
                      )}
                      <h2 className="news-featured-title">{featured.title}</h2>
                      <p className="news-featured-excerpt">
                        {truncate(featured.excerpt, 220)}
                      </p>
                      <div className="news-meta">
                        {featured.author && (
                          <span className="news-meta-item">
                            ✍️ {featured.author}
                          </span>
                        )}
                        {featured.published_at && (
                          <span className="news-meta-item">
                            {formatDate(featured.published_at)}
                          </span>
                        )}
                      </div>
                      <span className="news-read-more">
                        Read article <span className="arrow">→</span>
                      </span>
                    </div>
                  </Link>
                </article>
              )}

              {/* Rest of the articles */}
              {rest.length > 0 && (
                <div className="news-grid">
                  {rest.map((a) => (
                    <article key={a.id} className="news-card">
                      <Link to={`/news/${a.slug}`} className="news-card-link">
                        <div className="news-card-media">
                          {a.featured_image ? (
                            <img
                              src={resolveImage(a.featured_image)}
                              alt={a.title}
                              loading="lazy"
                            />
                          ) : (
                            <div className="news-card-placeholder">📰</div>
                          )}
                        </div>
                        <div className="news-card-body">
                          {a.category && (
                            <span className="news-card-category">
                              {a.category}
                            </span>
                          )}
                          <h3 className="news-card-title">{a.title}</h3>
                          <p className="news-card-excerpt">
                            {truncate(a.excerpt, 140)}
                          </p>
                          <div className="news-meta">
                            {a.published_at && (
                              <span className="news-meta-item">
                                {formatDate(a.published_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              )}

              {pagination.has_more && (
                <div className="news-loadmore-wrap">
                  <button
                    type="button"
                    className="news-loadmore"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading…" : "Load More"}
                  </button>
                </div>
              )}

              <p className="news-count">
                Showing {articles.length}
                {pagination.total ? ` of ${pagination.total}` : ""} article
                {articles.length === 1 ? "" : "s"}
              </p>
            </>
          )}
        </section>
      </main>

      <Footer />

      <style>{`
        .news-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
        }

        /* Header */
        .news-header {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          padding: 80px 24px 60px;
          text-align: center;
        }
        .news-header h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(32px, 4vw, 48px);
          margin: 0 0 12px;
        }
        .news-header p {
          font-size: 16px;
          color: #EBD9E9;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Filters */
        .news-filters {
          max-width: 1240px;
          margin: 0 auto;
          padding: 32px 24px 0;
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
        .filter-chip:hover { border-color: #893C87; color: #893C87; }
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
        .news-content {
          max-width: 1240px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        /* Featured */
        .news-featured {
          margin-bottom: 48px;
        }
        .news-featured-link {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 0;
          text-decoration: none;
          color: inherit;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .news-featured-link:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(41, 20, 40, 0.10);
        }
        .news-featured-media {
          position: relative;
          width: 100%;
          padding-top: 62%;
          background: #F3EAF2;
          overflow: hidden;
        }
        .news-featured-media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .news-featured-link:hover .news-featured-media img {
          transform: scale(1.04);
        }
        .news-featured-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 72px;
          color: #B96AAE;
        }
        .news-featured-body {
          padding: 36px 36px 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .news-featured-category {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 12px;
        }
        .news-featured-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(22px, 2.4vw, 30px);
          font-weight: 600;
          color: #241F24;
          margin: 0 0 14px;
          line-height: 1.25;
        }
        .news-featured-excerpt {
          font-size: 15px;
          line-height: 1.65;
          color: #6B646B;
          margin: 0 0 18px;
        }
        .news-read-more {
          font-size: 14px;
          font-weight: 700;
          color: #893C87;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .news-read-more .arrow { transition: transform 0.2s ease; }
        .news-featured-link:hover .news-read-more .arrow { transform: translateX(5px); }

        /* Meta */
        .news-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 14px;
        }
        .news-meta-item {
          font-size: 12.5px;
          color: #8A7E88;
        }

        /* Grid */
        .news-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .news-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .news-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(41, 20, 40, 0.10);
        }
        .news-card-link {
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .news-card-media {
          position: relative;
          width: 100%;
          padding-top: 58%;
          background: #F3EAF2;
          overflow: hidden;
        }
        .news-card-media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .news-card:hover .news-card-media img { transform: scale(1.05); }
        .news-card-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
          color: #B96AAE;
        }
        .news-card-body {
          padding: 20px 22px 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .news-card-category {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 8px;
        }
        .news-card-title {
          font-family: 'Fraunces', serif;
          font-size: 19px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 10px;
          line-height: 1.3;
        }
        .news-card-excerpt {
          font-size: 14px;
          line-height: 1.55;
          color: #6B646B;
          margin: 0 0 14px;
          flex: 1;
        }

        /* Load more + count */
        .news-loadmore-wrap {
          display: flex;
          justify-content: center;
          margin-top: 40px;
        }
        .news-loadmore {
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
        .news-loadmore:hover:not(:disabled) { background: #6F2F6D; }
        .news-loadmore:disabled { opacity: 0.6; cursor: wait; }

        .news-count {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #6B646B;
        }

        /* Empty + error */
        .news-empty {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 60px 24px;
          text-align: center;
          max-width: 480px;
          margin: 0 auto;
        }
        .news-empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .news-empty h3 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          color: #241F24;
          margin: 0 0 8px;
        }
        .news-empty p { color: #6B646B; margin: 0; }

        .news-error {
          text-align: center;
          padding: 80px 24px;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .news-error h2 {
          color: #893C87;
          font-size: 28px;
          margin-bottom: 8px;
        }
        .news-error p { color: #6B646B; margin-bottom: 20px; }
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
        @media (max-width: 900px) {
          .news-featured-link {
            grid-template-columns: 1fr;
          }
          .news-featured-body {
            padding: 26px 24px 28px;
          }
        }
        @media (max-width: 640px) {
          .news-header { padding: 64px 20px 44px; }
          .news-header h1 { font-size: 30px; }
          .news-header p { font-size: 15px; }
          .news-content { padding: 28px 16px 60px; }
          .news-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .news-featured-link,
          .news-featured-media img,
          .news-card,
          .news-card-media img,
          .news-read-more .arrow { transition: none !important; }
        }
      `}</style>
    </>
  );
}

export default NewsPublic;