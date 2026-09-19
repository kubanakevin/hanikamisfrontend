// src/pages/Gallery.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";
const PAGE_SIZE = 24;

// Resolve an image path from the DB into a full, loadable URL.
const resolveImage = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

function Gallery() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [showPreloader, setShowPreloader] = useState(true);

  const [activeCategory, setActiveCategory] = useState(null); // null = "All"
  const [images, setImages] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 0,
    has_more: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const lightboxRef = useRef(null);

  // -------- Initial load: categories + first page of images --------
  useEffect(() => {
    let cancelled = false;

    async function loadGallery() {
      try {
        const res = await fetch(
          `${API_BASE}/api/client/gallery?page=1&limit=${PAGE_SIZE}`,
          { credentials: "include" }
        );
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setData(json.data);
          setImages(json.data.images || []);
          setPagination(json.data.pagination);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      } finally {
        setTimeout(() => setShowPreloader(false), 800);
      }
    }

    loadGallery();

    fetch(`${API_BASE}/api/client/visits/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page_url: "/gallery" }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // -------- Fetch helper --------
  const fetchImages = useCallback(async (categorySlug, page) => {
    const url = new URL(`${API_BASE}/api/client/gallery`);
    url.searchParams.set("page", page);
    url.searchParams.set("limit", PAGE_SIZE);
    if (categorySlug) url.searchParams.set("category", categorySlug);

    const res = await fetch(url.toString(), { credentials: "include" });
    const json = await res.json();
    if (!json.success) throw new Error("Failed to load images");
    return json.data;
  }, []);

  const handleCategoryChange = async (slug) => {
    setActiveCategory(slug);
    setLoadingMore(true);
    try {
      const fresh = await fetchImages(slug, 1);
      setImages(fresh.images || []);
      setPagination(fresh.pagination);
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
      const fresh = await fetchImages(activeCategory, next);
      setImages((prev) => [...prev, ...(fresh.images || [])]);
      setPagination(fresh.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  // -------- Lightbox navigation --------
  const openLightbox = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);

  const showPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + images.length) % images.length
    );
  }, [images.length]);

  const showNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % images.length
    );
  }, [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIndex, showPrev, showNext]);

  useEffect(() => {
    if (lightboxIndex !== null && lightboxRef.current) {
      lightboxRef.current.focus();
    }
  }, [lightboxIndex]);

  // -------- Render states --------
  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "error" || !data) {
    return (
      <>
        <NavBar />
        <div className="gallery-error">
          <h2>Couldn't load the gallery</h2>
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

  const { categories = [] } = data;
  const activeLightboxImage =
    lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <>
      <NavBar />
      <main className="gallery-page">
        <section className="gallery-header">
          <h1>Gallery</h1>
          <p>Moments, milestones, and memories from our campus life.</p>
        </section>

        {categories.length > 0 && (
          <section className="gallery-filters">
            <button
              type="button"
              className={`filter-chip ${activeCategory === null ? "active" : ""}`}
              onClick={() => handleCategoryChange(null)}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`filter-chip ${
                  activeCategory === cat.slug ? "active" : ""
                }`}
                onClick={() => handleCategoryChange(cat.slug)}
              >
                {cat.name}
                <span className="chip-count">{cat.image_count}</span>
              </button>
            ))}
          </section>
        )}

        <section className="gallery-content">
          {images.length === 0 ? (
            <div className="gallery-empty">
              <p>No images in this category yet.</p>
            </div>
          ) : (
            <>
              <div className="gallery-masonry">
                {images.map((img, idx) => {
                  const url = resolveImage(img.image_url);
                  return (
                    <button
                      key={img.id}
                      type="button"
                      className="gallery-tile"
                      onClick={() => openLightbox(idx)}
                      aria-label={`Open ${img.title || "image"}`}
                    >
                      {url && (
                        <img
                          src={url}
                          alt={img.title || "Gallery"}
                          loading="lazy"
                        />
                      )}
                      <div className="gallery-tile-overlay">
                        <span className="tile-title">{img.title}</span>
                        {img.category_name && (
                          <span className="tile-category">
                            {img.category_name}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {pagination.has_more && (
                <div className="gallery-loadmore-wrap">
                  <button
                    type="button"
                    className="gallery-loadmore"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading…" : "Load More"}
                  </button>
                </div>
              )}

              <p className="gallery-count">
                Showing {images.length} of {pagination.total} images
              </p>
            </>
          )}
        </section>

        {activeLightboxImage && (
          <div
            className="lightbox"
            ref={lightboxRef}
            tabIndex={-1}
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="lightbox-close"
              onClick={closeLightbox}
              aria-label="Close"
            >
              ×
            </button>

            {images.length > 1 && (
              <button
                type="button"
                className="lightbox-nav lightbox-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Previous image"
              >
                ‹
              </button>
            )}

            <div
              className="lightbox-content"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={resolveImage(activeLightboxImage.image_url)}
                alt={activeLightboxImage.title || "Gallery image"}
              />
              <div className="lightbox-meta">
                <h3>{activeLightboxImage.title}</h3>
                {activeLightboxImage.caption && (
                  <p>{activeLightboxImage.caption}</p>
                )}
                {activeLightboxImage.category_name && (
                  <span className="lightbox-cat">
                    {activeLightboxImage.category_name}
                  </span>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <button
                type="button"
                className="lightbox-nav lightbox-next"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Next image"
              >
                ›
              </button>
            )}
          </div>
        )}
      </main>

      <Footer />

      <style>{`
        .gallery-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
        }

        .gallery-header {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          padding: 80px 24px 60px;
          text-align: center;
        }

        .gallery-header h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(32px, 4vw, 48px);
          margin: 0 0 12px;
        }

        .gallery-header p {
          font-size: 16px;
          color: #EBD9E9;
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .gallery-filters {
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

        .gallery-content {
          max-width: 1240px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        .gallery-masonry {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        .gallery-tile {
          position: relative;
          aspect-ratio: 1;
          border: none;
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          background: #F3EAF2;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .gallery-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(41, 20, 40, 0.12);
        }

        .gallery-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .gallery-tile:hover img {
          transform: scale(1.06);
        }

        .gallery-tile-overlay {
          position: absolute;
          inset: auto 0 0 0;
          background: linear-gradient(transparent, rgba(41, 20, 40, 0.8));
          padding: 32px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .gallery-tile:hover .gallery-tile-overlay,
        .gallery-tile:focus-visible .gallery-tile-overlay {
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

        .gallery-empty {
          text-align: center;
          padding: 80px 24px;
          color: #6B646B;
        }

        .gallery-loadmore-wrap {
          display: flex;
          justify-content: center;
          margin-top: 40px;
        }

        .gallery-loadmore {
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

        .gallery-loadmore:hover:not(:disabled) {
          background: #6F2F6D;
        }

        .gallery-loadmore:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .gallery-count {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #6B646B;
        }

        .lightbox {
          position: fixed;
          inset: 0;
          background: rgba(20, 10, 20, 0.92);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          outline: none;
          animation: lb-fade 0.2s ease;
        }

        @keyframes lb-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .lightbox-content {
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .lightbox-content img {
          max-width: 90vw;
          max-height: 75vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .lightbox-meta {
          text-align: center;
          color: #FFFFFF;
          max-width: 640px;
        }

        .lightbox-meta h3 {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          margin: 0 0 4px;
        }

        .lightbox-meta p {
          font-size: 14px;
          color: #EBD9E9;
          margin: 0;
          line-height: 1.5;
        }

        .lightbox-cat {
          display: inline-block;
          margin-top: 8px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #EBD9E9;
          background: rgba(255,255,255,0.12);
          padding: 3px 12px;
          border-radius: 999px;
        }

        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 24px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: none;
          color: #FFFFFF;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .lightbox-close:hover {
          background: rgba(255,255,255,0.25);
        }

        .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: none;
          color: #FFFFFF;
          font-size: 34px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
        }

        .lightbox-nav:hover {
          background: rgba(255,255,255,0.25);
        }

        .lightbox-prev { left: 20px; }
        .lightbox-next { right: 20px; }

        .gallery-error {
          text-align: center;
          padding: 80px 24px;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .gallery-error h2 {
          color: #893C87;
          font-size: 28px;
          margin-bottom: 8px;
        }

        .gallery-error p {
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

        .retry-btn:hover {
          background: #6F2F6D;
        }

        @media (max-width: 640px) {
          .gallery-masonry {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
          }

          .lightbox-nav {
            width: 42px;
            height: 42px;
            font-size: 26px;
          }

          .lightbox-prev { left: 8px; }
          .lightbox-next { right: 8px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .gallery-tile,
          .gallery-tile img {
            transition: none;
          }

          .lightbox {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

export default Gallery;