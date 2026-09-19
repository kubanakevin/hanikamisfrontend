// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

function Login() {
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

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          // Redirect to admin dashboard if already logged in
          navigate("/admin/dashboard");
        }
      } catch (err) {
        // Not logged in, stay on login page
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
    // Clear error when user types
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Login successful! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1000);
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials for testing
  const fillDemoCredentials = () => {
    setFormData({
      email: "admin@haip.edu",
      password: "password123",
      rememberMe: false,
    });
  };

  return (
    <>
      <NavBar />
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            {/* Left Side - Form */}
            <div className="login-form-wrapper">
              <div className="login-header">
                <h1>Welcome Back</h1>
                <p>Sign in to your account to continue</p>
              </div>

              {error && (
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <span className="alert-icon">✅</span>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📧</span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
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
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="login-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="login-footer">
                  <p>
                    Don't have an account?{" "}
                    <Link to="/register" className="register-link">
                      Create one
                    </Link>
                  </p>
                </div>

                {/* Demo Credentials Button - Remove in production */}
                <button
                  type="button"
                  className="demo-btn"
                  onClick={fillDemoCredentials}
                >
                  🧪 Use Demo Credentials
                </button>
              </form>
            </div>

            {/* Right Side - Branding */}
            <div className="login-branding">
              <div className="branding-content">
                <div className="branding-logo">
                  <span className="branding-icon">🎓</span>
                  <h2>HAIP</h2>
                </div>
                <h3>Welcome to Hanika Anglican Integrated Polytechnic</h3>
                <p>
                  Access your dashboard, track your progress, and stay connected
                  with your academic community.
                </p>
                <div className="branding-features">
                  <div className="feature-item">
                    <span>📚</span>
                    <div>
                      <strong>Course Management</strong>
                      <span>Access your courses and materials</span>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span>📊</span>
                    <div>
                      <strong>Track Progress</strong>
                      <span>Monitor your academic performance</span>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span>💬</span>
                    <div>
                      <strong>Stay Connected</strong>
                      <span>Communicate with instructors and peers</span>
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
           LOGIN PAGE STYLES
           Colors: #893C87 (primary), #6F2F6D (dark), #F3EAF2 (light)
           ============================================================ */

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #F3EAF2 0%, #E8DCE6 100%);
          padding: 80px 24px 40px;
        }

        .login-container {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        .login-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #FFFFFF;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(41, 20, 40, 0.15);
          min-height: 600px;
        }

        /* ===== Left Side - Form ===== */
        .login-form-wrapper {
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
        }

        .login-header {
          margin-bottom: 32px;
        }

        .login-header h1 {
          font-family: 'Fraunces', serif;
          font-size: 32px;
          font-weight: 700;
          color: #241F24;
          margin: 0 0 8px;
        }

        .login-header p {
          font-size: 15px;
          color: #6B646B;
          margin: 0;
        }

        /* Alerts */
        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .alert-error {
          background: #FDE8E8;
          color: #C62828;
          border: 1px solid #F5C6C6;
        }

        .alert-success {
          background: #E8F5E9;
          color: #2E7D32;
          border: 1px solid #C8E6C9;
        }

        .alert-icon {
          font-size: 18px;
        }

        /* Form */
        .login-form {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #241F24;
          margin-bottom: 6px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          font-size: 18px;
          color: #8A7E88;
        }

        .input-wrapper input {
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

        .input-wrapper input:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 4px rgba(137, 60, 135, 0.1);
          background: #FFFFFF;
        }

        .input-wrapper input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .toggle-password {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          color: #8A7E88;
          transition: color 0.15s ease;
        }

        .toggle-password:hover {
          color: #241F24;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4A444A;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #893C87;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 14px;
          color: #893C87;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .forgot-link:hover {
          color: #6F2F6D;
          text-decoration: underline;
        }

        .login-btn {
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

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Spinner */
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #E1D9E0;
        }

        .login-footer p {
          font-size: 14px;
          color: #6B646B;
          margin: 0;
        }

        .register-link {
          color: #893C87;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.15s ease;
        }

        .register-link:hover {
          color: #6F2F6D;
          text-decoration: underline;
        }

        .demo-btn {
          margin-top: 12px;
          padding: 8px 16px;
          background: transparent;
          color: #6B646B;
          border: 1px dashed #E1D9E0;
          border-radius: 6px;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .demo-btn:hover {
          background: #F3EAF2;
          border-color: #893C87;
          color: #893C87;
        }

        /* ===== Right Side - Branding ===== */
        .login-branding {
          background: linear-gradient(145deg, #893C87, #6F2F6D);
          padding: 48px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }

        .branding-content {
          max-width: 360px;
        }

        .branding-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .branding-icon {
          font-size: 40px;
        }

        .branding-logo h2 {
          font-family: 'Fraunces', serif;
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          color: #FFFFFF;
        }

        .branding-content h3 {
          font-size: 22px;
          font-weight: 600;
          line-height: 1.3;
          margin: 0 0 12px;
          color: #FFFFFF;
        }

        .branding-content p {
          font-size: 14.5px;
          line-height: 1.7;
          color: #EBD9E9;
          margin: 0 0 32px;
        }

        .branding-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 12px 16px;
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          backdrop-filter: blur(4px);
        }

        .feature-item > span {
          font-size: 24px;
          flex-shrink: 0;
        }

        .feature-item div {
          display: flex;
          flex-direction: column;
        }

        .feature-item strong {
          font-size: 14px;
          font-weight: 600;
          color: #FFFFFF;
        }

        .feature-item span:last-child {
          font-size: 13px;
          color: #D9BBD6;
          margin-top: 2px;
        }

        /* ===== Responsive ===== */
        @media (max-width: 860px) {
          .login-card {
            grid-template-columns: 1fr;
          }

          .login-branding {
            display: none;
          }

          .login-form-wrapper {
            padding: 32px 24px;
          }

          .login-header h1 {
            font-size: 28px;
          }
        }

        @media (max-width: 480px) {
          .login-page {
            padding: 60px 16px 20px;
          }

          .login-form-wrapper {
            padding: 24px 16px;
          }

          .form-options {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .login-btn:hover:not(:disabled) {
            transform: none;
          }

          .spinner {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

export default Login;