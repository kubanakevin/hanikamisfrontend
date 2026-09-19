// src/pages/Register.jsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const STEP_TITLES = [
  "Personal details",
  "Contact information",
  "Education background",
  "Program & confirm",
];

const LEVEL_LABELS = {
  certificate: "Certificate",
  diploma: "Diploma",
  degree: "Degree",
};

const levelLabel = (level) =>
  LEVEL_LABELS[level?.toLowerCase()] || level || "Program";

const emptyForm = {
  // Step 1 — Personal
  full_name: "",
  email: "",
  phone: "",
  national_id: "",
  date_of_birth: "",
  gender: "",

  // Step 2 — Contact
  address: "",
  city: "",
  country: "Rwanda",

  // Step 3 — Education
  previous_school: "",
  previous_level: "",
  previous_grades: "",

  // Guardian
  guardian_name: "",
  guardian_phone: "",

  // Step 4 — Program & confirm
  program_id: "",
  program_slug: "",
  notes: "",
  agree_terms: false,
};

function Register() {
  const [status, setStatus] = useState("loading");
  const [showPreloader, setShowPreloader] = useState(true);
  const [programs, setPrograms] = useState([]);

  const [step, setStep] = useState(0); // 0..3
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null); // { id }

  // ---------- Load programs ----------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/client/applications/programs`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) setPrograms(json.data || []);
        setStatus("ready");
      } catch (err) {
        console.error("Programs load error:", err);
        if (!cancelled) setStatus("ready");
      } finally {
        setTimeout(() => setShowPreloader(false), 800);
      }
    }

    load();

    fetch(`${API_BASE}/api/client/visits/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page_url: "/register" }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Handlers ----------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      // clear slug if user changes program
      ...(name === "program_id" ? { program_slug: "" } : {}),
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (submitError) setSubmitError("");
  };

  // Per-step validation
  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!formData.full_name.trim()) e.full_name = "Full name is required";
      if (!formData.email.trim()) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
        e.email = "Enter a valid email";
      if (!formData.phone.trim()) e.phone = "Phone number is required";
    }
    if (step === 1) {
      if (!formData.address.trim()) e.address = "Address is required";
      if (!formData.city.trim()) e.city = "City is required";
    }
    if (step === 2) {
      if (!formData.previous_school.trim())
        e.previous_school = "Previous school is required";
      if (!formData.previous_level.trim())
        e.previous_level = "Previous level is required";
    }
    if (step === 3) {
      if (!formData.program_id) e.program_id = "Please select a program";
      if (!formData.agree_terms)
        e.agree_terms = "You must agree to the terms to submit";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`${API_BASE}/api/client/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        setSuccess({ id: json.data?.id });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitError(json.error || "Failed to submit application");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProgram = useMemo(
    () => programs.find((p) => String(p.id) === String(formData.program_id)),
    [programs, formData.program_id]
  );

  // ---------- Render states ----------
  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  // Success screen
  if (success) {
    return (
      <>
        <NavBar />
        <main className="reg-page">
          <section className="reg-success">
            <div className="reg-success-inner">
              <div className="reg-success-icon">✅</div>
              <h1 className="reg-success-title">Application received!</h1>
              <p className="reg-success-sub">
                Thank you for applying to HANIKA. Our admissions team will
                review your application and get back to you within 2–4 weeks.
              </p>

              <div className="reg-success-ref">
                <span className="reg-success-ref-label">Reference number</span>
                <span className="reg-success-ref-value">
                  #{String(success.id).padStart(6, "0")}
                </span>
              </div>

              <p className="reg-success-note">
                A confirmation has been sent to{" "}
                <strong>{formData.email}</strong>. Keep your reference number
                handy for future correspondence.
              </p>

              <div className="reg-success-actions">
                <Link to="/" className="reg-btn-primary">
                  Back to homepage
                </Link>
                <Link to="/programs" className="reg-btn-secondary">
                  Explore programs
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />

        <style>{`
          .reg-page {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #FBF9FA;
            min-height: 100vh;
          }
          .reg-success {
            max-width: 640px;
            margin: 0 auto;
            padding: 96px 24px 80px;
          }
          .reg-success-inner {
            background: #FFFFFF;
            border: 1px solid #E1D9E0;
            border-radius: 20px;
            padding: 56px 44px;
            text-align: center;
            box-shadow: 0 20px 48px rgba(41, 20, 40, 0.08);
          }
          .reg-success-icon {
            font-size: 64px;
            line-height: 1;
            margin-bottom: 20px;
          }
          .reg-success-title {
            font-family: 'Fraunces', serif;
            font-size: clamp(26px, 3.4vw, 36px);
            font-weight: 600;
            color: #241F24;
            margin: 0 0 14px;
            line-height: 1.2;
          }
          .reg-success-sub {
            font-size: 15.5px;
            line-height: 1.65;
            color: #6B646B;
            margin: 0 0 26px;
          }
          .reg-success-ref {
            display: inline-flex;
            flex-direction: column;
            gap: 4px;
            padding: 16px 28px;
            background: #F3EAF2;
            border-radius: 12px;
            margin-bottom: 24px;
          }
          .reg-success-ref-label {
            font-size: 11px;
            font-weight: 700;
            color: #893C87;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .reg-success-ref-value {
            font-family: 'Fraunces', serif;
            font-size: 26px;
            font-weight: 700;
            color: #6F2F6D;
            letter-spacing: 1px;
          }
          .reg-success-note {
            font-size: 14px;
            color: #6B646B;
            line-height: 1.6;
            margin: 0 0 28px;
          }
          .reg-success-note strong { color: #241F24; }

          .reg-success-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .reg-btn-primary,
          .reg-btn-secondary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 13px 26px;
            border-radius: 9px;
            font-size: 14.5px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.18s ease;
            border: none;
            cursor: pointer;
            font-family: inherit;
          }
          .reg-btn-primary {
            background: linear-gradient(135deg, #893C87, #6F2F6D);
            color: #FFFFFF;
            box-shadow: 0 8px 22px rgba(137, 60, 135, 0.28);
          }
          .reg-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 32px rgba(137, 60, 135, 0.36);
          }
          .reg-btn-secondary {
            background: #F3EAF2;
            color: #6F2F6D;
          }
          .reg-btn-secondary:hover { background: #E7D3E6; }

          @media (max-width: 640px) {
            .reg-success { padding: 56px 16px 60px; }
            .reg-success-inner { padding: 36px 24px; }
            .reg-success-actions { flex-direction: column; }
            .reg-success-actions > * { width: 100%; }
          }
        `}</style>
      </>
    );
  }

  // Form
  return (
    <>
      <NavBar />
      <main className="reg-page">
        {/* Hero */}
        <section className="reg-hero">
          <div className="reg-hero-inner">
            <span className="reg-eyebrow">Admissions · Application</span>
            <h1 className="reg-hero-title">Apply to HANIKA</h1>
            <p className="reg-hero-sub">
              Complete the form below to submit your application. It takes
              about 5 minutes.
            </p>
          </div>
        </section>

        {/* Progress */}
        <section className="reg-progress-wrap">
          <div className="reg-progress-inner">
            <div className="reg-progress">
              <div
                className="reg-progress-bar"
                style={{
                  width: `${((step + 1) / STEP_TITLES.length) * 100}%`,
                }}
              />
            </div>
            <div className="reg-steps">
              {STEP_TITLES.map((t, i) => (
                <div
                  key={t}
                  className={`reg-step ${
                    i === step ? "active" : ""
                  } ${i < step ? "done" : ""}`}
                >
                  <div className="reg-step-dot">
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="reg-step-label">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="reg-form-section">
          <div className="reg-form-inner">
            <form onSubmit={handleSubmit} noValidate>
              {submitError && (
                <div className="reg-alert reg-alert--error">{submitError}</div>
              )}

              {/* STEP 1 — Personal */}
              {step === 0 && (
                <div className="reg-step-panel">
                  <header className="reg-panel-header">
                    <span className="reg-panel-eyebrow">Step 1 of 4</span>
                    <h2 className="reg-panel-title">Personal details</h2>
                    <p className="reg-panel-sub">
                      Tell us who you are. We use this to contact you about
                      your application.
                    </p>
                  </header>

                  <div className="reg-grid">
                    <div className="reg-field full">
                      <label htmlFor="full_name">Full name *</label>
                      <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="e.g., Marie Uwase"
                        autoComplete="name"
                      />
                      {errors.full_name && (
                        <span className="reg-error">{errors.full_name}</span>
                      )}
                    </div>

                    <div className="reg-field">
                      <label htmlFor="email">Email *</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                      {errors.email && (
                        <span className="reg-error">{errors.email}</span>
                      )}
                    </div>

                    <div className="reg-field">
                      <label htmlFor="phone">Phone number *</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+250 ..."
                        autoComplete="tel"
                      />
                      {errors.phone && (
                        <span className="reg-error">{errors.phone}</span>
                      )}
                    </div>

                    <div className="reg-field">
                      <label htmlFor="national_id">National ID</label>
                      <input
                        id="national_id"
                        name="national_id"
                        type="text"
                        value={formData.national_id}
                        onChange={handleChange}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="reg-field">
                      <label htmlFor="date_of_birth">Date of birth</label>
                      <input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="reg-field full">
                      <label htmlFor="gender">Gender</label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 — Contact */}
              {step === 1 && (
                <div className="reg-step-panel">
                  <header className="reg-panel-header">
                    <span className="reg-panel-eyebrow">Step 2 of 4</span>
                    <h2 className="reg-panel-title">Contact information</h2>
                    <p className="reg-panel-sub">
                      Where do you currently live? This helps us send you the
                      right information.
                    </p>
                  </header>

                  <div className="reg-grid">
                    <div className="reg-field full">
                      <label htmlFor="address">Street address *</label>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="e.g., KG 11 Ave, House 25"
                        autoComplete="street-address"
                      />
                      {errors.address && (
                        <span className="reg-error">{errors.address}</span>
                      )}
                    </div>

                    <div className="reg-field">
                      <label htmlFor="city">City / District *</label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g., Kigali"
                        autoComplete="address-level2"
                      />
                      {errors.city && (
                        <span className="reg-error">{errors.city}</span>
                      )}
                    </div>

                    <div className="reg-field">
                      <label htmlFor="country">Country</label>
                      <input
                        id="country"
                        name="country"
                        type="text"
                        value={formData.country}
                        onChange={handleChange}
                        autoComplete="country-name"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 — Education */}
              {step === 2 && (
                <div className="reg-step-panel">
                  <header className="reg-panel-header">
                    <span className="reg-panel-eyebrow">Step 3 of 4</span>
                    <h2 className="reg-panel-title">Education background</h2>
                    <p className="reg-panel-sub">
                      Tell us about the school you attended most recently.
                    </p>
                  </header>

                  <div className="reg-grid">
                    <div className="reg-field full">
                      <label htmlFor="previous_school">
                        Previous school / institution *
                      </label>
                      <input
                        id="previous_school"
                        name="previous_school"
                        type="text"
                        value={formData.previous_school}
                        onChange={handleChange}
                        placeholder="e.g., Lycée de Kigali"
                      />
                      {errors.previous_school && (
                        <span className="reg-error">
                          {errors.previous_school}
                        </span>
                      )}
                    </div>

                    <div className="reg-field">
                      <label htmlFor="previous_level">
                        Level completed *
                      </label>
                      <select
                        id="previous_level"
                        name="previous_level"
                        value={formData.previous_level}
                        onChange={handleChange}
                      >
                        <option value="">Select level</option>
                        <option value="o-level">O-Level</option>
                        <option value="a-level">A-Level</option>
                        <option value="certificate">Certificate</option>
                        <option value="diploma">Diploma</option>
                        <option value="degree">Degree</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.previous_level && (
                        <span className="reg-error">
                          {errors.previous_level}
                        </span>
                      )}
                    </div>

                    <div className="reg-field">
                      <label htmlFor="previous_grades">
                        Grades / GPA
                      </label>
                      <input
                        id="previous_grades"
                        name="previous_grades"
                        type="text"
                        value={formData.previous_grades}
                        onChange={handleChange}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="reg-field">
                      <label htmlFor="guardian_name">
                        Parent / guardian name
                      </label>
                      <input
                        id="guardian_name"
                        name="guardian_name"
                        type="text"
                        value={formData.guardian_name}
                        onChange={handleChange}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="reg-field">
                      <label htmlFor="guardian_phone">
                        Parent / guardian phone
                      </label>
                      <input
                        id="guardian_phone"
                        name="guardian_phone"
                        type="tel"
                        value={formData.guardian_phone}
                        onChange={handleChange}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 — Program & confirm */}
              {step === 3 && (
                <div className="reg-step-panel">
                  <header className="reg-panel-header">
                    <span className="reg-panel-eyebrow">Step 4 of 4</span>
                    <h2 className="reg-panel-title">
                      Program & confirmation
                    </h2>
                    <p className="reg-panel-sub">
                      Choose the program you'd like to apply for, then review
                      and submit.
                    </p>
                  </header>

                  <div className="reg-grid">
                    <div className="reg-field full">
                      <label htmlFor="program_id">Program *</label>
                      <select
                        id="program_id"
                        name="program_id"
                        value={formData.program_id}
                        onChange={handleChange}
                      >
                        <option value="">Select a program</option>
                        {programs.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {levelLabel(p.level)}
                            {p.department_name
                              ? ` · ${p.department_name}`
                              : ""}
                          </option>
                        ))}
                      </select>
                      {errors.program_id && (
                        <span className="reg-error">{errors.program_id}</span>
                      )}
                    </div>

                    <div className="reg-field full">
                      <label htmlFor="notes">
                        Additional notes (optional)
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows="4"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Anything else you'd like us to know?"
                      />
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="reg-summary">
                    <h3 className="reg-summary-title">
                      Review your details
                    </h3>
                    <div className="reg-summary-grid">
                      <div className="reg-summary-row">
                        <span className="reg-summary-label">Name</span>
                        <span className="reg-summary-value">
                          {formData.full_name || "—"}
                        </span>
                      </div>
                      <div className="reg-summary-row">
                        <span className="reg-summary-label">Email</span>
                        <span className="reg-summary-value">
                          {formData.email || "—"}
                        </span>
                      </div>
                      <div className="reg-summary-row">
                        <span className="reg-summary-label">Phone</span>
                        <span className="reg-summary-value">
                          {formData.phone || "—"}
                        </span>
                      </div>
                      <div className="reg-summary-row">
                        <span className="reg-summary-label">City</span>
                        <span className="reg-summary-value">
                          {formData.city || "—"}
                        </span>
                      </div>
                      <div className="reg-summary-row">
                        <span className="reg-summary-label">
                          Previous school
                        </span>
                        <span className="reg-summary-value">
                          {formData.previous_school || "—"}
                        </span>
                      </div>
                      <div className="reg-summary-row">
                        <span className="reg-summary-label">Program</span>
                        <span className="reg-summary-value">
                          {selectedProgram
                            ? `${selectedProgram.name} (${levelLabel(
                                selectedProgram.level
                              )})`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <label className="reg-agree">
                    <input
                      type="checkbox"
                      name="agree_terms"
                      checked={formData.agree_terms}
                      onChange={handleChange}
                    />
                    <span>
                      I confirm the information above is accurate, and I agree
                      to HANIKA processing my application.
                    </span>
                  </label>
                  {errors.agree_terms && (
                    <span className="reg-error reg-error--block">
                      {errors.agree_terms}
                    </span>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="reg-nav">
                <div className="reg-nav-left">
                  {step > 0 && (
                    <button
                      type="button"
                      className="reg-btn-secondary"
                      onClick={goBack}
                      disabled={submitting}
                    >
                      ← Back
                    </button>
                  )}
                </div>
                <div className="reg-nav-right">
                  {step < STEP_TITLES.length - 1 && (
                    <button
                      type="button"
                      className="reg-btn-primary"
                      onClick={goNext}
                    >
                      Next step →
                    </button>
                  )}
                  {step === STEP_TITLES.length - 1 && (
                    <button
                      type="submit"
                      className="reg-btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting…" : "Submit application"}
                    </button>
                  )}
                </div>
              </div>

              <p className="reg-foot-note">
                Need help? Contact the admissions office — see the{" "}
                <Link to="/admissions#faq">Admissions page</Link> for our
                contact details.
              </p>
            </form>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .reg-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
        }

        /* ===== Hero ===== */
        .reg-hero {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          padding: 72px 24px 52px;
          text-align: center;
        }
        .reg-hero-inner { max-width: 720px; margin: 0 auto; }
        .reg-eyebrow {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          color: #EBD9E9;
          margin-bottom: 12px;
        }
        .reg-hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(30px, 4vw, 44px);
          font-weight: 600;
          margin: 0 0 12px;
          line-height: 1.15;
          letter-spacing: -0.4px;
        }
        .reg-hero-sub {
          font-size: 16px;
          line-height: 1.6;
          color: #EBD9E9;
          margin: 0;
        }

        /* ===== Progress ===== */
        .reg-progress-wrap {
          background: #FFFFFF;
          border-bottom: 1px solid #E1D9E0;
          position: sticky;
          top: 0;
          z-index: 5;
        }
        .reg-progress-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px 24px 22px;
        }
        .reg-progress {
          width: 100%;
          height: 4px;
          background: #F3EAF2;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 18px;
        }
        .reg-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #893C87, #B96AAE);
          transition: width 0.3s ease;
        }
        .reg-steps {
          display: flex;
          gap: 8px;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .reg-step {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          font-weight: 500;
          color: #8A7E88;
        }
        .reg-step-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #F3EAF2;
          color: #893C87;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .reg-step.active .reg-step-dot {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          transform: scale(1.1);
          box-shadow: 0 6px 14px rgba(137, 60, 135, 0.28);
        }
        .reg-step.done .reg-step-dot {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .reg-step.active .reg-step-label {
          color: #241F24;
          font-weight: 600;
        }
        .reg-step.done .reg-step-label { color: #6B646B; }

        /* ===== Form ===== */
        .reg-form-section { padding: 48px 24px 96px; }
        .reg-form-inner { max-width: 760px; margin: 0 auto; }
        .reg-step-panel { padding: 8px 0 24px; }

        .reg-panel-header { margin-bottom: 32px; }
        .reg-panel-eyebrow {
          display: inline-block;
          font-size: 11.5px;
          font-weight: 700;
          color: #893C87;
          text-transform: uppercase;
          letter-spacing: 1.4px;
          margin-bottom: 8px;
        }
        .reg-panel-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 600;
          color: #241F24;
          margin: 0 0 10px;
          line-height: 1.2;
          letter-spacing: -0.3px;
        }
        .reg-panel-sub {
          font-size: 15px;
          line-height: 1.6;
          color: #6B646B;
          margin: 0;
        }

        .reg-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 28px 28px 26px;
        }
        .reg-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .reg-field.full { grid-column: 1 / -1; }
        .reg-field label {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .reg-field input,
        .reg-field select,
        .reg-field textarea {
          padding: 12px 14px;
          border: 1px solid #E1D9E0;
          border-radius: 10px;
          font-size: 14.5px;
          font-family: 'Inter', sans-serif;
          background: #FFFFFF;
          color: #241F24;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          width: 100%;
        }
        .reg-field textarea { resize: vertical; }
        .reg-field input:focus,
        .reg-field select:focus,
        .reg-field textarea:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.1);
        }
        .reg-error {
          font-size: 12.5px;
          color: #C62828;
          font-weight: 500;
        }
        .reg-error--block {
          display: block;
          margin-top: 8px;
        }

        .reg-alert {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .reg-alert--error {
          background: #FDE8E8;
          color: #C62828;
        }

        /* ===== Summary ===== */
        .reg-summary {
          margin-top: 28px;
          background: #FBF9FA;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 24px 24px 22px;
        }
        .reg-summary-title {
          font-family: 'Fraunces', serif;
          font-size: 17px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 16px;
        }
        .reg-summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 20px;
        }
        .reg-summary-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .reg-summary-label {
          font-size: 11px;
          font-weight: 700;
          color: #8A7E88;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .reg-summary-value {
          font-size: 14px;
          color: #241F24;
          font-weight: 500;
          word-break: break-word;
        }

        .reg-agree {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-top: 24px;
          padding: 16px 18px;
          background: #F3EAF2;
          border-radius: 12px;
          font-size: 14px;
          color: #4A444A;
          line-height: 1.55;
          cursor: pointer;
        }
        .reg-agree input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #893C87;
          flex-shrink: 0;
          margin-top: 2px;
          cursor: pointer;
        }

        /* ===== Navigation ===== */
        .reg-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #E1D9E0;
          flex-wrap: wrap;
        }
        .reg-nav-left,
        .reg-nav-right { display: flex; gap: 12px; }

        .reg-btn-primary,
        .reg-btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 13px 26px;
          border-radius: 9px;
          font-size: 14.5px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.18s ease;
          border: none;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
        }
        .reg-btn-primary {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          box-shadow: 0 8px 22px rgba(137, 60, 135, 0.28);
        }
        .reg-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(137, 60, 135, 0.36);
        }
        .reg-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .reg-btn-secondary {
          background: #F3EAF2;
          color: #6F2F6D;
        }
        .reg-btn-secondary:hover:not(:disabled) { background: #E7D3E6; }
        .reg-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        .reg-foot-note {
          text-align: center;
          font-size: 13px;
          color: #8A7E88;
          margin: 24px 0 0;
        }
        .reg-foot-note a {
          color: #893C87;
          text-decoration: none;
          font-weight: 600;
        }
        .reg-foot-note a:hover { text-decoration: underline; }

        /* ===== Responsive ===== */
        @media (max-width: 640px) {
          .reg-hero { padding: 56px 20px 40px; }
          .reg-hero-title { font-size: 28px; }
          .reg-hero-sub { font-size: 15px; }

          .reg-progress-inner { padding: 16px 16px 18px; }
          .reg-step-label { display: none; }
          .reg-step { gap: 0; }
          .reg-steps { justify-content: space-between; }

          .reg-form-section { padding: 32px 16px 64px; }
          .reg-grid {
            grid-template-columns: 1fr;
            padding: 22px 20px;
          }
          .reg-summary-grid { grid-template-columns: 1fr; }

          .reg-nav {
            flex-direction: column-reverse;
            align-items: stretch;
          }
          .reg-nav-left,
          .reg-nav-right { width: 100%; }
          .reg-nav-left button,
          .reg-nav-right button { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .reg-progress-bar,
          .reg-step-dot,
          .reg-btn-primary,
          .reg-btn-secondary {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}

export default Register;