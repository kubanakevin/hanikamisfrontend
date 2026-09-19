// src/pages/admin/Messages.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function Messages() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [filter, setFilter] = useState("all"); // all | unread | archived
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState({ total: 0, unread: 0, archived: 0 });
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          await fetchMessages("all");
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

  const fetchMessages = async (f) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/contact/messages?filter=${f}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
        setCounts(data.counts || { total: 0, unread: 0, archived: 0 });
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleFilterChange = (f) => {
    setFilter(f);
    fetchMessages(f);
  };

  const openMessage = async (msg) => {
    setSelected(msg);
    // Auto-mark as read if not yet read
    if (!msg.is_read) {
      try {
        await fetch(
          `${API_BASE}/api/admin/contact/messages/${msg.id}/read`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ is_read: true }),
          }
        );
        // Update local state and counts
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: 1 } : m))
        );
        setCounts((c) => ({
          ...c,
          unread: Math.max(0, (c.unread || 1) - 1),
        }));
        setSelected({ ...msg, is_read: 1 });
      } catch (err) {
        console.error("Mark read error:", err);
      }
    }
  };

  const toggleArchive = async (msg) => {
    const nextArchived = msg.is_archived ? 0 : 1;
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/contact/messages/${msg.id}/archive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ is_archived: !!nextArchived }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setSelected(null);
        await fetchMessages(filter);
      }
    } catch (err) {
      console.error("Archive error:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/contact/messages/${deleteConfirm}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setDeleteConfirm(null);
        setSelected(null);
        await fetchMessages(filter);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

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
              <h1>Messages</h1>
              <p className="page-subtitle">
                Contact form submissions from the public site
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="msg-tabs">
            <button
              className={`msg-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => handleFilterChange("all")}
            >
              Inbox
              <span className="tab-count">{counts.total}</span>
            </button>
            <button
              className={`msg-tab ${filter === "unread" ? "active" : ""}`}
              onClick={() => handleFilterChange("unread")}
            >
              Unread
              <span className="tab-count accent">{counts.unread}</span>
            </button>
            <button
              className={`msg-tab ${filter === "archived" ? "active" : ""}`}
              onClick={() => handleFilterChange("archived")}
            >
              Archived
              <span className="tab-count">{counts.archived}</span>
            </button>
          </div>

          <div className="msg-table-container">
            {loadingMessages ? (
              <div className="msg-loading">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="msg-empty">
                <span className="empty-icon">💬</span>
                <p>
                  {filter === "unread"
                    ? "No unread messages."
                    : filter === "archived"
                    ? "No archived messages."
                    : "No messages yet."}
                </p>
              </div>
            ) : (
              <table className="msg-table">
                <thead>
                  <tr>
                    <th style={{ width: 20 }}></th>
                    <th>From</th>
                    <th>Subject</th>
                    <th>Received</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr
                      key={m.id}
                      className={`msg-row ${!m.is_read ? "unread" : ""}`}
                      onClick={() => openMessage(m)}
                    >
                      <td>
                        <span
                          className={`unread-dot ${!m.is_read ? "on" : ""}`}
                        />
                      </td>
                      <td>
                        <div className="msg-from">
                          <strong>{m.full_name}</strong>
                          <span className="msg-email">{m.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="msg-subject">
                          <span className="subject-line">
                            {m.subject || "(no subject)"}
                          </span>
                          <span className="subject-preview">
                            {m.message?.slice(0, 80)}
                            {m.message?.length > 80 ? "…" : ""}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="msg-date">
                          {formatDate(m.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="msg-actions">
                          <button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleArchive(m);
                            }}
                            title={m.is_archived ? "Unarchive" : "Archive"}
                          >
                            {m.is_archived ? "📤" : "📥"}
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(m.id);
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* View modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="msg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msg-modal-head">
              <h2>{selected.subject || "(no subject)"}</h2>
              <button
                className="msg-modal-close"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>
            <div className="msg-modal-body">
              <div className="msg-meta-grid">
                <div>
                  <span className="meta-label">From</span>
                  <span className="meta-value">{selected.full_name}</span>
                </div>
                <div>
                  <span className="meta-label">Email</span>
                  <a
                    href={`mailto:${selected.email}`}
                    className="meta-value"
                  >
                    {selected.email}
                  </a>
                </div>
                {selected.phone && (
                  <div>
                    <span className="meta-label">Phone</span>
                    <a
                      href={`tel:${selected.phone}`}
                      className="meta-value"
                    >
                      {selected.phone}
                    </a>
                  </div>
                )}
                <div>
                  <span className="meta-label">Received</span>
                  <span className="meta-value">
                    {formatDate(selected.created_at)}
                  </span>
                </div>
              </div>

              <div className="msg-content">
                <p style={{ whiteSpace: "pre-line" }}>{selected.message}</p>
              </div>
            </div>
            <div className="msg-modal-actions">
              <button
                className="gallery-btn-secondary"
                onClick={() => toggleArchive(selected)}
              >
                {selected.is_archived ? "Move to Inbox" : "Archive"}
              </button>
              <a
                className="gallery-btn-primary"
                href={`mailto:${selected.email}?subject=Re: ${
                  selected.subject || "Your message"
                }`}
              >
                Reply by Email
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="msg-modal msg-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="msg-modal-head">
              <h2>Confirm Delete</h2>
              <button
                className="msg-modal-close"
                onClick={() => setDeleteConfirm(null)}
              >
                ×
              </button>
            </div>
            <div className="msg-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this message?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="msg-modal-actions">
              <button
                className="gallery-btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="gallery-btn-danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
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

        .admin-layout {
          min-height: 100vh;
          background: #F8F5F7;
        }
        .admin-main {
          padding: 24px;
          margin-top: 64px;
          margin-left: 250px;
          transition: margin-left 0.28s ease;
          min-height: calc(100vh - 64px);
        }
        .admin-main.sidebar-closed { margin-left: 0; }
        .page-container { max-width: 1300px; margin: 0 auto; }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .page-header h1 {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .page-subtitle { font-size: 14px; color: #6B646B; margin: 4px 0 0; }

        .msg-tabs {
          display: flex;
          gap: 4px;
          background: #FFFFFF;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #E1D9E0;
          margin-bottom: 20px;
          width: fit-content;
        }
        .msg-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #6B646B;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .msg-tab:hover { background: #F3EAF2; color: #4A444A; }
        .msg-tab.active { background: #893C87; color: #FFFFFF; }
        .msg-tab.active:hover { background: #6F2F6D; }
        .tab-count {
          background: rgba(0,0,0,0.08);
          padding: 1px 8px;
          border-radius: 999px;
          font-size: 12px;
        }
        .msg-tab.active .tab-count {
          background: rgba(255,255,255,0.25);
          color: #FFFFFF;
        }
        .tab-count.accent { background: #FFE4E4; color: #C62828; }
        .msg-tab.active .tab-count.accent { background: rgba(255,255,255,0.3); color: #FFFFFF; }

        .msg-table-container {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 12px;
          overflow: hidden;
        }
        .msg-loading, .msg-empty {
          padding: 60px 20px;
          text-align: center;
          color: #6B646B;
          font-size: 15px;
        }
        .msg-empty .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 10px;
        }

        .msg-table {
          width: 100%;
          border-collapse: collapse;
        }
        .msg-table thead {
          background: #F8F5F7;
        }
        .msg-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #6B646B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E1D9E0;
        }
        .msg-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #E1D9E0;
          font-size: 14px;
          color: #241F24;
          vertical-align: top;
        }
        .msg-table tr:last-child td { border-bottom: none; }
        .msg-row { cursor: pointer; transition: background 0.15s ease; }
        .msg-row:hover { background: #FBF9FA; }
        .msg-row.unread { background: #FBF2FA; }
        .msg-row.unread:hover { background: #F6E7F4; }

        .unread-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: transparent;
          margin-top: 6px;
        }
        .unread-dot.on { background: #893C87; }

        .msg-from strong {
          display: block;
          font-size: 14px;
          color: #241F24;
          margin-bottom: 2px;
        }
        .msg-email {
          font-size: 12px;
          color: #8A7E88;
        }
        .msg-subject .subject-line {
          display: block;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .msg-subject .subject-preview {
          display: block;
          font-size: 13px;
          color: #6B646B;
        }
        .msg-date {
          font-size: 13px;
          color: #6B646B;
          white-space: nowrap;
        }

        .msg-actions {
          display: flex;
          gap: 4px;
        }
        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-btn:hover { background: #F3EAF2; transform: scale(1.08); }
        .action-btn.delete:hover { background: #FDE8E8; }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(41, 20, 40, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .msg-modal {
          background: #FFFFFF;
          border-radius: 16px;
          max-width: 720px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.25s ease;
        }
        .msg-modal-sm { max-width: 460px; }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .msg-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #E1D9E0;
          position: sticky;
          top: 0;
          background: #FFFFFF;
          z-index: 1;
        }
        .msg-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: #241F24;
        }
        .msg-modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          font-size: 24px;
          color: #8A7E88;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .msg-modal-close:hover { color: #241F24; }

        .msg-modal-body { padding: 24px; }

        .msg-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #E1D9E0;
          margin-bottom: 20px;
        }
        .meta-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #8A7E88;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 4px;
        }
        .meta-value {
          font-size: 14px;
          color: #241F24;
          text-decoration: none;
        }
        a.meta-value:hover { color: #893C87; text-decoration: underline; }

        .msg-content {
          font-size: 15px;
          line-height: 1.7;
          color: #241F24;
        }
        .msg-content p { margin: 0; }

        .msg-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #E1D9E0;
          flex-wrap: wrap;
        }

        .delete-icon {
          font-size: 48px;
          text-align: center;
          display: block;
          margin-bottom: 12px;
        }
        .msg-modal-body p {
          text-align: center;
          font-size: 15px;
          color: #4A444A;
          margin: 6px 0;
        }
        .delete-warning {
          color: #C62828 !important;
          font-size: 13px !important;
        }

        .gallery-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 24px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .gallery-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .gallery-btn-secondary {
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
        .gallery-btn-secondary:hover:not(:disabled) { background: #D1C9D0; }
        .gallery-btn-secondary:disabled { opacity: 0.7; cursor: not-allowed; }

        .gallery-btn-danger {
          padding: 10px 24px;
          background: #C62828;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .gallery-btn-danger:hover:not(:disabled) { background: #B71C1C; }
        .gallery-btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }

        @media (max-width: 1023px) {
          .admin-main { margin-left: 0 !important; }
        }
        @media (max-width: 768px) {
          .admin-main { padding: 16px; }
          .msg-table th:nth-child(3),
          .msg-table td:nth-child(3) { display: none; }
          .msg-meta-grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-main, .msg-modal { transition: none; animation: none; }
        }
      `}</style>
    </div>
  );
}

export default Messages;