// src/pages/About.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const resolveImage = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

// Normalize a YouTube/Vimeo/etc URL into an embeddable URL
const toEmbedUrl = (url) => {
  if (!url) return null;
  try {
    if (/youtube\.com\/watch\?v=/i.test(url)) {
      const v = new URL(url).searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : url;
    }
    if (/youtu\.be\//i.test(url)) {
      const id = url.split("youtu.be/")[1].split(/[?&]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (/vimeo\.com\/\d+/i.test(url)) {
      const id = url.match(/vimeo\.com\/(\d+)/)[1];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return url;
  }
};

// Split multi-line text into paragraphs; bullets become styled list lines
const renderMultiline = (text) => {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (trimmed === "") return <br key={i} />;
    if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
      return (
        <div key={i} className="about-list-line">
          <span className="about-list-bullet">•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    }
    return <p key={i}>{trimmed}</p>;
  });
};

// Split core_values: comma, newline, bullet — all become one array
const splitValues = (raw) => {
  if (!raw) return [];
  return raw
    .split(/\r?\n|•|,|;/g)
    .map((v) => v.trim())
    .filter(Boolean);
};

function AboutPublic() {
  const [status, setStatus] = useState("loading");
  const [showPreloader, setShowPreloader] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/client/about`, {
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
      } catch (err) {
        console.error("About load error:", err);
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
      body: JSON.stringify({ page_url: "/about" }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "error" || !data) {
    return (
      <>
        <NavBar />
        <div className="about-error">
          <h2>Couldn't load this page</h2>
          <p>Please refresh the page to try again.</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const { about, whyChoose, contact, stats } = data;
  const values = splitValues(about?.core_values);
  const embedVideo = toEmbedUrl(about?.video_url);

  // If the admin hasn't filled in About yet, show a graceful placeholder
  const hasContent = !!(
    about?.title ||
    about?.short_description ||
    about?.full_content
  );

  return (
    <>
      <NavBar />
      <main className="about-page">
        {/* Hero */}
        <section className="about-hero">
          <div className="about-hero-inner">
            <span className="about-eyebrow">Who we are</span>
            <h1 className="about-hero-title">
              {about?.title || "About HANIKA"}
            </h1>
            {about?.short_description && (
              <p className="about-hero-sub">{about.short_description}</p>
            )}
          </div>
        </section>

        {/* Featured image (if set) */}
        {about?.image_url && (
          <figure className="about-hero-image">
            <img
              src={resolveImage(about.image_url)}
              alt={about.title || "About"}
            />
          </figure>
        )}

        {/* Stats strip */}
        {(stats?.programs ||
          stats?.departments ||
          stats?.years ||
          stats?.events) > 0 && (
          <section className="about-stats">
            <div className="about-stats-inner">
              {stats.years > 0 && (
                <div className="about-stat">
                  <span className="about-stat-number">{stats.years}+</span>
                  <span className="about-stat-label">Years of experience</span>
                </div>
              )}
              {stats.programs > 0 && (
                <div className="about-stat">
                  <span className="about-stat-number">{stats.programs}</span>
                  <span className="about-stat-label">Active programs</span>
                </div>
              )}
              {stats.departments > 0 && (
                <div className="about-stat">
                  <span className="about-stat-number">{stats.departments}</span>
                  <span className="about-stat-label">Departments</span>
                </div>
              )}
              {stats.events > 0 && (
                <div className="about-stat">
                  <span className="about-stat-number">{stats.events}</span>
                  <span className="about-stat-label">Events hosted</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Main content */}
        <section className="about-main">
          <div className="about-main-inner">
            {hasContent && about?.full_content && (
              <article className="about-article">
                <h2 className="about-section-title">Our story</h2>
                <div className="about-section-body">
                  {renderMultiline(about.full_content)}
                </div>
              </article>
            )}

            {!hasContent && (
              <div className="about-empty">
                <p>
                  Content for this page is being prepared. Please check back
                  soon, or contact us for more information.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Mission & Vision — two-column */}
        {(about?.mission || about?.vision) && (
          <section className="about-mv">
            <div className="about-mv-inner">
              {about?.mission && (
                <div className="about-mv-card">
                  <span className="about-mv-icon">🎯</span>
                  <h3 className="about-mv-title">Our mission</h3>
                  <p className="about-mv-body">{about.mission}</p>
                </div>
              )}
              {about?.vision && (
                <div className="about-mv-card">
                  <span className="about-mv-icon">🔭</span>
                  <h3 className="about-mv-title">Our vision</h3>
                  <p className="about-mv-body">{about.vision}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Core values */}
        {values.length > 0 && (
          <section className="about-values">
            <div className="about-values-inner">
              <h2 className="about-section-title about-section-title--center">
                Core values
              </h2>
              <p className="about-values-sub">
                The principles that guide everything we do.
              </p>
              <div className="about-values-grid">
                {values.map((v, i) => (
                  <div className="about-value-chip" key={i}>
                    <span className="about-value-dot" />
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why choose us */}
        {whyChoose && whyChoose.length > 0 && (
          <section className="about-why">
            <div className="about-why-inner">
              <h2 className="about-section-title about-section-title--center">
                Why choose us
              </h2>
              <p className="about-values-sub">
                What makes HANIKA a strong choice for your future.
              </p>
              <div className="about-why-grid">
                {whyChoose.map((f) => (
                  <div className="about-why-card" key={f.id}>
                    <div className="about-why-icon">
                      {f.icon ? (
                        <i className={f.icon} aria-hidden="true" />
                      ) : (
                        <span>✦</span>
                      )}
                    </div>
                    <h3 className="about-why-title">{f.title}</h3>
                    <p className="about-why-body">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Video */}
        {embedVideo && (
          <section className="about-video">
            <div className="about-video-inner">
              <h2 className="about-section-title about-section-title--center">
                See it for yourself
              </h2>
              <div className="about-video-frame">
                <iframe
                  src={embedVideo}
                  title="About HANIKA video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        )}

        {/* Contact strip */}
        {contact &&
          (contact.address ||
            contact.phone_primary ||
            contact.email_primary) && (
            <section className="about-contact">
              <div className="about-contact-inner">
                <div className="about-contact-text">
                  <h2 className="about-section-title">Visit or reach out</h2>
                  <p className="about-contact-sub">
                    We're happy to answer questions, give you a tour, or help
                    with admissions.
                  </p>
                </div>
                <div className="about-contact-grid">
                  {contact.address && (
                    <div className="about-contact-item">
                      <span className="about-contact-icon">📍</span>
                      <div>
                        <span className="about-contact-label">Address</span>
                        <span className="about-contact-value">
                          {contact.address}
                        </span>
                      </div>
                    </div>
                  )}
                  {contact.phone_primary && (
                    <div className="about-contact-item">
                      <span className="about-contact-icon">📞</span>
                      <div>
                        <span className="about-contact-label">Phone</span>
                        <a
                          className="about-contact-value"
                          href={`tel:${contact.phone_primary}`}
                        >
                          {contact.phone_primary}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.email_primary && (
                    <div className="about-contact-item">
                      <span className="about-contact-icon">✉️</span>
                      <div>
                        <span className="about-contact-label">Email</span>
                        <a
                          className="about-contact-value"
                          href={`mailto:${contact.email_primary}`}
                        >
                          {contact.email_primary}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.office_hours && (
                    <div className="about-contact-item">
                      <span className="about-contact-icon">🕐</span>
                      <div>
                        <span className="about-contact-label">Office hours</span>
                        <span className="about-contact-value">
                          {contact.office_hours}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

        {/* CTA */}
        <section className="about-cta">
          <div className="about-cta-inner">
            <h2 className="about-cta-title">
              Ready to take the next step?
            </h2>
            <p className="about-cta-sub">
              Applications are open. Explore our programs or get in touch with
              our admissions team.
            </p>
            <div className="about-cta-actions">
              <Link to="/programs" className="about-btn-primary">
                Browse Programs
              </Link>
              <Link to="/admissions#apply" className="about-btn-secondary">
                Apply Now
              </Link>
              <Link to="/contact" className="about-btn-ghost">
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .about-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
        }

        /* ===== Hero ===== */
        .about-hero {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          padding: 84px 24px 64px;
          text-align: center;
        }
        .about-hero-inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .about-eyebrow {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: #EBD9E9;
          margin-bottom: 12px;
        }
        .about-hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(32px, 4.6vw, 52px);
          font-weight: 600;
          margin: 0 0 14px;
          line-height: 1.15;
          letter-spacing: -0.5px;
        }
        .about-hero-sub {
          font-size: 17px;
          line-height: 1.65;
          color: #EBD9E9;
          margin: 0;
        }

        /* ===== Hero image ===== */
        .about-hero-image {
          max-width: 1080px;
          margin: 40px auto 0;
          padding: 0 24px;
        }
        .about-hero-image img {
          display: block;
          width: 100%;
          max-height: 520px;
          object-fit: cover;
          border-radius: 16px;
          box-shadow: 0 24px 56px rgba(41, 20, 40, 0.16);
        }

        /* ===== Stats ===== */
        .about-stats {
          max-width: 1080px;
          margin: 48px auto 0;
          padding: 0 24px;
        }
        .about-stats-inner {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 28px 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          text-align: center;
        }
        .about-stat { display: flex; flex-direction: column; gap: 4px; }
        .about-stat-number {
          font-family: 'Fraunces', serif;
          font-size: 34px;
          font-weight: 700;
          color: #893C87;
          line-height: 1;
        }
        .about-stat-label {
          font-size: 13px;
          color: #6B646B;
          font-weight: 500;
        }

        /* ===== Main article ===== */
        .about-main {
          max-width: 900px;
          margin: 56px auto 0;
          padding: 0 24px;
        }
        .about-article {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 40px 44px;
        }
        .about-section-title {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid #F0E6EF;
        }
        .about-section-title--center {
          text-align: center;
          border: none;
          padding-bottom: 0;
        }
        .about-section-body {
          font-size: 16px;
          line-height: 1.8;
          color: #292329;
        }
        .about-section-body p { margin: 0 0 14px; }
        .about-section-body p:last-child { margin-bottom: 0; }

        .about-list-line {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
          align-items: flex-start;
        }
        .about-list-bullet {
          color: #B96AAE;
          font-weight: 700;
          line-height: 1.8;
          flex-shrink: 0;
        }

        .about-empty {
          text-align: center;
          padding: 40px 20px;
          background: #FFFFFF;
          border: 1px dashed #E1D9E0;
          border-radius: 14px;
        }
        .about-empty p {
          font-size: 15px;
          color: #6B646B;
          margin: 0;
          font-style: italic;
        }

        /* ===== Mission & Vision ===== */
        .about-mv {
          max-width: 1080px;
          margin: 64px auto 0;
          padding: 0 24px;
        }
        .about-mv-inner {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .about-mv-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 32px 32px 28px;
          position: relative;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .about-mv-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(41, 20, 40, 0.08);
        }
        .about-mv-icon {
          font-size: 34px;
          display: inline-block;
          margin-bottom: 14px;
        }
        .about-mv-title {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 12px;
        }
        .about-mv-body {
          font-size: 15.5px;
          line-height: 1.7;
          color: #4A444A;
          margin: 0;
        }

        /* ===== Core values ===== */
        .about-values {
          max-width: 1080px;
          margin: 72px auto 0;
          padding: 0 24px;
        }
        .about-values-inner {
          text-align: center;
        }
        .about-values-sub {
          font-size: 15px;
          color: #6B646B;
          margin: 0 0 28px;
          line-height: 1.6;
        }
        .about-values-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
        }
        .about-value-chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 22px;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 999px;
          font-size: 14.5px;
          font-weight: 600;
          color: #4A444A;
          transition: all 0.15s ease;
        }
        .about-value-chip:hover {
          border-color: #B96AAE;
          color: #893C87;
          background: #F8F2F8;
        }
        .about-value-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #B96AAE, #893C87);
          flex-shrink: 0;
        }

        /* ===== Why choose us ===== */
        .about-why {
          max-width: 1080px;
          margin: 72px auto 0;
          padding: 0 24px;
        }
        .about-why-inner {
          text-align: center;
        }
        .about-why-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-top: 32px;
          text-align: left;
        }
        .about-why-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 26px 26px 24px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .about-why-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(41, 20, 40, 0.08);
          border-color: #E7D3E6;
        }
        .about-why-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #F3EAF2;
          color: #893C87;
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .about-why-title {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 8px;
        }
        .about-why-body {
          font-size: 14.5px;
          line-height: 1.6;
          color: #6B646B;
          margin: 0;
        }

        /* ===== Video ===== */
        .about-video {
          max-width: 960px;
          margin: 72px auto 0;
          padding: 0 24px;
        }
        .about-video-inner {
          text-align: center;
        }
        .about-video-frame {
          margin-top: 28px;
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 */
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 24px 56px rgba(41, 20, 40, 0.16);
          background: #000;
        }
        .about-video-frame iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }

        /* ===== Contact strip ===== */
        .about-contact {
          max-width: 1080px;
          margin: 72px auto 0;
          padding: 0 24px;
        }
        .about-contact-inner {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 40px 44px;
        }
        .about-contact-text {
          margin-bottom: 24px;
        }
        .about-contact-sub {
          font-size: 15px;
          color: #6B646B;
          margin: 0;
          line-height: 1.6;
        }
        .about-contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }
        .about-contact-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .about-contact-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #F3EAF2;
          color: #893C87;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .about-contact-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #8A7E88;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 4px;
        }
        .about-contact-value {
          display: block;
          font-size: 14.5px;
          color: #241F24;
          font-weight: 500;
          line-height: 1.45;
          text-decoration: none;
        }
        a.about-contact-value:hover {
          color: #893C87;
          text-decoration: underline;
        }

        /* ===== CTA ===== */
        .about-cta {
          max-width: 1080px;
          margin: 72px auto 0;
          padding: 0 24px 80px;
        }
        .about-cta-inner {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          border-radius: 18px;
          padding: 56px 40px;
          text-align: center;
          color: #FFFFFF;
          box-shadow: 0 20px 48px rgba(137, 60, 135, 0.24);
        }
        .about-cta-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 600;
          margin: 0 0 12px;
        }
        .about-cta-sub {
          font-size: 16px;
          line-height: 1.6;
          color: #EBD9E9;
          max-width: 540px;
          margin: 0 auto 28px;
        }
        .about-cta-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
        }

        .about-btn-primary,
        .about-btn-secondary,
        .about-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 26px;
          border-radius: 9px;
          font-size: 14.5px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s ease;
          cursor: pointer;
          border: none;
        }
        .about-btn-primary {
          background: #FFFFFF;
          color: #893C87;
        }
        .about-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.25);
        }
        .about-btn-secondary {
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          border: 1.5px solid rgba(255, 255, 255, 0.5);
        }
        .about-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        .about-btn-ghost {
          background: transparent;
          color: #EBD9E9;
          text-decoration: underline;
          padding: 13px 12px;
        }
        .about-btn-ghost:hover {
          color: #FFFFFF;
        }

        /* ===== Error ===== */
        .about-error {
          text-align: center;
          padding: 80px 24px;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .about-error h2 {
          color: #893C87;
          font-size: 28px;
          margin-bottom: 8px;
        }
        .about-error p { color: #6B646B; margin-bottom: 20px; }
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

        /* ===== Responsive ===== */
        @media (max-width: 720px) {
          .about-hero { padding: 64px 20px 44px; }
          .about-hero-title { font-size: 30px; }
          .about-hero-sub { font-size: 15.5px; }
          .about-hero-image { margin-top: 28px; padding: 0 16px; }
          .about-hero-image img { border-radius: 12px; }

          .about-stats { margin-top: 32px; padding: 0 16px; }
          .about-stats-inner { padding: 22px 16px; }
          .about-stat-number { font-size: 26px; }

          .about-main { margin-top: 40px; padding: 0 16px; }
          .about-article { padding: 28px 22px; }
          .about-section-title { font-size: 22px; }

          .about-mv, .about-values, .about-why, .about-video, .about-contact {
            margin-top: 48px;
            padding: 0 16px;
          }
          .about-mv-card { padding: 24px 22px; }
          .about-contact-inner { padding: 28px 22px; }
          .about-cta { margin-top: 56px; padding: 0 16px 60px; }
          .about-cta-inner { padding: 40px 22px; }
          .about-cta-actions { flex-direction: column; }
          .about-cta-actions > * { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .about-mv-card,
          .about-why-card,
          .about-value-chip,
          .about-btn-primary,
          .about-btn-secondary { transition: none !important; }
        }
      `}</style>
    </>
  );
}

export default AboutPublic;