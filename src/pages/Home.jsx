// src/pages/Home.jsx
import { useState, useEffect, useRef } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

// Resolve an image/video path coming from the DB into a full, loadable URL.
// Handles: relative paths like "/uploads/...", already-absolute URLs
// (http/https), and empty/null values.
const resolveImage = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

// Guess a MIME type from the file extension so browsers don't refuse to
// probe the <source> (some browsers skip sources with no usable type hint,
// especially cross-origin).
const getVideoType = (url) => {
  if (!url) return undefined;
  const ext = url.split(".").pop().split("?")[0].toLowerCase();
  const map = {
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
    mov: "video/quicktime",
  };
  return map[ext];
};

// Renders the media (image or video) for a single hero slide. Split out so
// each slide gets its own <video> element that mounts/unmounts cleanly when
// the carousel advances, and so autoplay is driven explicitly via .play()
// instead of relying solely on the autoPlay attribute (which browsers can
// silently ignore depending on how/when muted gets applied).
function HeroMedia({ banner }) {
  const videoRef = useRef(null);

  // Normalize media_type so stray casing/whitespace from the DB ("Video",
  // " video") doesn't silently fall through to the image branch.
  const mediaType = (banner.media_type || "").trim().toLowerCase();
  const isVideo = mediaType === "video" && !!banner.video_url;

  const imageUrl = resolveImage(banner.image_url);
  const videoUrl = resolveImage(banner.video_url);
  const videoThumb = resolveImage(banner.video_thumbnail);

  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const videoEl = videoRef.current;

    // Set muted as a JS property (not just the attribute) before calling
    // play() — this is what actually satisfies browser autoplay policies.
    videoEl.muted = true;
    videoEl.defaultMuted = true;

    // Explicitly reload the source before playing. Needed in some browsers
    // when the <source> child changes rather than video.src being set
    // directly — otherwise the element can keep referencing a stale source.
    videoEl.load();

    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        // Autoplay can still be blocked (e.g. low-power mode, some mobile
        // browsers). The poster/thumbnail will show instead — not a crash.
        console.warn("Hero video autoplay was blocked:", err);
      });
    }
  }, [isVideo, videoUrl]);

  if (isVideo) {
    return (
      <video
        key={videoUrl}
        ref={videoRef}
        className="hero-media hero-video"
        poster={videoThumb || undefined}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        onError={(e) =>
          console.error("Hero video failed to load:", videoUrl, e.target?.error)
        }
      >
        <source src={videoUrl} type={getVideoType(videoUrl)} />
      </video>
    );
  }

  if (imageUrl) {
    return <div className="hero-media hero-image" style={{ backgroundImage: `url(${imageUrl})` }} />;
  }

  return null;
}

