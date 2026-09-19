// src/pages/Admissions.jsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

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

const formatAmount = (amount, currency) => {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount} ${currency || ""}`.trim();
  return `${n.toLocaleString()} ${currency || ""}`.trim();
};

const LEVEL_LABELS = {
  certificate: "Certificate",
  diploma: "Diploma",
  degree: "Degree",
};

const levelLabel = (level) =>
  LEVEL_LABELS[level?.toLowerCase()] || level || "Program";

/* ============================================================
   Where the "Register / Apply" buttons point.
   Change this one constant and every Apply button on the page
   updates at once.
   ============================================================ */
const APPLY_ROUTE = "/apply"; // ← your registration/application page

const FALLBACK_STEPS = [
  {
    id: "s1",
    title: "Choose a program",
    description:
      "Browse our programs and pick the one that matches your goals and qualifications.",
  },
  {
    id: "s2",
    title: "Prepare your documents",
    description:
      "Have your academic certificates, national ID or passport, and a recent photo ready.",
  },
  {
    id: "s3",
    title: "Submit your application",
    description:
      "Complete the online application form, or visit the admissions office to apply in person.",
  },
  {
    id: "s4",
    title: "Pay the application fee",
    description:
      "Follow the payment instructions you receive after submitting your application.",
  },
  {
    id: "s5",
    title: "Wait for review",
    description:
      "Our admissions committee reviews your application. You'll be contacted with the result.",
  },
  {
    id: "s6",
    title: "Register and start classes",
    description:
      "If accepted, complete your registration and attend orientation before classes begin.",
  },
];

const FALLBACK_REQUIREMENTS = [
  {
    id: "r1",
    title: "Certificate programs",
    description:
      "Ordinary Level (O-Level) certificate or equivalent, plus a valid national ID.",
    level: "certificate",
  },
  {
    id: "r2",
    title: "Diploma programs",
    description:
      "Advanced Level (A-Level) certificate or a relevant Certificate, plus a valid national ID.",
    level: "diploma",
  },
  {
    id: "r3",
    title: "Degree programs",
    description:
      "Relevant Diploma or A-Level certificate with strong grades, plus a valid national ID.",
    level: "degree",
  },
];

const FALLBACK_FEES = [
  {
    id: "f1",
    label: "Application fee",
    amount: null,
    currency: "RWF",
    period: "one-time",
    note: "Non-refundable",
  },
  {
    id: "f2",
    label: "Tuition — Certificate",
    amount: null,
    currency: "RWF",
    period: "per year",
  },
  {
    id: "f3",
    label: "Tuition — Diploma",
    amount: null,
    currency: "RWF",
    period: "per year",
  },
  {
    id: "f4",
    label: "Tuition — Degree",
    amount: null,
    currency: "RWF",
    period: "per year",
  },
];

const FALLBACK_FAQ = [
  {
    q: "When can I apply?",
    a: "Applications are open during the intake window published on this page. Late applications may be considered on a case-by-case basis.",
  },
  {
    q: "Do I need to take an entrance exam?",
    a: "Most programs do not require an entrance exam. Some specialized programs may require an interview or placement test.",
  },
  {
    q: "Can I transfer from another institution?",
    a: "Yes. Transfer students should provide transcripts and course descriptions from their previous institution for credit evaluation.",
  },
  {
    q: "Are there scholarships available?",
    a: "Yes — we offer merit-based and need-based scholarships. Contact the admissions office for details on how to apply.",
  },
  {
    q: "What happens after I submit my application?",
    a: "You'll receive a confirmation email. Our admissions committee reviews your file and contacts you with next steps within a few weeks.",
  },
];

const FALLBACK_DOCUMENTS = [
  "Academic certificates and transcripts",
  "National ID or passport",
  "Recent passport-size photo",
  "Completed application form",
  "Application fee payment receipt",
  "Recommendation letter (optional)",
];

function Admissions() {
  const [status, setStatus] = useState("loading");
  const [showPreloader, setShowPreloader] = useState(true);
  const [data, setData] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeLevel, setActiveLevel] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/client/admissions`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;
        setData(json.success ? json.data : {});
        setStatus("ready");
      } catch (err) {
        console.error("Admissions load error:", err);
        if (!cancelled) {
          setData({});
          setStatus("ready");
        }
      } finally {
        setTimeout(() => setShowPreloader(false), 800);
      }
    }

    load();

    fetch(`${API_BASE}/api/client/visits/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page_url: "/admissions" }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const steps = data?.steps?.length ? data.steps : FALLBACK_STEPS;
  const requirements = data?.requirements?.length
    ? data.requirements
    : FALLBACK_REQUIREMENTS;
  const fees = data?.fees?.length ? data.fees : FALLBACK_FEES;
  const dates = data?.dates || [];
  const programs = data?.programs || [];
  const contact = data?.contact || null;

  const filteredPrograms = useMemo(() => {
    if (!activeLevel) return programs;
    return programs.filter(
      (p) => (p.level || "").toLowerCase() === activeLevel.toLowerCase()
    );
  }, [programs, activeLevel]);

  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  return (
    <>
      <NavBar />
      <main className="adm-page">
        {/* Hero */}
        <section className="adm-hero">
          <div className="adm-hero-inner">
            <span className="adm-eyebrow">Intake open</span>
            <h1 className="adm-hero-title">Admissions</h1>
            <p className="adm-hero-sub">
              Everything you need to know about applying to HANIKA Anglican
              Integrated Polytechnic — requirements, steps, fees, and key
              dates.
            </p>
            <div className="adm-hero-actions">
              {/* CHANGED: real Link to the application page */}
              <Link to={APPLY_ROUTE} className="adm-btn-primary">
                Start your application →
              </Link>
              <a href="#requirements" className="adm-btn-secondary">
                See requirements
              </a>
            </div>
          </div>
        </section>

        {/* Quick facts strip */}
        <section className="adm-quickfacts">
          <div className="adm-quickfacts-inner">
            <div className="adm-fact">
              <span className="adm-fact-icon">📝</span>
              <div>
                <span className="adm-fact-label">How to apply</span>
                <span className="adm-fact-value">Online or in person</span>
              </div>
            </div>
            <div className="adm-fact">
              <span className="adm-fact-icon">⏱️</span>
              <div>
                <span className="adm-fact-label">Review time</span>
                <span className="adm-fact-value">2–4 weeks</span>
              </div>
            </div>
            <div className="adm-fact">
              <span className="adm-fact-icon">🎓</span>
              <div>
                <span className="adm-fact-label">Levels offered</span>
                <span className="adm-fact-value">
                  Certificate · Diploma · Degree
                </span>
              </div>
            </div>
            <div className="adm-fact">
              <span className="adm-fact-icon">💰</span>
              <div>
                <span className="adm-fact-label">Scholarships</span>
                <span className="adm-fact-value">Available</span>
              </div>
            </div>
          </div>
        </section>

        {/* Application steps */}
        <section className="adm-section" id="apply">
          <div className="adm-section-inner">
            <header className="adm-section-header">
              <span className="adm-section-eyebrow">Step by step</span>
              <h2 className="adm-section-title">How to apply</h2>
              <p className="adm-section-sub">
                Follow these steps to submit a complete, competitive
                application.
              </p>
            </header>

            <ol className="adm-steps">
              {steps.map((s, i) => (
                <li className="adm-step" key={s.id || i}>
                  <span className="adm-step-num">{i + 1}</span>
                  <div className="adm-step-body">
                    <h3 className="adm-step-title">{s.title}</h3>
                    <p className="adm-step-desc">{s.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* NEW: CTA right under the steps */}
            <div className="adm-inline-cta">
              <Link to={APPLY_ROUTE} className="adm-btn-primary adm-btn-primary--solid">
                Register / Apply now →
              </Link>
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="adm-section adm-section--alt" id="requirements">
          <div className="adm-section-inner">
            <header className="adm-section-header">
              <span className="adm-section-eyebrow">What you need</span>
              <h2 className="adm-section-title">Entry requirements</h2>
              <p className="adm-section-sub">
                Requirements vary by level. Check what applies to your chosen
                program.
              </p>
            </header>

            <div className="adm-req-grid">
              {requirements.map((r) => (
                <article className="adm-req-card" key={r.id}>
                  {r.level && (
                    <span
                      className={`adm-req-level adm-req-level--${(
                        r.level || ""
                      ).toLowerCase()}`}
                    >
                      {levelLabel(r.level)}
                    </span>
                  )}
                  <h3 className="adm-req-title">{r.title}</h3>
                  <p className="adm-req-desc">{r.description}</p>
                </article>
              ))}
            </div>

            <div className="adm-docs">
              <h3 className="adm-docs-title">📄 Documents to prepare</h3>
              <ul className="adm-docs-list">
                {FALLBACK_DOCUMENTS.map((d) => (
                  <li key={d}>
                    <span className="adm-docs-check">✓</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Fees */}
        <section className="adm-section" id="fees">
          <div className="adm-section-inner">
            <header className="adm-section-header">
              <span className="adm-section-eyebrow">Costs</span>
              <h2 className="adm-section-title">Fees & tuition</h2>
              <p className="adm-section-sub">
                Indicative fees for the current intake. Contact the admissions
                office for the exact amounts that apply to your program.
              </p>
            </header>

            <div className="adm-fees-grid">
              {fees.map((f) => (
                <div className="adm-fee-card" key={f.id}>
                  <span className="adm-fee-label">{f.label}</span>
                  <span className="adm-fee-amount">
                    {f.amount
                      ? formatAmount(f.amount, f.currency)
                      : "Contact office"}
                  </span>
                  {f.period && (
                    <span className="adm-fee-period">{f.period}</span>
                  )}
                  {f.note && <span className="adm-fee-note">{f.note}</span>}
                </div>
              ))}
            </div>

            <p className="adm-fees-disclaimer">
              * Fees are subject to change. Scholarships and payment plans are
              available — see below.
            </p>
          </div>
        </section>

        {/* Key dates */}
        {dates.length > 0 && (
          <section className="adm-section adm-section--alt" id="calendar">
            <div className="adm-section-inner">
              <header className="adm-section-header">
                <span className="adm-section-eyebrow">Calendar</span>
                <h2 className="adm-section-title">Key dates</h2>
                <p className="adm-section-sub">
                  Important admissions milestones for the upcoming intake.
                </p>
              </header>

              <ul className="adm-dates">
                {dates.map((d) => (
                  <li className="adm-date" key={d.id}>
                    <div className="adm-date-day">
                      {d.event_date
                        ? new Date(d.event_date)
                            .getDate()
                            .toString()
                            .padStart(2, "0")
                        : "--"}
                    </div>
                    <div className="adm-date-info">
                      <span className="adm-date-label">{d.label}</span>
                      <span className="adm-date-when">
                        {formatDate(d.event_date)}
                        {d.note ? ` · ${d.note}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Browse programs */}
        {programs.length > 0 && (
          <section className="adm-section" id="programs">
            <div className="adm-section-inner">
              <header className="adm-section-header">
                <span className="adm-section-eyebrow">Choose your path</span>
                <h2 className="adm-section-title">
                  Programs you can apply for
                </h2>
                <p className="adm-section-sub">
                  Filter by level, then open a program to see full details.
                </p>
              </header>

              <div className="adm-level-chips">
                <button
                  type="button"
                  className={`adm-chip ${activeLevel === null ? "active" : ""}`}
                  onClick={() => setActiveLevel(null)}
                >
                  All levels
                </button>
                {["certificate", "diploma", "degree"].map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    className={`adm-chip ${
                      activeLevel === lv ? "active" : ""
                    }`}
                    onClick={() => setActiveLevel(lv)}
                  >
                    {levelLabel(lv)}
                  </button>
                ))}
              </div>

              {filteredPrograms.length === 0 ? (
                <p className="adm-programs-empty">
                  No programs match this level. Try a different filter.
                </p>
              ) : (
                <div className="adm-programs-grid">
                  {filteredPrograms.slice(0, 6).map((p) => (
                    <Link
                      key={p.id}
                      to={`/programs/${p.slug}`}
                      className="adm-program-card"
                    >
                      <span
                        className={`adm-program-level adm-program-level--${(
                          p.level || ""
                        ).toLowerCase()}`}
                      >
                        {levelLabel(p.level)}
                      </span>
                      <h3 className="adm-program-title">{p.name}</h3>
                      <span className="adm-program-dept">
                        {p.department_name}
                      </span>
                      {p.duration && (
                        <span className="adm-program-meta">
                          <span className="adm-program-meta-icon">⏱️</span>
                          {p.duration}
                        </span>
                      )}
                      <span className="adm-program-cta">
                        View details <span className="arrow">→</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="adm-programs-more">
                <Link to="/programs" className="adm-btn-secondary">
                  See all programs →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="adm-section adm-section--alt" id="faq">
          <div className="adm-section-inner">
            <header className="adm-section-header">
              <span className="adm-section-eyebrow">Questions</span>
              <h2 className="adm-section-title">
                Frequently asked questions
              </h2>
            </header>

            <ul className="adm-faq">
              {FALLBACK_FAQ.map((f, i) => {
                const open = openFaq === i;
                return (
                  <li className="adm-faq-item" key={f.q}>
                    <button
                      type="button"
                      className={`adm-faq-q ${open ? "open" : ""}`}
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                    >
                      <span>{f.q}</span>
                      <span className="adm-faq-icon">{open ? "−" : "+"}</span>
                    </button>
                    {open && (
                      <div className="adm-faq-a">
                        <p>{f.a}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Contact strip */}
        {contact &&
          (contact.address ||
            contact.phone_primary ||
            contact.email_primary) && (
            <section className="adm-contact">
              <div className="adm-contact-inner">
                <div>
                  <h2 className="adm-section-title">Need help applying?</h2>
                  <p className="adm-section-sub">
                    Reach out to the admissions office — we're happy to help.
                  </p>
                </div>
                <div className="adm-contact-items">
                  {contact.phone_primary && (
                    <a
                      className="adm-contact-item"
                      href={`tel:${contact.phone_primary}`}
                    >
                      <span className="adm-contact-icon">📞</span>
                      <span>{contact.phone_primary}</span>
                    </a>
                  )}
                  {contact.email_primary && (
                    <a
                      className="adm-contact-item"
                      href={`mailto:${contact.email_primary}`}
                    >
                      <span className="adm-contact-icon">✉️</span>
                      <span>{contact.email_primary}</span>
                    </a>
                  )}
                  {contact.address && (
                    <div className="adm-contact-item">
                      <span className="adm-contact-icon">📍</span>
                      <span>{contact.address}</span>
                    </div>
                  )}
                  {contact.office_hours && (
                    <div className="adm-contact-item">
                      <span className="adm-contact-icon">🕐</span>
                      <span>{contact.office_hours}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

        {/* Final CTA */}
        <section className="adm-cta">
          <div className="adm-cta-inner">
            <h2 className="adm-cta-title">Ready to apply?</h2>
            <p className="adm-cta-sub">
              Applications are open. Take the first step toward your future at
              HANIKA today.
            </p>
            <div className="adm-cta-actions">
              {/* CHANGED: real Link to the application page */}
              <Link to={APPLY_ROUTE} className="adm-btn-primary">
                Start application
              </Link>
              <Link to="/contact" className="adm-btn-secondary">
                Contact admissions
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .adm-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
          scroll-behavior: smooth;
        }

        /* ===== Hero ===== */
        .adm-hero {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          padding: 84px 24px 64px;
          text-align: center;
        }
        .adm-hero-inner {
          max-width: 760px;
          margin: 0 auto;
        }
        .adm-eyebrow {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: #EBD9E9;
          margin-bottom: 12px;
        }
        .adm-hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(32px, 4.6vw, 52px);
          font-weight: 600;
          margin: 0 0 14px;
          line-height: 1.15;
          letter-spacing: -0.5px;
        }
        .adm-hero-sub {
          font-size: 17px;
          line-height: 1.65;
          color: #EBD9E9;
          margin: 0 0 28px;
        }
        .adm-hero-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .adm-btn-primary,
        .adm-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 28px;
          border-radius: 9px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
        }
        .adm-btn-primary {
          background: #FFFFFF;
          color: #893C87;
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.15);
        }
        .adm-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(255, 255, 255, 0.25);
        }
        /* Solid variant for CTAs outside the dark hero */
        .adm-btn-primary--solid {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.28);
        }
        .adm-btn-primary--solid:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(137, 60, 135, 0.35);
        }
        .adm-btn-secondary {
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          border: 1.5px solid rgba(255, 255, 255, 0.5);
        }
        .adm-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        /* ===== Quick facts strip ===== */
        .adm-quickfacts {
          max-width: 1160px;
          margin: -30px auto 0;
          padding: 0 24px;
          position: relative;
          z-index: 2;
        }
        .adm-quickfacts-inner {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 22px 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          box-shadow: 0 12px 32px rgba(41, 20, 40, 0.08);
        }
        .adm-fact {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .adm-fact-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #F3EAF2;
          color: #893C87;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .adm-fact-label {
          display: block;
          font-size: 11.5px;
          font-weight: 700;
          color: #8A7E88;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }
        .adm-fact-value {
          display: block;
          font-size: 14px;
          color: #241F24;
          font-weight: 600;
        }

        /* ===== Sections ===== */
        .adm-section { padding: 72px 24px; }
        .adm-section--alt {
          background: #FFFFFF;
          border-top: 1px solid #F0E6EF;
          border-bottom: 1px solid #F0E6EF;
        }
        .adm-section-inner {
          max-width: 1080px;
          margin: 0 auto;
        }
        .adm-section-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .adm-section-eyebrow {
          display: inline-block;
          font-size: 11.5px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 1.4px;
          margin-bottom: 10px;
        }
        .adm-section-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(24px, 3vw, 34px);
          font-weight: 600;
          color: #241F24;
          margin: 0 0 12px;
          line-height: 1.2;
          letter-spacing: -0.3px;
        }
        .adm-section-sub {
          font-size: 15.5px;
          line-height: 1.6;
          color: #6B646B;
          max-width: 640px;
          margin: 0 auto;
        }

        /* NEW: CTA right under the steps */
        .adm-inline-cta {
          margin-top: 32px;
          text-align: center;
        }

        /* ===== Steps ===== */
        .adm-steps {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
        }
        .adm-step {
          display: flex;
          gap: 16px;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 24px 22px 22px;
          align-items: flex-start;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .adm-step:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(41, 20, 40, 0.08);
        }
        .adm-step-num {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          font-family: 'Fraunces', serif;
          font-size: 17px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .adm-step-body { flex: 1; }
        .adm-step-title {
          font-family: 'Fraunces', serif;
          font-size: 17px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 6px;
        }
        .adm-step-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #6B646B;
          margin: 0;
        }

        /* ===== Requirements ===== */
        .adm-req-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
        }
        .adm-req-card {
          background: #FBF9FA;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 26px 24px 24px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .adm-req-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(41, 20, 40, 0.08);
        }
        .adm-req-level {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #FFFFFF;
          background: #6B646B;
          margin-bottom: 12px;
        }
        .adm-req-level--certificate { background: #4A90D9; }
        .adm-req-level--diploma    { background: #2E7D32; }
        .adm-req-level--degree     { background: #D69E2E; }

        .adm-req-title {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 8px;
        }
        .adm-req-desc {
          font-size: 14.5px;
          line-height: 1.65;
          color: #4A444A;
          margin: 0;
        }

        .adm-docs {
          margin-top: 40px;
          padding: 28px 32px;
          background: #FBF9FA;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
        }
        .adm-docs-title {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 18px;
        }
        .adm-docs-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }
        .adm-docs-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14.5px;
          color: #4A444A;
          line-height: 1.5;
        }
        .adm-docs-check {
          color: #2E7D32;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* ===== Fees ===== */
        .adm-fees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
        }
        .adm-fee-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 24px 22px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-align: center;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .adm-fee-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(41, 20, 40, 0.08);
        }
        .adm-fee-label {
          font-size: 13px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .adm-fee-amount {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 700;
          color: #241F24;
          line-height: 1.2;
        }
        .adm-fee-period {
          font-size: 12.5px;
          color: #8A7E88;
          margin-top: 2px;
        }
        .adm-fee-note {
          font-size: 12px;
          color: #B96AAE;
          font-style: italic;
          margin-top: 6px;
        }
        .adm-fees-disclaimer {
          text-align: center;
          font-size: 13px;
          color: #8A7E88;
          margin: 24px 0 0;
          font-style: italic;
        }

        /* ===== Dates ===== */
        .adm-dates {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .adm-date {
          display: flex;
          align-items: center;
          gap: 18px;
          background: #FBF9FA;
          border: 1px solid #E1D9E0;
          border-radius: 12px;
          padding: 16px 22px;
        }
        .adm-date-day {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .adm-date-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .adm-date-label {
          font-size: 15px;
          font-weight: 600;
          color: #241F24;
        }
        .adm-date-when {
          font-size: 13px;
          color: #6B646B;
        }

        /* ===== Programs ===== */
        .adm-level-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-bottom: 28px;
        }
        .adm-chip {
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
        .adm-chip:hover { border-color: #893C87; color: #893C87; }
        .adm-chip.active {
          background: #893C87;
          border-color: #893C87;
          color: #FFFFFF;
        }

        .adm-programs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 18px;
        }
        .adm-program-card {
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 22px 22px 20px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .adm-program-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(41, 20, 40, 0.08);
          border-color: #E7D3E6;
        }
        .adm-program-level {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #FFFFFF;
          background: #6B646B;
          align-self: flex-start;
          margin-bottom: 12px;
        }
        .adm-program-level--certificate { background: #4A90D9; }
        .adm-program-level--diploma    { background: #2E7D32; }
        .adm-program-level--degree     { background: #D69E2E; }

        .adm-program-title {
          font-family: 'Fraunces', serif;
          font-size: 17px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 4px;
          line-height: 1.3;
        }
        .adm-program-dept {
          font-size: 12px;
          color: #8A7E88;
          margin-bottom: 10px;
        }
        .adm-program-meta {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12.5px;
          color: #6B646B;
          margin-bottom: 12px;
        }
        .adm-program-meta-icon { font-size: 12px; }

        .adm-program-cta {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 700;
          color: #893C87;
          padding-top: 12px;
          border-top: 1px solid #F0E6EF;
        }
        .adm-program-cta .arrow { transition: transform 0.15s ease; }
        .adm-program-card:hover .adm-program-cta .arrow { transform: translateX(4px); }

        .adm-programs-empty {
          text-align: center;
          font-size: 14.5px;
          color: #6B646B;
          padding: 20px;
        }
        .adm-programs-more {
          margin-top: 28px;
          text-align: center;
        }

        /* ===== FAQ ===== */
        .adm-faq {
          list-style: none;
          margin: 0 auto;
          padding: 0;
          max-width: 760px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .adm-faq-item {
          background: #FBF9FA;
          border: 1px solid #E1D9E0;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.15s ease;
        }
        .adm-faq-item:has(.adm-faq-q.open) {
          border-color: #B96AAE;
        }
        .adm-faq-q {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 18px 22px;
          background: none;
          border: none;
          text-align: left;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #241F24;
          cursor: pointer;
        }
        .adm-faq-q:hover { color: #893C87; }
        .adm-faq-icon {
          font-size: 22px;
          font-weight: 400;
          color: #893C87;
          line-height: 1;
          flex-shrink: 0;
        }
        .adm-faq-a {
          padding: 0 22px 20px;
        }
        .adm-faq-a p {
          margin: 0;
          font-size: 14.5px;
          line-height: 1.7;
          color: #4A444A;
        }

        /* ===== Contact ===== */
        .adm-contact { padding: 64px 24px; }
        .adm-contact-inner {
          max-width: 1080px;
          margin: 0 auto;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 40px 40px;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 32px;
          align-items: center;
        }
        .adm-contact-items {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .adm-contact-item {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 12px 14px;
          background: #FBF9FA;
          border: 1px solid #F0E6EF;
          border-radius: 10px;
          font-size: 13.5px;
          color: #4A444A;
          text-decoration: none;
          word-break: break-word;
        }
        a.adm-contact-item:hover {
          border-color: #B96AAE;
          color: #893C87;
        }
        .adm-contact-icon {
          flex-shrink: 0;
          font-size: 15px;
        }

        /* ===== Final CTA ===== */
        .adm-cta { padding: 0 24px 80px; }
        .adm-cta-inner {
          max-width: 1080px;
          margin: 0 auto;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          border-radius: 18px;
          padding: 56px 40px;
          text-align: center;
          color: #FFFFFF;
          box-shadow: 0 20px 48px rgba(137, 60, 135, 0.24);
        }
        .adm-cta-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 600;
          margin: 0 0 12px;
        }
        .adm-cta-sub {
          font-size: 16px;
          line-height: 1.6;
          color: #EBD9E9;
          max-width: 540px;
          margin: 0 auto 28px;
        }
        .adm-cta-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .adm-cta-actions .adm-btn-primary {
          background: #FFFFFF;
          color: #893C87;
        }
        .adm-cta-actions .adm-btn-secondary {
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          border: 1.5px solid rgba(255, 255, 255, 0.5);
        }

        /* ===== Responsive ===== */
        @media (max-width: 900px) {
          .adm-contact-inner {
            grid-template-columns: 1fr;
            padding: 32px 26px;
            gap: 24px;
          }
        }
        @media (max-width: 640px) {
          .adm-hero { padding: 64px 20px 44px; }
          .adm-hero-title { font-size: 30px; }
          .adm-hero-sub { font-size: 15.5px; }
          .adm-hero-actions { flex-direction: column; }
          .adm-hero-actions > * { width: 100%; }

          .adm-quickfacts { padding: 0 16px; margin-top: -20px; }
          .adm-quickfacts-inner { padding: 18px; }

          .adm-section { padding: 48px 16px; }
          .adm-section-header { margin-bottom: 32px; }
          .adm-section-title { font-size: 24px; }
          .adm-section-sub { font-size: 14.5px; }

          .adm-step { padding: 20px 18px; }
          .adm-req-card { padding: 22px 20px; }
          .adm-docs { padding: 22px 20px; }
          .adm-fee-card { padding: 20px; }
          .adm-program-card { padding: 20px; }
          .adm-date { padding: 14px 16px; gap: 12px; }
          .adm-date-day { width: 46px; height: 46px; font-size: 19px; }
          .adm-faq-q { padding: 16px 18px; font-size: 14.5px; }
          .adm-faq-a { padding: 0 18px 18px; }

          .adm-cta { padding: 0 16px 60px; }
          .adm-cta-inner { padding: 40px 22px; }
          .adm-cta-actions { flex-direction: column; }
          .adm-cta-actions > * { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .adm-step,
          .adm-req-card,
          .adm-fee-card,
          .adm-program-card,
          .adm-btn-primary,
          .adm-btn-secondary,
          .adm-program-cta .arrow {
            transition: none !important;
          }
          .adm-page { scroll-behavior: auto; }
        }
      `}</style>
    </>
  );
}

export default Admissions;