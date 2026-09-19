// src/pages/StudentLogin.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

function StudentLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Already-logged-in students skip straight to their dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && data.user?.role === "student") {
          navigate("/student/dashboard");
        }
      } catch {
        // Not logged in — stay on the login page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/student-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess("Login successful! Redirecting to your portal...");
        setTimeout(() => navigate("/student/dashboard"), 1000);
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="slogin-page">
        <div className="slogin-container">
          <div className="slogin-card">
            {/* Left — Form */}
            <div className="slogin-form-wrapper">
              <div className="slogin-header">
                <div className="slogin-badge">
                  <span className="slogin-badge-dot" />
                  Student Portal
                </div>
                <h1>Welcome back</h1>
                <p>Sign in to access your courses, results, and timetable.</p>
              </div>

              {error && (
                <div className="salert salert-error">
                  <span className="salert-icon">⚠️</span>
                  {error}
                </div>
              )}

              {success && (
                <div className="salert salert-success">
                  <span className="salert-icon">✅</span>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="slogin-form">
                <div className="sform-group">
                  <label htmlFor="email">Student email</label>
                  <div className="sinput-wrapper">
                    <span className="sinput-icon">📧</span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="your.name@student.haip.ac.rw"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="sform-group">
                  <label htmlFor="password">Password</label>
                  <div className="sinput-wrapper">
                    <span className="sinput-icon">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="stoggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="sform-options">
                  <label className="scheckbox-label">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/student/forgot-password" className="sforgot-link">
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" className="slogin-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="sspinner"></span>
                      Signing in...
                    </>
                  ) : (
                    "Sign in to portal"
                  )}
                </button>

                <div className="slogin-footer">
                  <p>
                    Having trouble? Contact{" "}
                    <Link to="/contact" className="sregister-link">
                      IT Support
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            {/* Right — Branding */}
            <div className="slogin-branding">
              <div className="sbranding-content">
                <div className="sbranding-logo">
                  <span className="sbranding-icon">🎓</span>
                  <h2>HAIP</h2>
                </div>
                <h3>Your student portal</h3>
                <p>
                  One place to check your courses, results, timetable, and
                  everything about your academic life at HANIKA.
                </p>
                <div className="sbranding-features">
                  <div className="sfeature-item">
                    <span>📚</span>
                    <div>
                      <strong>My Courses</strong>
                      <span>See what you're enrolled in</span>
                    </div>
                  </div>
                  <div className="sfeature-item">
                    <span>📊</span>
                    <div>
                      <strong>Results & Grades</strong>
                      <span>Track your performance</span>
                    </div>
                  </div>
                  <div className="sfeature-item">
                    <span>📅</span>
                    <div>
                      <strong>Timetable</strong>
                      <span>Never miss a class</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style>{`
        /* ============================================================
           STUDENT LOGIN STYLES
           Colors: #893C87 (primary), #6F2F6D (dark), #F3EAF2 (light)
           ============================================================ */
        .slogin-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #F3EAF2 0%, #E8DCE6 100%);
          padding: 80px 24px 40px;
        }
        .slogin-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }
        .slogin-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #FFFFFF;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(41, 20, 40, 0.15);
          min-height: 600px;
        }

        /* Left — form */
        .slogin-form-wrapper {
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
        }
        .slogin-header { margin-bottom: 28px; }
        .slogin-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: #F3EAF2;
          color: #893C87;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .slogin-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.18);
        }
        .slogin-header h1 {
          font-family: 'Fraunces', serif;
          font-size: 32px;
          font-weight: 700;
          color: #241F24;
          margin: 0 0 8px;
        }
        .slogin-header p {
          font-size: 15px;
          color: #6B646B;
          margin: 0;
        }

        /* Alerts */
        .salert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .salert-error {
          background: #FDE8E8;
          color: #C62828;
          border: 1px solid #F5C6C6;
        }
        .salert-success {
          background: #E8F5E9;
          color: #2E7D32;
          border: 1px solid #C8E6C9;
        }
        .salert-icon { font-size: 18px; }

        /* Form */
        .slogin-form { flex: 1; display: flex; flex-direction: column; }
        .sform-group { margin-bottom: 20px; }
        .sform-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #241F24;
          margin-bottom: 6px;
        }
        .sinput-wrapper { position: relative; display: flex; align-items: center; }
        .sinput-icon {
          position: absolute;
          left: 14px;
          font-size: 18px;
          color: #8A7E88;
        }
        .sinput-wrapper input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 2px solid #E1D9E0;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          background: #FBF9FA;
          color: #241F24;
        }
        .sinput-wrapper input:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 4px rgba(137, 60, 135, 0.12);
          background: #FFFFFF;
        }
        .sinput-wrapper input:disabled { opacity: 0.6; cursor: not-allowed; }
        .stoggle-password {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          color: #8A7E88;
        }
        .stoggle-password:hover { color: #241F24; }

        .sform-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .scheckbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4A444A;
          cursor: pointer;
        }
        .scheckbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #893C87;
          cursor: pointer;
        }
        .sforgot-link {
          font-size: 14px;
          color: #893C87;
          text-decoration: none;
          font-weight: 500;
        }
        .sforgot-link:hover { color: #6F2F6D; text-decoration: underline; }

        .slogin-btn {
          padding: 14px 24px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 4px;
        }
        .slogin-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.35);
        }
        .slogin-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .sspinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: sspin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes sspin { to { transform: rotate(360deg); } }

        .slogin-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #E1D9E0;
        }
        .slogin-footer p {
          font-size: 14px;
          color: #6B646B;
          margin: 0;
        }
        .sregister-link {
          color: #893C87;
          text-decoration: none;
          font-weight: 600;
        }
        .sregister-link:hover { color: #6F2F6D; text-decoration: underline; }

        /* Right — branding */
        .slogin-branding {
          background: linear-gradient(145deg, #893C87, #6F2F6D);
          padding: 48px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }
        .sbranding-content { max-width: 360px; }
        .sbranding-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .sbranding-icon { font-size: 40px; }
        .sbranding-logo h2 {
          font-family: 'Fraunces', serif;
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          color: #FFFFFF;
        }
        .sbranding-content h3 {
          font-size: 22px;
          font-weight: 600;
          line-height: 1.3;
          margin: 0 0 12px;
        }
        .sbranding-content p {
          font-size: 14.5px;
          line-height: 1.7;
          color: #EBD9E9;
          margin: 0 0 32px;
        }
        .sbranding-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sfeature-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 12px 16px;
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          backdrop-filter: blur(4px);
        }
        .sfeature-item > span { font-size: 24px; flex-shrink: 0; }
        .sfeature-item div { display: flex; flex-direction: column; }
        .sfeature-item strong {
          font-size: 14px;
          font-weight: 600;
          color: #FFFFFF;
        }
        .sfeature-item span:last-child {
          font-size: 13px;
          color: #D9BBD6;
          margin-top: 2px;
        }

        /* Responsive */
        @media (max-width: 860px) {
          .slogin-card { grid-template-columns: 1fr; }
          .slogin-branding { display: none; }
          .slogin-form-wrapper { padding: 32px 24px; }
          .slogin-header h1 { font-size: 28px; }
        }
        @media (max-width: 480px) {
          .slogin-page { padding: 60px 16px 20px; }
          .slogin-form-wrapper { padding: 24px 16px; }
          .sform-options {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .slogin-btn:hover:not(:disabled) { transform: none; }
          .sspinner { animation: none; }
        }
      `}</style>
    </>
  );
}

export default StudentLogin;