function Home() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [showPreloader, setShowPreloader] = useState(true);
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadHome() {
      try {
        const res = await fetch(`${API_BASE}/api/client/home`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setData(json.data);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      } finally {
        setTimeout(() => {
          setShowPreloader(false);
        }, 800);
      }
    }

    loadHome();

    fetch(`${API_BASE}/api/client/visits/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page_url: "/" }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Hero carousel: cycle through every active banner (image or video), not
  // just the first one. Declared unconditionally (before any early return)
  // to keep hook order stable, using a safe fallback while data is loading.
  const heroBanners = data?.hero_banners || [];

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const id = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroBanners.length);
    }, 7000);
    return () => clearInterval(id);
  }, [heroBanners.length]);

  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "error" || !data) {
    return (
      <>
        <NavBar />
        <div className="home-error">
          <h2>Something went wrong</h2>
          <p>Please refresh the page to try again.</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const {
    about,
    announcements = [],
    departments = [],
    featured_programs = [],
    why_choose = [],
    cta,
    upcoming_events = [],
    latest_news = [],
    gallery_images = [],
    contact,
    stats,
  } = data;

  const activeHero = heroBanners[heroSlide] || heroBanners[0] || {};
  const aboutImage = resolveImage(about?.image_url);
  const ctaImage = resolveImage(cta?.background_image);

  return (
    <>
      <NavBar />
      <main className="school-home">
        {/* Hero Section */}
        <section className="hero-section">
          <HeroMedia banner={activeHero} />

          <div className="hero-overlay">
            <div className="hero-content">
              <h1>{activeHero.title || "Welcome to Our School"}</h1>
              <p className="hero-subtitle">{activeHero.subtitle || "Excellence in Education"}</p>
              <p className="hero-description">{activeHero.description}</p>
              {activeHero.button_text && (
                <a href={activeHero.button_link || "#"} className="hero-btn">
                  {activeHero.button_text}
                </a>
              )}
            </div>
          </div>

          {heroBanners.length > 1 && (
            <div className="hero-dots">
              {heroBanners.map((banner, idx) => (
                <button
                  key={banner.id ?? idx}
                  type="button"
                  className={`hero-dot ${idx === heroSlide ? "active" : ""}`}
                  aria-label={`Show slide ${idx + 1}`}
                  onClick={() => setHeroSlide(idx)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Stats Bar */}
        {stats && (
          <section className="stats-section">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{stats.total_programs || 0}</span>
                <span className="stat-label">Programs</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.total_departments || 0}</span>
                <span className="stat-label">Departments</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.upcoming_events || 0}</span>
                <span className="stat-label">Upcoming Events</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.total_news || 0}</span>
                <span className="stat-label">News Articles</span>
              </div>
            </div>
          </section>
        )}

        {/* Announcements Ticker */}
        {announcements.length > 0 && (
          <section className="announcements-section">
            <div className="announcements-container">
              <span className="announcement-label">📢 Announcements</span>
              <div className="announcement-ticker">
                {announcements.map((ann, idx) => (
                  <span key={ann.id} className="announcement-item">
                    {ann.title}
                    {idx < announcements.length - 1 && " • "}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        {about && (
          <section className="about-section">
            <div className="about-container">
              <div className="about-content">
                <h2>{about.title || "About Us"}</h2>
                <p className="about-short">{about.short_description}</p>
                <div className="about-grid">
                  {about.mission && (
                    <div className="about-card">
                      <h3>🎯 Mission</h3>
                      <p>{about.mission}</p>
                    </div>
                  )}
                  {about.vision && (
                    <div className="about-card">
                      <h3>👁️ Vision</h3>
                      <p>{about.vision}</p>
                    </div>
                  )}
                </div>
                {about.founded_year && (
                  <p className="about-founded">Founded in {about.founded_year}</p>
                )}
                <a href="/about" className="about-btn">Learn More</a>
              </div>
              {aboutImage && (
                <div className="about-image">
                  <img src={aboutImage} alt={about.title} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Why Choose Us */}
        {why_choose.length > 0 && (
          <section className="why-choose-section">
            <h2>Why Choose Us</h2>
            <div className="why-choose-grid">
              {why_choose.map((feature) => (
                <div key={feature.id} className="why-choose-card">
                  {/* <div className="why-choose-icon">{feature.icon || "⭐"}</div> */}
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Programs */}
        {featured_programs.length > 0 && (
          <section className="programs-section">
            <h2>Featured Programs</h2>
            <div className="programs-grid">
              {featured_programs.map((program) => {
                const programImage = resolveImage(program.image_url);
                return (
                  <div key={program.id} className="program-card">
                    {programImage ? (
                      <img src={programImage} alt={program.name} />
                    ) : (
                      <div className="program-img-placeholder">📚</div>
                    )}
                    <div className="program-info">
                      <span className="program-department">{program.department_name}</span>
                      <h3>{program.name}</h3>
                      <p>{program.short_description}</p>
                      <div className="program-meta">
                        <span className="program-level">{program.level}</span>
                        <span className="program-duration">{program.duration}</span>
                      </div>
                      <a href={`/programs/${program.slug}`} className="program-link">
                        Learn More →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Departments */}
        {departments.length > 0 && (
          <section className="departments-section">
            <h2>Our Departments</h2>
            <div className="departments-grid">
              {departments.map((dept) => (
                <div key={dept.id} className="department-card">
                  <h3>{dept.name}</h3>
                  <p>{dept.description}</p>
                  <span className="dept-programs">{dept.program_count || 0} Programs</span>
                  <a href={`/departments/${dept.slug}`} className="dept-link">
                    View Programs →
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {upcoming_events.length > 0 && (
          <section className="events-section">
            <h2>Upcoming Events</h2>
            <div className="events-grid">
              {upcoming_events.map((event) => {
                const eventImage = resolveImage(event.featured_image);
                return (
                  <div key={event.id} className="event-card">
                    {eventImage && <img src={eventImage} alt={event.title} />}
                    <div className="event-info">
                      <span className="event-category">{event.category}</span>
                      <h3>{event.title}</h3>
                      <p>{event.description}</p>
                      <div className="event-meta">
                        <span className="event-date">
                          📅 {new Date(event.event_date).toLocaleDateString()}
                        </span>
                        {event.location && (
                          <span className="event-location">📍 {event.location}</span>
                        )}
                      </div>
                      <a href={`/events/${event.slug}`} className="event-link">
                        View Details →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Latest News */}
        {latest_news.length > 0 && (
          <section className="news-section">
            <h2>Latest News</h2>
            <div className="news-grid">
              {latest_news.map((news) => {
                const newsImage = resolveImage(news.featured_image);
                return (
                  <div key={news.id} className="news-card">
                    {newsImage && <img src={newsImage} alt={news.title} />}
                    <div className="news-info">
                      <span className="news-category">{news.category}</span>
                      <h3>{news.title}</h3>
                      <p>{news.excerpt}</p>
                      <div className="news-meta">
                        <span className="news-date">
                          {news.formatted_date || new Date(news.published_at).toLocaleDateString()}
                        </span>
                        {news.author && <span className="news-author">By {news.author}</span>}
                      </div>
                      <a href={`/news/${news.slug}`} className="news-link">
                        Read More →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Gallery */}
        {gallery_images.length > 0 && (
          <section className="gallery-section">
            <h2>Gallery</h2>
            <div className="gallery-grid">
              {gallery_images.map((image) => {
                const galleryImg = resolveImage(image.image_url);
                return (
                  <div key={image.id} className="gallery-item">
                    {galleryImg && <img src={galleryImg} alt={image.title} />}
                    <div className="gallery-overlay">
                      <span>{image.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <a href="/gallery" className="gallery-link">View Full Gallery →</a>
          </section>
        )}

        {/* CTA Section */}
        {cta && (
          <section
            className="cta-section"
            style={{ backgroundImage: ctaImage ? `url(${ctaImage})` : undefined }}
          >
            <div className="cta-overlay">
              <div className="cta-content">
                <h2>{cta.title}</h2>
                <p>{cta.description}</p>
                <div className="cta-buttons">
                  {cta.primary_button_text && (
                    <a href={cta.primary_button_link || "#"} className="cta-primary">
                      {cta.primary_button_text}
                    </a>
                  )}
                  {cta.secondary_button_text && (
                    <a href={cta.secondary_button_link || "#"} className="cta-secondary">
                      {cta.secondary_button_text}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer contact={contact} />

      <style>{`
        .school-home {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
        }

        .home-error {
          text-align: center;
          padding: 80px 24px;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .home-error h2 {
          color: #893C87;
          font-size: 28px;
          margin-bottom: 8px;
        }

        .home-error p {
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

        .hero-section {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          min-height: 500px;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .hero-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .hero-media.hero-image {
          background-size: cover;
          background-position: center;
        }

        .hero-media.hero-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          /* Avoids a flash of transparent/black box before the first frame paints. */
          background: #241F24;
        }

        .hero-overlay {
          background: rgba(41, 20, 40, 0.6);
          width: 100%;
          padding: 60px 24px;
          position: relative;
          z-index: 1;
        }

        .hero-content {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
          color: #FFFFFF;
        }

        .hero-content h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(36px, 5vw, 52px);
          font-weight: 700;
          margin: 0 0 12px;
          line-height: 1.1;
        }

        .hero-subtitle {
          font-size: clamp(18px, 2vw, 24px);
          color: #EBD6E9;
          margin: 0 0 16px;
          font-weight: 500;
        }

        .hero-description {
          font-size: 16px;
          line-height: 1.7;
          color: #EBD9E9;
          max-width: 600px;
          margin: 0 auto 28px;
        }

        .hero-btn {
          display: inline-block;
          padding: 14px 36px;
          background: #FFFFFF;
          color: #6F2F6D;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .hero-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }

        .hero-dots {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 16px;
          z-index: 2;
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .hero-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.45);
          cursor: pointer;
          padding: 0;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .hero-dot:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .hero-dot.active {
          background: #FFFFFF;
          transform: scale(1.2);
        }

        .stats-section {
          background: #FBF9FA;
          padding: 40px 24px;
          border-bottom: 1px solid #E1D9E0;
        }

        .stats-grid {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 24px;
          text-align: center;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-number {
          font-family: 'Fraunces', serif;
          font-size: 36px;
          font-weight: 700;
          color: #893C87;
        }

        .stat-label {
          font-size: 14px;
          color: #6B646B;
          margin-top: 4px;
        }

        .announcements-section {
          background: #893C87;
          color: #FFFFFF;
          padding: 12px 24px;
          overflow: hidden;
        }

        .announcements-container {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .announcement-label {
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
          background: rgba(255,255,255,0.15);
          padding: 4px 12px;
          border-radius: 4px;
        }

        .announcement-ticker {
          overflow: hidden;
          white-space: nowrap;
          font-size: 14px;
          display: flex;
          gap: 8px;
          animation: ticker-scroll 20s linear infinite;
        }

        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .about-section h2,
        .why-choose-section h2,
        .programs-section h2,
        .departments-section h2,
        .events-section h2,
        .news-section h2,
        .gallery-section h2 {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          text-align: center;
          margin: 0 0 32px;
          color: #241F24;
        }

        .about-section {
          padding: 60px 24px;
          background: #FFFFFF;
        }

        .about-container {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        .about-content h2 {
          text-align: left;
          margin: 0 0 16px;
        }

        .about-short {
          font-size: 16px;
          line-height: 1.7;
          color: #4A444A;
          margin: 0 0 24px;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .about-card {
          background: #FBF9FA;
          padding: 16px 20px;
          border-radius: 8px;
          border-left: 4px solid #893C87;
        }

        .about-card h3 {
          font-size: 14px;
          color: #893C87;
          margin: 0 0 6px;
        }

        .about-card p {
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
          color: #4A444A;
        }

        .about-founded {
          font-size: 14px;
          color: #6B646B;
          margin: 0 0 16px;
        }

        .about-btn {
          display: inline-block;
          padding: 10px 28px;
          background: #893C87;
          color: #FFFFFF;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: background 0.15s ease;
        }

        .about-btn:hover {
          background: #6F2F6D;
        }

        .about-image img {
          width: 100%;
          border-radius: 12px;
          object-fit: cover;
          max-height: 400px;
        }

        .why-choose-section {
          padding: 60px 24px;
          background: #FBF9FA;
        }

        .why-choose-grid {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .why-choose-card {
          background: #FFFFFF;
          padding: 28px 24px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid #E1D9E0;
          transition: border-color 0.15s ease, transform 0.12s ease;
        }

        .why-choose-card:hover {
          border-color: #893C87;
          transform: translateY(-4px);
        }

        .why-choose-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .why-choose-card h3 {
          font-size: 18px;
          margin: 0 0 8px;
        }

        .why-choose-card p {
          font-size: 14px;
          line-height: 1.6;
          color: #6B646B;
          margin: 0;
        }

        .programs-section {
          padding: 60px 24px;
          background: #FFFFFF;
        }

        .programs-grid {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .program-card {
          background: #FFFFFF;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #E1D9E0;
          transition: box-shadow 0.18s ease, transform 0.12s ease;
        }

        .program-card:hover {
          box-shadow: 0 12px 32px rgba(41, 20, 40, 0.08);
          transform: translateY(-4px);
        }

        .program-card img {
          width: 100%;
          height: 180px;
          object-fit: cover;
        }

        .program-img-placeholder {
          width: 100%;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F3EAF2;
          font-size: 36px;
        }

        .program-info {
          padding: 16px 20px 20px;
        }

        .program-department {
          font-size: 12px;
          color: #893C87;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .program-info h3 {
          font-size: 18px;
          margin: 6px 0 8px;
        }

        .program-info p {
          font-size: 14px;
          color: #6B646B;
          line-height: 1.5;
          margin: 0 0 12px;
        }

        .program-meta {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .program-level {
          background: #F3EAF2;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 12px;
          color: #893C87;
        }

        .program-duration {
          background: #F3EAF2;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 12px;
          color: #6B646B;
        }

        .program-link {
          color: #893C87;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }

        .program-link:hover {
          text-decoration: underline;
        }

        .departments-section {
          padding: 60px 24px;
          background: #FBF9FA;
        }

        .departments-grid {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .department-card {
          background: #FFFFFF;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #E1D9E0;
          text-align: center;
          transition: border-color 0.15s ease;
        }

        .department-card:hover {
          border-color: #893C87;
        }

        .department-card h3 {
          font-size: 18px;
          margin: 0 0 8px;
        }

        .department-card p {
          font-size: 14px;
          color: #6B646B;
          line-height: 1.5;
          margin: 0 0 12px;
        }

        .dept-programs {
          display: inline-block;
          background: #F3EAF2;
          padding: 2px 12px;
          border-radius: 4px;
          font-size: 13px;
          color: #893C87;
          margin-bottom: 12px;
        }

        .dept-link {
          display: block;
          color: #893C87;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }

        .dept-link:hover {
          text-decoration: underline;
        }

        .events-section {
          padding: 60px 24px;
          background: #FFFFFF;
        }

        .events-grid {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .event-card {
          background: #FFFFFF;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #E1D9E0;
        }

        .event-card img {
          width: 100%;
          height: 160px;
          object-fit: cover;
        }

        .event-info {
          padding: 16px 20px 20px;
        }

        .event-category {
          font-size: 12px;
          color: #893C87;
          font-weight: 600;
          text-transform: uppercase;
        }

        .event-info h3 {
          font-size: 18px;
          margin: 6px 0 8px;
        }

        .event-info p {
          font-size: 14px;
          color: #6B646B;
          line-height: 1.5;
          margin: 0 0 12px;
        }

        .event-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: #6B646B;
          margin-bottom: 12px;
        }

        .event-link {
          color: #893C87;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }

        .event-link:hover {
          text-decoration: underline;
        }

        .news-section {
          padding: 60px 24px;
          background: #FBF9FA;
        }

        .news-grid {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .news-card {
          background: #FFFFFF;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #E1D9E0;
        }

        .news-card img {
          width: 100%;
          height: 160px;
          object-fit: cover;
        }

        .news-info {
          padding: 16px 20px 20px;
        }

        .news-category {
          font-size: 12px;
          color: #893C87;
          font-weight: 600;
          text-transform: uppercase;
        }

        .news-info h3 {
          font-size: 18px;
          margin: 6px 0 8px;
        }

        .news-info p {
          font-size: 14px;
          color: #6B646B;
          line-height: 1.5;
          margin: 0 0 12px;
        }

        .news-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #6B646B;
          margin-bottom: 12px;
        }

        .news-link {
          color: #893C87;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }

        .news-link:hover {
          text-decoration: underline;
        }

        .gallery-section {
          padding: 60px 24px;
          background: #FFFFFF;
          text-align: center;
        }

        .gallery-grid {
          max-width: 1240px;
          margin: 0 auto 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .gallery-item {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          aspect-ratio: 1;
          background: #F3EAF2;
        }

        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .gallery-item:hover img {
          transform: scale(1.05);
        }

        .gallery-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(41, 20, 40, 0.7));
          padding: 16px;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 500;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .gallery-item:hover .gallery-overlay {
          opacity: 1;
        }

        .gallery-link {
          color: #893C87;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
        }

        .gallery-link:hover {
          text-decoration: underline;
        }

        .cta-section {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .cta-overlay {
          background: rgba(41, 20, 40, 0.7);
          padding: 60px 24px;
        }

        .cta-content {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
          color: #FFFFFF;
        }

        .cta-content h2 {
          font-family: 'Fraunces', serif;
          font-size: 32px;
          margin: 0 0 16px;
        }

        .cta-content p {
          font-size: 16px;
          line-height: 1.7;
          color: #EBD9E9;
          margin: 0 0 28px;
        }

        .cta-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .cta-primary {
          display: inline-block;
          padding: 14px 36px;
          background: #FFFFFF;
          color: #6F2F6D;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: transform 0.15s ease;
        }

        .cta-primary:hover {
          transform: translateY(-2px);
        }

        .cta-secondary {
          display: inline-block;
          padding: 14px 36px;
          background: transparent;
          color: #FFFFFF;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          border: 2px solid rgba(255,255,255,0.5);
          transition: border-color 0.15s ease;
        }

        .cta-secondary:hover {
          border-color: #FFFFFF;
        }

        @media (max-width: 860px) {
          .about-container {
            grid-template-columns: 1fr;
          }

          .about-grid {
            grid-template-columns: 1fr;
          }

          .hero-content h1 {
            font-size: 28px;
          }

          .announcement-ticker {
            animation: none;
            flex-wrap: wrap;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .announcement-ticker {
            animation: none;
          }

          .gallery-item img {
            transition: none;
          }

          .gallery-overlay {
            opacity: 1;
          }

          .hero-video {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

export default Home;