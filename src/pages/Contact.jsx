// src/pages/Contact.jsx
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

function Contact() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [showPreloader, setShowPreloader] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadContact() {
      try {
        const res = await fetch(`${API_BASE}/api/client/contact`, {
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
        setTimeout(() => setShowPreloader(false), 800);
      }
    }

    loadContact();

    // Track page visit
    fetch(`${API_BASE}/api/client/visits/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page_url: "/contact" }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.full_name.trim() || !form.email.trim() || !form.message.trim()) {
      setFormError("Please fill in your name, email, and message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/client/contact/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.success) {
        setFormSuccess(json.message || "Thanks! Your message has been sent.");
        setForm(emptyForm);
      } else {
        setFormError(json.error || "Failed to send message.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "error" || !data) {
    return (
      <>
        <NavBar />
        <div className="contact-error">
          <h2>Couldn't load contact information</h2>
          <p>Please refresh the page to try again.</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const info = data || {};

  const mapSrc =
    info.map_embed_url ||
    (info.latitude && info.longitude
      ? `https://www.google.com/maps?q=${info.latitude},${info.longitude}&output=embed`
      : null);

  const socials = [
    { key: "facebook_url", label: "Facebook", icon: "📘", href: info.facebook_url },
    { key: "twitter_url", label: "Twitter / X", icon: "🐦", href: info.twitter_url },
    { key: "instagram_url", label: "Instagram", icon: "📸", href: info.instagram_url },
    { key: "linkedin_url", label: "LinkedIn", icon: "💼", href: info.linkedin_url },
    { key: "youtube_url", label: "YouTube", icon: "▶️", href: info.youtube_url },
  ].filter((s) => s.href);

  const whatsappHref = info.whatsapp_number
    ? `https://wa.me/${String(info.whatsapp_number).replace(/[^\d]/g, "")}`
    : null;

  return (
    <>
      <NavBar />
      <main className="contact-page">
        {/* Header */}
        <section className="contact-header">
          <h1>Contact Us</h1>
          <p>
            We'd love to hear from you. Reach out through any of the channels
            below or send us a message.
          </p>
        </section>

        <section className="contact-body">
          {/* Info cards */}
          <div className="contact-info-grid">
            {info.address && (
              <div className="info-card">
                <div className="info-icon">📍</div>
                <h3>Address</h3>
                <p>{info.address}</p>
              </div>
            )}

            {(info.phone_primary || info.phone_secondary) && (
              <div className="info-card">
                <div className="info-icon">📞</div>
                <h3>Phone</h3>
                {info.phone_primary && (
                  <p>
                    <a href={`tel:${info.phone_primary}`}>{info.phone_primary}</a>
                  </p>
                )}
                {info.phone_secondary && (
                  <p>
                    <a href={`tel:${info.phone_secondary}`}>{info.phone_secondary}</a>
                  </p>
                )}
              </div>
            )}

            {(info.email_primary || info.email_secondary) && (
              <div className="info-card">
                <div className="info-icon">✉️</div>
                <h3>Email</h3>
                {info.email_primary && (
                  <p>
                    <a href={`mailto:${info.email_primary}`}>{info.email_primary}</a>
                  </p>
                )}
                {info.email_secondary && (
                  <p>
                    <a href={`mailto:${info.email_secondary}`}>{info.email_secondary}</a>
                  </p>
                )}
              </div>
            )}

            {info.office_hours && (
              <div className="info-card">
                <div className="info-icon">🕒</div>
                <h3>Office Hours</h3>
                <p style={{ whiteSpace: "pre-line" }}>{info.office_hours}</p>
              </div>
            )}
          </div>

          {/* Form + map */}
          <div className="contact-main">
            {/* Form */}
            <div className="contact-form-card">
              <h2>Send us a message</h2>
              <p className="form-lead">
                Fill out the form below and we'll get back to you as soon as
                possible.
              </p>

              <form onSubmit={handleSubmit} className="contact-form">
                {formError && <div className="form-error">{formError}</div>}
                {formSuccess && <div className="form-success">{formSuccess}</div>}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cf-name">Your Name *</label>
                    <input
                      id="cf-name"
                      name="full_name"
                      type="text"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cf-email">Email *</label>
                    <input
                      id="cf-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cf-phone">Phone</label>
                    <input
                      id="cf-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+250 ..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cf-subject">Subject</label>
                    <input
                      id="cf-subject"
                      name="subject"
                      type="text"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="What is this about?"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="cf-message">Message *</label>
                  <textarea
                    id="cf-message"
                    name="message"
                    rows="6"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="contact-submit"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Side panel */}
            <div className="contact-side">
              {mapSrc ? (
                <div className="contact-map">
                  <iframe
                    title="School location"
                    src={mapSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="contact-map contact-map-empty">
                  <span>Map not available</span>
                </div>
              )}

              {socials.length > 0 && (
                <div className="contact-socials">
                  <h3>Follow Us</h3>
                  <div className="social-grid">
                    {socials.map((s) => (
                      <a
                        key={s.key}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                      >
                        <span className="social-icon">{s.icon}</span>
                        <span>{s.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn"
                >
                  <span>💬</span> Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer contact={info} />

      <style>{`
        .contact-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
        }

        .contact-header {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          padding: 80px 24px 60px;
          text-align: center;
        }
        .contact-header h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(32px, 4vw, 48px);
          margin: 0 0 12px;
        }
        .contact-header p {
          font-size: 16px;
          color: #EBD9E9;
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .contact-body {
          max-width: 1240px;
          margin: 0 auto;
          padding: 60px 24px 80px;
        }

        .contact-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 48px;
        }
        .info-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 12px;
          padding: 24px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .info-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(41, 20, 40, 0.08);
        }
        .info-icon {
          font-size: 28px;
          margin-bottom: 10px;
        }
        .info-card h3 {
          font-size: 15px;
          color: #893C87;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-card p {
          font-size: 14px;
          line-height: 1.6;
          color: #4A444A;
          margin: 4px 0;
        }
        .info-card a {
          color: #241F24;
          text-decoration: none;
          font-weight: 500;
        }
        .info-card a:hover {
          color: #893C87;
          text-decoration: underline;
        }

        .contact-main {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 32px;
          align-items: start;
        }

        .contact-form-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 32px;
        }
        .contact-form-card h2 {
          font-family: 'Fraunces', serif;
          font-size: 24px;
          margin: 0 0 6px;
          color: #241F24;
        }
        .form-lead {
          font-size: 14px;
          color: #6B646B;
          margin: 0 0 24px;
          line-height: 1.6;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .form-group input,
        .form-group textarea {
          padding: 12px 14px;
          border: 1px solid #E1D9E0;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          background: #FFFFFF;
          color: #241F24;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          resize: vertical;
        }
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.1);
        }

        .contact-submit {
          align-self: flex-start;
          margin-top: 4px;
          padding: 14px 36px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .contact-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(137, 60, 135, 0.3);
        }
        .contact-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .form-error {
          padding: 12px 16px;
          background: #FDE8E8;
          color: #C62828;
          border-radius: 8px;
          font-size: 14px;
        }
        .form-success {
          padding: 12px 16px;
          background: #E8F5E9;
          color: #2E7D32;
          border-radius: 8px;
          font-size: 14px;
        }

        .contact-side {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .contact-map {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #E1D9E0;
          background: #F3EAF2;
        }
        .contact-map iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
        .contact-map-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8A7E88;
          font-size: 14px;
        }

        .contact-socials {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 24px;
        }
        .contact-socials h3 {
          font-size: 15px;
          color: #241F24;
          margin: 0 0 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .social-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
        }
        .social-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1px solid #E1D9E0;
          border-radius: 8px;
          color: #4A444A;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .social-link:hover {
          border-color: #893C87;
          color: #893C87;
          background: #F8F2F8;
        }
        .social-icon {
          font-size: 16px;
        }

        .whatsapp-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 24px;
          background: #25D366;
          color: #FFFFFF;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .whatsapp-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(37, 211, 102, 0.3);
        }

        .contact-error {
          text-align: center;
          padding: 80px 24px;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .contact-error h2 {
          color: #893C87;
          font-size: 28px;
          margin-bottom: 8px;
        }
        .contact-error p {
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

        @media (max-width: 900px) {
          .contact-main {
            grid-template-columns: 1fr;
          }
          .contact-map {
            aspect-ratio: 16 / 9;
          }
        }
        @media (max-width: 600px) {
          .contact-body {
            padding: 40px 16px 60px;
          }
          .contact-form-card {
            padding: 24px 20px;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
          .contact-submit {
            width: 100%;
            text-align: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .info-card,
          .contact-submit,
          .social-link,
          .whatsapp-btn {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}

export default Contact;