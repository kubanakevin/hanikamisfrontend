// src/pages/Staff.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

/* ============================================================
   Two staff entry points.
   • Web admin login     → /staff/login    (existing staff auth)
   • MIS login           → /staff/mis-login (separate MIS credentials)
   Edit titles/descriptions here if you want different copy.
   ============================================================ */
const STAFF_OPTIONS = [
  {
    id: "web",
    title: "Staff Website Login",
    subtitle: "Content & administration",
    description:
      "Sign in to manage the public website — programs, news, events, gallery, announcements, and more.",
    icon: "🧑‍💼",
    to: "/login",
    accent: "purple",
    features: [
      "Manage website content",
      "Programs, news & events",
      "View messages from visitors",
    ],
  },
  {
    id: "mis",
    title: "MIS Login",
    subtitle: "Management Information System",
    description:
      "Access academic records, student grades, transcripts, timetables, and institutional reports.",
    icon: "📊",
    to: "/staff/mis-login",
    accent: "blue",
    features: [
      "Student academic records",
      "Grades & transcripts",
      "Reports & analytics",
    ],
  },
];

function Staff() {
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowPreloader(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (showPreloader) return <Preloader />;

  return (
    <>
      <NavBar />
      <main className="staff-page">
        <section className="staff-hero">
          <div className="staff-hero-inner">
            <span className="staff-eyebrow">Staff access</span>
            <h1 className="staff-hero-title">Which system do you need?</h1>
            <p className="staff-hero-sub">
              Choose the portal that matches what you're signing in for. Each
              system uses its own credentials.
            </p>
          </div>
        </section>

        <section className="staff-section">
          <div className="staff-section-inner">
            <div className="staff-grid">
              {STAFF_OPTIONS.map((opt) => (
                <Link
                  key={opt.id}
                  to={opt.to}
                  className="staff-card"
                  aria-label={`Open ${opt.title}`}
                >
                  <div className={`staff-card-icon staff-card-icon--${opt.accent}`}>
                    <span aria-hidden="true">{opt.icon}</span>
                  </div>

                  <div className="staff-card-body">
                    <span className="staff-card-subtitle">{opt.subtitle}</span>
                    <h2 className="staff-card-title">{opt.title}</h2>
                    <p className="staff-card-desc">{opt.description}</p>

                    {opt.features?.length > 0 && (
                      <ul className="staff-card-features">
                        {opt.features.map((f) => (
                          <li key={f}>
                            <span className="staff-card-check">✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <span className="staff-card-cta">
                    Continue
                    <span className="staff-card-arrow">→</span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="staff-help">
              <span className="staff-help-icon">❓</span>
              <p>
                Not sure which one? Contact IT support on{" "}
                <Link to="/contact">the contact page</Link> — we'll help you
                figure out which credentials you need.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .staff-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
        }

        /* ===== Hero ===== */
        .staff-hero {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          padding: 84px 24px 64px;
          text-align: center;
        }
        .staff-hero-inner { max-width: 720px; margin: 0 auto; }
        .staff-eyebrow {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: #EBD9E9;
          margin-bottom: 12px;
        }
        .staff-hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(30px, 4.4vw, 48px);
          font-weight: 600;
          margin: 0 0 14px;
          line-height: 1.15;
          letter-spacing: -0.5px;
        }
        .staff-hero-sub {
          font-size: 17px;
          line-height: 1.65;
          color: #EBD9E9;
          margin: 0;
        }

        /* ===== Section ===== */
        .staff-section { padding: 56px 24px 80px; }
        .staff-section-inner { max-width: 1000px; margin: 0 auto; }

        /* ===== Two-column grid ===== */
        .staff-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        /* ===== Card ===== */
        .staff-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 18px;
          padding: 32px 30px 26px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          overflow: hidden;
        }
        .staff-card::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 4px;
          background: linear-gradient(90deg, #893C87, #B96AAE);
          opacity: 0;
          transition: opacity 0.18s ease;
        }
        .staff-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 48px rgba(41, 20, 40, 0.12);
          border-color: #E7D3E6;
        }
        .staff-card:hover::before { opacity: 1; }
        .staff-card:focus-visible {
          outline: 3px solid rgba(137, 60, 135, 0.4);
          outline-offset: 2px;
        }

        /* Icon */
        .staff-card-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          flex-shrink: 0;
          color: #FFFFFF;
          box-shadow: 0 10px 24px rgba(137, 60, 135, 0.22);
        }
        .staff-card-icon--purple { background: linear-gradient(135deg, #893C87, #6F2F6D); }
        .staff-card-icon--blue   { background: linear-gradient(135deg, #4A90D9, #2E6FAF); }

        /* Body */
        .staff-card-body { flex: 1; }
        .staff-card-subtitle {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .staff-card-title {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 10px;
          line-height: 1.25;
        }
        .staff-card-desc {
          font-size: 14.5px;
          line-height: 1.6;
          color: #6B646B;
          margin: 0 0 16px;
        }

        .staff-card-features {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .staff-card-features li {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-size: 13.5px;
          color: #4A444A;
          line-height: 1.5;
        }
        .staff-card-check {
          color: #2E7D32;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* CTA */
        .staff-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 700;
          color: #893C87;
          padding-top: 18px;
          border-top: 1px solid #F0E6EF;
        }
        .staff-card-arrow { transition: transform 0.18s ease; }
        .staff-card:hover .staff-card-arrow { transform: translateX(4px); }

        /* Help note */
        .staff-help {
          margin-top: 44px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 20px 24px;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          max-width: 640px;
          margin-left: auto;
          margin-right: auto;
        }
        .staff-help-icon { font-size: 20px; flex-shrink: 0; }
        .staff-help p {
          margin: 0;
          font-size: 14.5px;
          line-height: 1.6;
          color: #4A444A;
        }
        .staff-help a {
          color: #893C87;
          font-weight: 600;
          text-decoration: none;
        }
        .staff-help a:hover { text-decoration: underline; }

        /* ===== Responsive ===== */
        @media (max-width: 720px) {
          .staff-hero { padding: 64px 20px 44px; }
          .staff-hero-title { font-size: 28px; }
          .staff-hero-sub { font-size: 15px; }

          .staff-section { padding: 36px 16px 60px; }
          .staff-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .staff-card { padding: 26px 22px 22px; }
          .staff-card-icon { width: 56px; height: 56px; font-size: 26px; border-radius: 14px; }
          .staff-card-title { font-size: 20px; }

          .staff-help { flex-direction: column; padding: 18px 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .staff-card,
          .staff-card-arrow { transition: none !important; }
        }
      `}</style>
    </>
  );
}

export default Staff;