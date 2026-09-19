// src/pages/admin/Profile.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const formatDate = (value) => {
  if (!value) return "—";
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

const ROLE_LABELS = {
  super_manager: "Super Manager",
  department_manager: "Department Manager",
  staff: "Staff",
  viewer: "Viewer",
};

const roleLabel = (role) => ROLE_LABELS[role] || role || "—";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [profile, setProfile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "password"

  // Info form
  const [infoForm, setInfoForm] = useState({
    full_name: "",
    email: "",
    department_id: "",
  });
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [infoSuccess, setInfoSuccess] = useState("");

  // Password form
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // ---------- Init ----------
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          await Promise.all([fetchProfile(), fetchDepartments()]);
        } else {
          navigate("/login");
        }
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    init();

    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);

  // ---------- Fetchers ----------
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/profile`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setInfoForm({
          full_name: data.data.full_name || "",
          email: data.data.email || "",
          department_id: data.data.department_id || "",
        });
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/profile/departments`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setDepartments(data.data || []);
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  // ---------- Handlers ----------
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setInfoForm((prev) => ({ ...prev, [name]: value }));
    if (infoError) setInfoError("");
    if (infoSuccess) setInfoSuccess("");
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoLoading(true);
    setInfoError("");
    setInfoSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: infoForm.full_name,
          email: infoForm.email,
          department_id: infoForm.department_id || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInfoSuccess("Profile updated successfully.");
        await fetchProfile();
        setTimeout(() => setInfoSuccess(""), 2500);
      } else {
        setInfoError(data.error || "Failed to update profile");
      }
    } catch {
      setInfoError("Network error. Please try again.");
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
    if (pwError) setPwError("");
    if (pwSuccess) setPwSuccess("");
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    setPwSuccess("");

    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError("New password and confirmation do not match.");
      setPwLoading(false);
      return;
    }

    if (pwForm.new_password.length < 6) {
      setPwError("New password must be at least 6 characters.");
      setPwLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/profile/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(pwForm),
      });
      const data = await res.json();
      if (data.success) {
        setPwSuccess("Password changed successfully.");
        setPwForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        setTimeout(() => setPwSuccess(""), 2500);
      } else {
        setPwError(data.error || "Failed to change password");
      }
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="admin-layout">
      <AdminHeader
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className={`admin-main ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1>My Profile</h1>
              <p className="page-subtitle">
                Manage your account information and password
              </p>
            </div>
          </div>

          {/* Identity card */}
          <section className="profile-card">
            <div className="profile-identity">
              <div className="profile-avatar" aria-hidden="true">
                {getInitials(profile?.full_name)}
              </div>
              <div className="profile-identity-info">
                <h2 className="profile-name">
                  {profile?.full_name || "(no name)"}
                </h2>
                <p className="profile-email">{profile?.email}</p>
                <div className="profile-meta-row">
                  <span className={`role-badge role-${profile?.role || "staff"}`}>
                    {roleLabel(profile?.role)}
                  </span>
                  {profile?.department_name && (
                    <span className="profile-dept-tag">
                      🏛️ {profile.department_name}
                    </span>
                  )}
                  {profile?.is_active === 0 && (
                    <span className="profile-inactive-tag">Inactive</span>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-label">Member since</span>
                <span className="profile-stat-value">
                  {formatDate(profile?.created_at)}
                </span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-label">Last login</span>
                <span className="profile-stat-value">
                  {profile?.last_login
                    ? formatDateTime(profile.last_login)
                    : "First time here"}
                </span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-label">Last updated</span>
                <span className="profile-stat-value">
                  {formatDateTime(profile?.updated_at)}
                </span>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              type="button"
              className={`profile-tab ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              Profile info
            </button>
            <button
              type="button"
              className={`profile-tab ${activeTab === "password" ? "active" : ""}`}
              onClick={() => setActiveTab("password")}
            >
              Password
            </button>
          </div>

          {/* Info tab */}
          {activeTab === "info" && (
            <section className="profile-form-card">
              <h3 className="profile-form-title">Account information</h3>
              <p className="profile-form-sub">
                You can update your name, email, and department. Role and
                status are managed by a super manager.
              </p>

              {infoError && <div className="form-error">{infoError}</div>}
              {infoSuccess && <div className="form-success">{infoSuccess}</div>}

              <form onSubmit={handleInfoSubmit} className="profile-form">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="pf-full_name">Full name</label>
                    <input
                      id="pf-full_name"
                      name="full_name"
                      type="text"
                      value={infoForm.full_name}
                      onChange={handleInfoChange}
                      required
                      placeholder="Your name"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="pf-email">Email</label>
                    <input
                      id="pf-email"
                      name="email"
                      type="email"
                      value={infoForm.email}
                      onChange={handleInfoChange}
                      required
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="pf-department">Department</label>
                    <select
                      id="pf-department"
                      name="department_id"
                      value={infoForm.department_id}
                      onChange={handleInfoChange}
                    >
                      <option value="">None</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="profile-btn-secondary"
                    onClick={() => {
                      if (profile) {
                        setInfoForm({
                          full_name: profile.full_name || "",
                          email: profile.email || "",
                          department_id: profile.department_id || "",
                        });
                        setInfoError("");
                        setInfoSuccess("");
                      }
                    }}
                    disabled={infoLoading}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={infoLoading}
                  >
                    {infoLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Password tab */}
          {activeTab === "password" && (
            <section className="profile-form-card">
              <h3 className="profile-form-title">Change password</h3>
              <p className="profile-form-sub">
                Enter your current password, then choose a new one (at least 6
                characters).
              </p>

              {pwError && <div className="form-error">{pwError}</div>}
              {pwSuccess && <div className="form-success">{pwSuccess}</div>}

              <form onSubmit={handlePwSubmit} className="profile-form">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="pf-current">Current password</label>
                    <div className="input-with-toggle">
                      <input
                        id="pf-current"
                        name="current_password"
                        type={showPasswords ? "text" : "password"}
                        value={pwForm.current_password}
                        onChange={handlePwChange}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="pf-new">New password</label>
                    <input
                      id="pf-new"
                      name="new_password"
                      type={showPasswords ? "text" : "password"}
                      value={pwForm.new_password}
                      onChange={handlePwChange}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="pf-confirm">Confirm new password</label>
                    <input
                      id="pf-confirm"
                      name="confirm_password"
                      type={showPasswords ? "text" : "password"}
                      value={pwForm.confirm_password}
                      onChange={handlePwChange}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={showPasswords}
                        onChange={(e) => setShowPasswords(e.target.checked)}
                      />
                      Show passwords
                    </label>
                  </div>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="profile-btn-secondary"
                    onClick={() => {
                      setPwForm({
                        current_password: "",
                        new_password: "",
                        confirm_password: "",
                      });
                      setPwError("");
                      setPwSuccess("");
                    }}
                    disabled={pwLoading}
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={pwLoading}
                  >
                    {pwLoading ? "Saving..." : "Change Password"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </main>

      <style>{`
        /* ===== Loading ===== */
        .loading-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
        }
        .loading-page .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #F3EAF2;
          border-top-color: #893C87;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ===== Layout ===== */
        .admin-layout { min-height: 100vh; background: #F8F5F7; }
        .admin-main {
          padding: 24px;
          margin-top: 64px;
          margin-left: 250px;
          transition: margin-left 0.28s ease;
          min-height: calc(100vh - 64px);
        }
        .admin-main.sidebar-closed { margin-left: 0; }
        .page-container { max-width: 960px; margin: 0 auto; }

        /* ===== Header ===== */
        .page-header { margin-bottom: 24px; }
        .page-header h1 {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .page-subtitle { font-size: 14px; color: #6B646B; margin: 4px 0 0; }

        /* ===== Identity card ===== */
        .profile-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .profile-identity {
          display: flex;
          gap: 22px;
          align-items: center;
          padding: 28px 30px;
          background: linear-gradient(135deg, #F3EAF2 0%, #FAF6FA 100%);
          border-bottom: 1px solid #E1D9E0;
        }
        .profile-avatar {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.28);
        }
        .profile-identity-info { min-width: 0; flex: 1; }
        .profile-name {
          font-family: 'Fraunces', serif;
          font-size: 24px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 4px;
          line-height: 1.2;
        }
        .profile-email {
          font-size: 14px;
          color: #6B646B;
          margin: 0 0 12px;
          word-break: break-all;
        }
        .profile-meta-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .role-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .role-super_manager { background: #FDE8E8; color: #C62828; }
        .role-department_manager { background: #FFF3E0; color: #E65100; }
        .role-staff { background: #E3F2FD; color: #1565C0; }
        .role-viewer { background: #F1EDF0; color: #6B646B; }
        .profile-dept-tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          color: #4A444A;
          font-size: 12px;
          font-weight: 500;
        }
        .profile-inactive-tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          background: #FDE8E8;
          color: #C62828;
          font-size: 12px;
          font-weight: 600;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        .profile-stat {
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-right: 1px solid #E1D9E0;
        }
        .profile-stat:last-child { border-right: none; }
        .profile-stat-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #8A7E88;
        }
        .profile-stat-value {
          font-size: 14px;
          color: #241F24;
          font-weight: 500;
        }

        /* ===== Tabs ===== */
        .profile-tabs {
          display: flex;
          gap: 4px;
          background: #FFFFFF;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #E1D9E0;
          margin-bottom: 20px;
          width: fit-content;
        }
        .profile-tab {
          padding: 10px 22px;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #6B646B;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .profile-tab:hover { background: #F3EAF2; color: #4A444A; }
        .profile-tab.active {
          background: #893C87;
          color: #FFFFFF;
        }
        .profile-tab.active:hover { background: #6F2F6D; }

        /* ===== Form card ===== */
        .profile-form-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 28px 30px;
        }
        .profile-form-title {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 6px;
        }
        .profile-form-sub {
          font-size: 14px;
          color: #6B646B;
          margin: 0 0 22px;
          line-height: 1.55;
        }

        .profile-form .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .profile-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .profile-form .form-group.full-width { grid-column: 1 / -1; }
        .profile-form label {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .profile-form input,
        .profile-form select {
          padding: 10px 12px;
          border: 1px solid #E1D9E0;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          background: #FFFFFF;
          color: #241F24;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .profile-form input:focus,
        .profile-form select:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.1);
        }
        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 500 !important;
          cursor: pointer;
          color: #4A444A;
        }
        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #893C87;
          cursor: pointer;
        }

        .profile-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 22px;
          margin-top: 22px;
          border-top: 1px solid #E1D9E0;
        }

        .profile-btn-primary {
          padding: 10px 24px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .profile-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .profile-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .profile-btn-secondary {
          padding: 10px 24px;
          background: #E1D9E0;
          color: #4A444A;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .profile-btn-secondary:hover:not(:disabled) { background: #D1C9D0; }
        .profile-btn-secondary:disabled { opacity: 0.7; cursor: not-allowed; }

        .form-error {
          padding: 10px 14px;
          background: #FDE8E8;
          color: #C62828;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .form-success {
          padding: 10px 14px;
          background: #E8F5E9;
          color: #2E7D32;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* ===== Responsive ===== */
        @media (max-width: 1023px) {
          .admin-main { margin-left: 0 !important; }
        }
        @media (max-width: 768px) {
          .admin-main { padding: 16px; }
          .profile-identity {
            flex-direction: column;
            text-align: center;
            padding: 24px 20px;
          }
          .profile-meta-row { justify-content: center; }
          .profile-stats { grid-template-columns: 1fr; }
          .profile-stat {
            border-right: none;
            border-bottom: 1px solid #E1D9E0;
          }
          .profile-stat:last-child { border-bottom: none; }
          .profile-form .form-grid { grid-template-columns: 1fr; }
          .profile-form-actions { flex-direction: column-reverse; }
          .profile-form-actions button { width: 100%; }
          .profile-form-card { padding: 22px 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-main,
          .profile-btn-primary,
          .profile-btn-secondary { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

export default Profile;