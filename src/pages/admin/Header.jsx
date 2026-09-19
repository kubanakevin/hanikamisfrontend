// src/pages/admin/Header.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

/* ============================================================
   NAVIGATION — just add/remove one line per page.
   That's it. No sections, no nesting, no headaches.
   ============================================================ */
const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", path: "/admin/dashboard" },
  { icon: "👤", label: "Users", path: "/admin/users" },
  { icon: "🖼️", label: "Hero Banners", path: "/admin/hero-banners" },
  { icon: "📝", label: "Announcements", path: "/admin/announcements" },
  { icon: "ℹ️", label: "About", path: "/admin/about" },
  { icon: "❓", label: "Why Choose Us", path: "/admin/why-choose" },
  { icon: "📢", label: "CTA", path: "/admin/cta" },
  { icon: "📞", label: "Contact Info", path: "/admin/contact-info" },
  { icon: "📚", label: "Departments", path: "/admin/departments" },
  { icon: "📚", label: "Programs", path: "/admin/programs" },
  { icon: "📰", label: "News", path: "/admin/news" },
  { icon: "🎉", label: "Events", path: "/admin/events" },
  { icon: "🖼️", label: "Gallery", path: "/admin/gallery" },
  { icon: "🤖", label: "AI Assistant", path: "/admin/ai-assistant" },
  { icon: "💬", label: "Messages", path: "/admin/messages" },
  { icon: "📊", label: "Website Visitors", path: "/admin/visitors" },
  { icon: "👤", label: "My Profile", path: "/admin/profile" },
];

function AdminHeader({ user, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <>
      {/* ===== TOP BAR ===== */}
      <header className="admin-header">
        <div className="admin-header-left">
          <button
            className="admin-header-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <Link to="/admin/dashboard" className="admin-header-brand">
            <span className="brand-mark">◆</span>
            <span className="brand-text">Admin Panel</span>
          </Link>
        </div>

        <div className="admin-header-right" ref={dropdownRef}>
          <button
            className="admin-header-user"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className="user-avatar">{getInitials(user?.name || user?.email)}</span>
            <span className="user-info">
              <span className="user-name">{user?.name || "Admin"}</span>
              <span className="user-role">{user?.role || "Administrator"}</span>
            </span>
            <span className={`user-caret ${dropdownOpen ? "open" : ""}`}>▾</span>
          </button>

          {dropdownOpen && (
            <div className="admin-header-dropdown">
              <div className="dropdown-header">
                <span className="user-avatar lg">{getInitials(user?.name || user?.email)}</span>
                <div>
                  <div className="dropdown-name">{user?.name || "Admin"}</div>
                  <div className="dropdown-email">{user?.email || ""}</div>
                </div>
              </div>
              <div className="dropdown-divider" />
              <Link to="/admin/profile" className="dropdown-item">
                <span>👤</span> My Profile
              </Link>
              <Link to="/" className="dropdown-item">
                <span>🌐</span> View Site
              </Link>

              <button className="dropdown-item danger" onClick={handleLogout}>
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ===== SIDEBAR ===== */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <nav className="sidebar-nav">
          <span className="section-label">Navigation</span>
          <ul className="sidebar-menu">
            {NAV_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`sidebar-link ${isActive ? "active" : ""}`}
                    onClick={closeOnMobile}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    <span className="sidebar-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile overlay when sidebar open */}
      {sidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <style>{`
        /* ===== Top Bar ===== */
        .admin-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: #FFFFFF;
          border-bottom: 1px solid #E1D9E0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 100;
        }
        .admin-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .admin-header-toggle {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          font-size: 20px;
          cursor: pointer;
          border-radius: 8px;
          color: #4A444A;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
        }
        .admin-header-toggle:hover {
          background: #F3EAF2;
          color: #893C87;
        }
        .admin-header-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #241F24;
        }
        .brand-mark {
          color: #893C87;
          font-size: 20px;
        }
        .brand-text {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 600;
        }

        .admin-header-right {
          position: relative;
        }
        .admin-header-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .admin-header-user:hover {
          background: #F3EAF2;
          border-color: #E1D9E0;
        }
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .user-avatar.lg {
          width: 44px;
          height: 44px;
          font-size: 15px;
        }
        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
        }
        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .user-role {
          font-size: 11px;
          color: #8A7E88;
        }
        .user-caret {
          font-size: 10px;
          color: #8A7E88;
          transition: transform 0.15s ease;
        }
        .user-caret.open {
          transform: rotate(180deg);
        }

        /* ===== Dropdown ===== */
        .admin-header-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 260px;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(41, 20, 40, 0.12);
          overflow: hidden;
          animation: dropdownIn 0.15s ease;
          z-index: 200;
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
        }
        .dropdown-name {
          font-size: 14px;
          font-weight: 600;
          color: #241F24;
        }
        .dropdown-email {
          font-size: 12px;
          color: #8A7E88;
          word-break: break-all;
        }
        .dropdown-divider {
          height: 1px;
          background: #E1D9E0;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          text-align: left;
          font-size: 14px;
          color: #4A444A;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s ease;
          font-family: inherit;
        }
        .dropdown-item:hover {
          background: #F3EAF2;
          color: #893C87;
        }
        .dropdown-item.danger:hover {
          background: #FDE8E8;
          color: #C62828;
        }

        /* ===== Sidebar ===== */
        .admin-sidebar {
          position: fixed;
          top: 64px;
          left: 0;
          bottom: 0;
          width: 260px;
          background: #FFFFFF;
          border-right: 1px solid #E1D9E0;
          overflow-y: auto;
          transition: transform 0.3s ease;
          z-index: 90;
          padding: 16px 12px 24px;
        }
        .admin-sidebar.closed {
          transform: translateX(-100%);
        }
        .admin-sidebar.open {
          transform: translateX(0);
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .section-label {
          font-size: 10px;
          font-weight: 700;
          color: #8A7E88;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 0 12px 8px;
        }
        .sidebar-menu {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #4A444A;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .sidebar-link:hover {
          background: #F3EAF2;
          color: #893C87;
        }
        .sidebar-link.active {
          background: #F3EAF2;
          color: #893C87;
          font-weight: 600;
        }
        .sidebar-icon {
          font-size: 18px;
          width: 24px;
          text-align: center;
          flex-shrink: 0;
        }
        .sidebar-label {
          flex: 1;
        }

        /* Mobile overlay */
        .admin-sidebar-overlay {
          position: fixed;
          inset: 64px 0 0 0;
          background: rgba(41, 20, 40, 0.4);
          z-index: 80;
          display: none;
        }

        /* ===== Responsive ===== */
        @media (max-width: 1023px) {
          .admin-sidebar {
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-sidebar-overlay {
            display: block;
          }
          .user-info {
            display: none;
          }
        }
        @media (min-width: 1024px) {
          .admin-sidebar-overlay {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .brand-text {
            display: none;
          }
          .admin-header-dropdown {
            width: 220px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-sidebar,
          .admin-header-dropdown {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </>
  );
}

export default AdminHeader;