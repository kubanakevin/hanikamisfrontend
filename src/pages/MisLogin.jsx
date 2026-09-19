// src/pages/StaffMisLogin.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";
const MIS_URL = "https://mis.haip.ac.rw"; // ← where MIS lives after login

function StaffMisLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/mis-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (json.success) {
        // Hand off to MIS. You can also pass a token via query string
        // if MIS reads it: `${MIS_URL}?token=${json.data.token}`
        window.location.href = MIS_URL;
      } else {
        setError(json.error || "Invalid MIS credentials");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <main className="auth-page">
        <section className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-icon auth-icon--blue">📊</div>
            <span className="auth-eyebrow">Staff access</span>
            <h1 className="auth-title">MIS Login</h1>
            <p className="auth-sub">
              Sign in to the Management Information System to access academic
              records, reports, and analytics.
            </p>

            {error && <div className="auth-alert">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="mis-email">Email</label>
                <input
                  id="mis-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="mis-password">MIS password</label>
                <div className="auth-pw-wrap">
                  <input
                    id="mis-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your MIS password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit auth-submit--blue"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in to MIS"}
              </button>
            </form>

            <div className="auth-links">
              <Link to="/staff">← Back to staff options</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <style>{`
        .auth-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #E8F0FA, #FBF9FA);
          min-height: 100vh;
        }
        .auth-card-wrap {
          max-width: 460px;
          margin: 0 auto;
          padding: 72px 24px 80px;
        }
        .auth-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 20px;
          padding: 40px 36px 32px;
          box-shadow: 0 20px 48px rgba(41, 20, 40, 0.08);
          text-align: center;
        }
        .auth-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          color: #FFFFFF;
          margin-bottom: 20px;
          box-shadow: 0 10px 24px rgba(74, 144, 217, 0.28);
        }
        .auth-icon--blue { background: linear-gradient(135deg, #4A90D9, #2E6FAF); }

        .auth-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #2E6FAF;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 8px;
        }
        .auth-title {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 8px;
          line-height: 1.2;
        }
        .auth-sub {
          font-size: 14px;
          line-height: 1.55;
          color: #6B646B;
          margin: 0 0 24px;
        }

        .auth-alert {
          background: #FDE8E8;
          color: #C62828;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          margin-bottom: 16px;
          text-align: left;
        }

        .auth-form { text-align: left; }
        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .auth-field label {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .auth-field input {
          padding: 12px 14px;
          border: 1px solid #E1D9E0;
          border-radius: 10px;
          font-size: 14.5px;
          font-family: inherit;
          background: #FFFFFF;
          color: #241F24;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          width: 100%;
        }
        .auth-field input:focus {
          outline: none;
          border-color: #4A90D9;
          box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.14);
        }
        .auth-pw-wrap { position: relative; }
        .auth-pw-toggle {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 6px;
        }
        .auth-pw-toggle:hover { background: #E8F0FA; }

        .auth-submit {
          width: 100%;
          padding: 13px 24px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.18s ease;
          box-shadow: 0 8px 22px rgba(137, 60, 135, 0.28);
          margin-top: 4px;
        }
        .auth-submit--blue {
          background: linear-gradient(135deg, #4A90D9, #2E6FAF);
          box-shadow: 0 8px 22px rgba(74, 144, 217, 0.32);
        }
        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(74, 144, 217, 0.38);
        }
        .auth-submit:disabled { opacity: 0.65; cursor: not-allowed; box-shadow: none; }

        .auth-links {
          margin-top: 24px;
          font-size: 13.5px;
        }
        .auth-links a {
          color: #2E6FAF;
          text-decoration: none;
          font-weight: 600;
        }
        .auth-links a:hover { text-decoration: underline; }

        @media (max-width: 520px) {
          .auth-card-wrap { padding: 40px 16px 60px; }
          .auth-card { padding: 32px 22px 26px; }
          .auth-title { font-size: 22px; }
        }
      `}</style>
    </>
  );
}

export default StaffMisLogin;