// src/pages/admin/Announcements.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyAnnouncement = {
  title: "",
  content: "",
  priority: 0,
  start_date: "",
  expiry_date: "",
  is_active: true,
};

function Announcements() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState(emptyAnnouncement);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          await fetchAnnouncements();
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setAnnouncements(data.data);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    }
  };

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormData(emptyAnnouncement);
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title || "",
      content: announcement.content || "",
      priority: announcement.priority || 0,
      start_date: announcement.start_date ? announcement.start_date.slice(0, 16) : "",
      expiry_date: announcement.expiry_date ? announcement.expiry_date.slice(0, 16) : "",
      is_active: announcement.is_active === 1 || announcement.is_active === true,
    });
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFormSuccess("");

    try {
      const url = editingAnnouncement
        ? `${API_BASE}/api/admin/announcements/${editingAnnouncement.id}`
        : `${API_BASE}/api/admin/announcements`;
      const method = editingAnnouncement ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess(editingAnnouncement ? "Announcement updated successfully!" : "Announcement created successfully!");
        await fetchAnnouncements();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess("");
          setFormData(emptyAnnouncement);
        }, 1500);
      } else {
        setFormError(data.error || "Failed to save announcement");
      }
    } catch (err) {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements/${deleteConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchAnnouncements();
        setDeleteConfirm(null);
      } else {
        alert(data.error || "Failed to delete announcement");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements/${id}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAnnouncements();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 3) return { label: "High", class: "priority-high" };
    if (priority >= 2) return { label: "Medium", class: "priority-medium" };
    return { label: "Low", class: "priority-low" };
  };

  const truncateText = (text, maxLength = 80) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isActive = (announcement) => {
    if (!announcement.is_active) return false;
    if (announcement.start_date && new Date(announcement.start_date) > new Date()) return false;
    if (announcement.expiry_date && new Date(announcement.expiry_date) < new Date()) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="announcement-loading-page">
        <div className="announcement-loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="announcement-admin-layout">
      <AdminHeader user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`announcement-admin-main ${sidebarOpen ? "announcement-sidebar-open" : "announcement-sidebar-closed"}`}>
        <div className="announcement-page-container">
          <div className="announcement-page-header">
            <div>
              <h1>Announcements</h1>
              <p className="announcement-page-subtitle">Manage all announcements displayed on the website</p>
            </div>
            <button className="announcement-btn-primary" onClick={openCreateModal}>
              + Add New Announcement
            </button>
          </div>

          <div className="announcement-stats-summary">
            <div className="announcement-stat-box">
              <span className="announcement-stat-number">{announcements.length}</span>
              <span className="announcement-stat-label">Total</span>
            </div>
            <div className="announcement-stat-box">
              <span className="announcement-stat-number">
                {announcements.filter((a) => isActive(a)).length}
              </span>
              <span className="announcement-stat-label">Active</span>
            </div>
            <div className="announcement-stat-box">
              <span className="announcement-stat-number">
                {announcements.filter((a) => !a.is_active).length}
              </span>
              <span className="announcement-stat-label">Inactive</span>
            </div>
            <div className="announcement-stat-box">
              <span className="announcement-stat-number">
                {announcements.filter((a) => isExpired(a.expiry_date)).length}
              </span>
              <span className="announcement-stat-label">Expired</span>
            </div>
          </div>

          <div className="announcement-table-container">
            <table className="announcement-data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Content</th>
                  <th>Priority</th>
                  <th>Start Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="announcement-empty-state">
                      <span className="announcement-empty-icon">📝</span>
                      <p>No announcements found. Click "Add New Announcement" to create one.</p>
                    </td>
                  </tr>
                ) : (
                  announcements.map((announcement) => {
                    const priorityInfo = getPriorityLabel(announcement.priority);
                    const active = isActive(announcement);
                    const expired = isExpired(announcement.expiry_date);

                    return (
                      <tr key={announcement.id}>
                        <td>
                          <div className="announcement-info">
                            <strong>{announcement.title}</strong>
                            {announcement.priority >= 3 && (
                              <span className="announcement-badge">Urgent</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="announcement-content-text">
                            {truncateText(announcement.content, 50)}
                          </span>
                        </td>
                        <td>
                          <span className={`announcement-priority ${priorityInfo.class}`}>
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td>
                          <div className="announcement-date-info">
                            {announcement.start_date ? formatDate(announcement.start_date) : "N/A"}
                          </div>
                        </td>
                        <td>
                          <div className="announcement-date-info">
                            {announcement.expiry_date ? formatDate(announcement.expiry_date) : "Never"}
                            {expired && <span className="announcement-expired-badge">Expired</span>}
                          </div>
                        </td>
                        <td>
                          <button
                            className={`announcement-status-toggle ${active ? "announcement-active" : "announcement-inactive"}`}
                            onClick={() => toggleActive(announcement.id, announcement.is_active)}
                          >
                            {active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <div className="announcement-action-buttons">
                            <button
                              className="announcement-action-btn announcement-view"
                              onClick={() => setViewingAnnouncement(announcement)}
                              title="View"
                            >
                              👁️
                            </button>
                            <button
                              className="announcement-action-btn announcement-edit"
                              onClick={() => openEditModal(announcement)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="announcement-action-btn announcement-delete"
                              onClick={() => setDeleteConfirm(announcement.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ===== ANNOUNCEMENT MODAL ===== */}
      {showModal && (
        <div className="announcement-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="announcement-modal announcement-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="announcement-modal-head">
              <h2>{editingAnnouncement ? "Edit Announcement" : "Add New Announcement"}</h2>
              <button className="announcement-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="announcement-modal-form">
              {formError && <div className="announcement-form-error">{formError}</div>}
              {formSuccess && <div className="announcement-form-success">{formSuccess}</div>}

              <div className="announcement-form-grid">
                <div className="announcement-form-group announcement-full-width">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Important Update: School Holiday Schedule"
                  />
                </div>

                <div className="announcement-form-group announcement-full-width">
                  <label htmlFor="content">Content</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Full announcement content..."
                  />
                </div>

                <div className="announcement-form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="0">Low</option>
                    <option value="1">Low</option>
                    <option value="2">Medium</option>
                    <option value="3">High</option>
                    <option value="4">High</option>
                  </select>
                  <small className="announcement-hint">Higher priority announcements appear first</small>
                </div>

                <div className="announcement-form-group">
                  <label htmlFor="is_active">Status</label>
                  <div className="announcement-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="announcement-form-group">
                  <label htmlFor="start_date">Start Date</label>
                  <input
                    type="datetime-local"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                  />
                  <small className="announcement-hint">Leave empty to start immediately</small>
                </div>

                <div className="announcement-form-group">
                  <label htmlFor="expiry_date">Expiry Date</label>
                  <input
                    type="datetime-local"
                    id="expiry_date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                  />
                  <small className="announcement-hint">Leave empty for no expiry</small>
                </div>
              </div>

              <div className="announcement-modal-actions">
                <button type="button" className="announcement-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="announcement-btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving..." : editingAnnouncement ? "Update Announcement" : "Create Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== VIEW MODAL ===== */}
      {viewingAnnouncement && (
        <div className="announcement-modal-overlay" onClick={() => setViewingAnnouncement(null)}>
          <div className="announcement-modal announcement-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="announcement-modal-head">
              <h2>Announcement Details</h2>
              <button className="announcement-modal-close" onClick={() => setViewingAnnouncement(null)}>×</button>
            </div>
            <div className="announcement-view-content">
              <div className="announcement-view-field">
                <strong>Title:</strong>
                <p>{viewingAnnouncement.title}</p>
              </div>
              {viewingAnnouncement.content && (
                <div className="announcement-view-field">
                  <strong>Content:</strong>
                  <p>{viewingAnnouncement.content}</p>
                </div>
              )}
              <div className="announcement-view-field">
                <strong>Priority:</strong>
                <p>{getPriorityLabel(viewingAnnouncement.priority).label}</p>
              </div>
              <div className="announcement-view-field">
                <strong>Status:</strong>
                <p>{isActive(viewingAnnouncement) ? "Active" : "Inactive"}</p>
              </div>
              <div className="announcement-view-field">
                <strong>Start Date:</strong>
                <p>{viewingAnnouncement.start_date ? formatDate(viewingAnnouncement.start_date) : "Immediate"}</p>
              </div>
              <div className="announcement-view-field">
                <strong>Expiry Date:</strong>
                <p>{viewingAnnouncement.expiry_date ? formatDate(viewingAnnouncement.expiry_date) : "Never"}</p>
              </div>
              <div className="announcement-view-field">
                <strong>Created:</strong>
                <p>{formatDate(viewingAnnouncement.created_at)}</p>
              </div>
              <div className="announcement-view-field">
                <strong>Updated:</strong>
                <p>{formatDate(viewingAnnouncement.updated_at)}</p>
              </div>
            </div>
            <div className="announcement-modal-actions">
              <button className="announcement-btn-secondary" onClick={() => setViewingAnnouncement(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div className="announcement-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="announcement-modal announcement-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="announcement-modal-head">
              <h2>Confirm Delete</h2>
              <button className="announcement-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="announcement-modal-body">
              <div className="announcement-delete-icon">🗑️</div>
              <p>Are you sure you want to delete this announcement?</p>
              <p className="announcement-delete-warning">This action cannot be undone.</p>
            </div>
            <div className="announcement-modal-actions">
              <button className="announcement-btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="announcement-btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ===== Loading ===== */
        .announcement-loading-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
        }
        .announcement-loading-page .announcement-loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #F3EAF2;
          border-top-color: #893C87;
          border-radius: 50%;
          animation: announcement-spin 0.8s linear infinite;
        }
        @keyframes announcement-spin {
          to { transform: rotate(360deg); }
        }

        /* ===== Layout ===== */
        .announcement-admin-layout {
          min-height: 100vh;
          background: #F8F5F7;
        }
        .announcement-admin-main {
          padding: 24px;
          margin-top: 64px;
          margin-left: 250px;
          transition: margin-left 0.28s ease;
          min-height: calc(100vh - 64px);
        }
        .announcement-admin-main.announcement-sidebar-closed {
          margin-left: 0;
        }
        .announcement-page-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* ===== Header ===== */
        .announcement-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .announcement-page-header h1 {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .announcement-page-subtitle {
          font-size: 14px;
          color: #6B646B;
          margin: 4px 0 0;
        }

        /* ===== Buttons ===== */
        .announcement-btn-primary {
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
        .announcement-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .announcement-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .announcement-btn-secondary {
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
        .announcement-btn-secondary:hover {
          background: #D1C9D0;
        }
        .announcement-btn-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .announcement-btn-danger {
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
        .announcement-btn-danger:hover {
          background: #B71C1C;
        }
        .announcement-btn-danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* ===== Stats ===== */
        .announcement-stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .announcement-stat-box {
          background: #FFFFFF;
          padding: 16px 20px;
          border-radius: 10px;
          text-align: center;
          border: 1px solid #E1D9E0;
        }
        .announcement-stat-number {
          display: block;
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 700;
          color: #893C87;
        }
        .announcement-stat-label {
          font-size: 13px;
          color: #6B646B;
        }

        /* ===== Table ===== */
        .announcement-table-container {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E1D9E0;
          overflow: hidden;
        }
        .announcement-data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .announcement-data-table thead {
          background: #F8F5F7;
        }
        .announcement-data-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #6B646B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E1D9E0;
        }
        .announcement-data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #E1D9E0;
          font-size: 14px;
          color: #241F24;
        }
        .announcement-data-table tr:last-child td {
          border-bottom: none;
        }
        .announcement-data-table tbody tr:hover {
          background: #FBF9FA;
        }

        .announcement-info {
          display: flex;
          flex-direction: column;
        }
        .announcement-info strong {
          font-size: 14px;
        }
        .announcement-badge {
          display: inline-block;
          padding: 1px 8px;
          background: #C62828;
          color: #FFFFFF;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 2px;
          width: fit-content;
        }

        .announcement-content-text {
          font-size: 13px;
          color: #6B646B;
        }

        .announcement-priority {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .announcement-priority.priority-high {
          background: #FDE8E8;
          color: #C62828;
        }
        .announcement-priority.priority-medium {
          background: #FFF3E0;
          color: #E65100;
        }
        .announcement-priority.priority-low {
          background: #F3EAF2;
          color: #6B646B;
        }

        .announcement-date-info {
          font-size: 13px;
          color: #6B646B;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .announcement-expired-badge {
          display: inline-block;
          padding: 1px 8px;
          background: #FDE8E8;
          color: #C62828;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          width: fit-content;
        }

        .announcement-status-toggle {
          padding: 4px 14px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .announcement-status-toggle.announcement-active {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .announcement-status-toggle.announcement-inactive {
          background: #FDE8E8;
          color: #C62828;
        }
        .announcement-status-toggle:hover {
          opacity: 0.8;
        }

        .announcement-action-buttons {
          display: flex;
          gap: 6px;
        }
        .announcement-action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.15s ease;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .announcement-action-btn:hover {
          transform: scale(1.1);
        }
        .announcement-action-btn.announcement-view:hover {
          background: #E3F2FD;
        }
        .announcement-action-btn.announcement-edit:hover {
          background: #F3EAF2;
        }
        .announcement-action-btn.announcement-delete:hover {
          background: #FDE8E8;
        }

        .announcement-empty-state {
          text-align: center;
          padding: 60px 20px !important;
        }
        .announcement-empty-state .announcement-empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .announcement-empty-state p {
          color: #6B646B;
          font-size: 15px;
          margin: 0;
        }

        /* ===== Modal ===== */
        .announcement-modal-overlay {
          position: fixed !important;
          inset: 0 !important;
          background: rgba(41, 20, 40, 0.5) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 9999 !important;
          padding: 20px;
          animation: announcement-fadeIn 0.2s ease;
        }
        @keyframes announcement-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .announcement-modal {
          background: #FFFFFF !important;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: announcement-slideUp 0.3s ease;
          position: relative !important;
          display: block !important;
        }
        .announcement-modal-lg {
          max-width: 1000px;
        }
        .announcement-modal-sm {
          max-width: 480px;
        }
        @keyframes announcement-slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .announcement-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #E1D9E0;
          position: sticky;
          top: 0;
          background: #FFFFFF;
          border-radius: 16px 16px 0 0;
          z-index: 1;
        }
        .announcement-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .announcement-modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          font-size: 24px;
          cursor: pointer;
          color: #8A7E88;
          transition: color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .announcement-modal-close:hover {
          color: #241F24;
        }
        .announcement-modal-body {
          padding: 24px;
          text-align: center;
        }
        .announcement-modal-body p {
          font-size: 15px;
          color: #4A444A;
          margin: 8px 0;
        }
        .announcement-delete-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .announcement-delete-warning {
          color: #C62828 !important;
          font-size: 13px !important;
        }
        .announcement-modal-form {
          padding: 24px;
        }
        .announcement-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #E1D9E0;
        }

        /* ===== View Content ===== */
        .announcement-view-content {
          padding: 24px;
        }
        .announcement-view-field {
          margin-bottom: 16px;
        }
        .announcement-view-field strong {
          display: block;
          font-size: 13px;
          color: #8A7E88;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .announcement-view-field p {
          margin: 0;
          font-size: 15px;
          color: #241F24;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        /* ===== Form ===== */
        .announcement-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .announcement-form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .announcement-form-group.announcement-full-width {
          grid-column: 1 / -1;
        }
        .announcement-form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .announcement-form-group input,
        .announcement-form-group select,
        .announcement-form-group textarea {
          padding: 10px 12px;
          border: 1px solid #E1D9E0;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.15s ease;
          background: #FFFFFF;
          color: #241F24;
        }
        .announcement-form-group input:focus,
        .announcement-form-group select:focus,
        .announcement-form-group textarea:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.1);
        }
        .announcement-form-group textarea {
          resize: vertical;
        }
        .announcement-form-group select {
          appearance: auto;
          cursor: pointer;
        }
        .announcement-hint {
          font-size: 12px;
          color: #8A7E88;
        }

        .announcement-checkbox-group {
          display: flex;
          align-items: center;
          padding-top: 6px;
        }
        .announcement-checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 400;
          cursor: pointer;
        }
        .announcement-checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #893C87;
          cursor: pointer;
        }

        .announcement-form-error {
          padding: 10px 14px;
          background: #FDE8E8;
          color: #C62828;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .announcement-form-success {
          padding: 10px 14px;
          background: #E8F5E9;
          color: #2E7D32;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* ===== Responsive ===== */
        @media (max-width: 1023px) {
          .announcement-admin-main {
            margin-left: 0 !important;
          }
        }
        @media (max-width: 768px) {
          .announcement-admin-main {
            padding: 16px;
          }
          .announcement-page-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .announcement-stats-summary {
            grid-template-columns: repeat(2, 1fr);
          }
          .announcement-form-grid {
            grid-template-columns: 1fr;
          }
          .announcement-modal {
            max-width: 100%;
            margin: 10px;
            border-radius: 12px;
          }
          .announcement-modal-actions {
            flex-direction: column;
          }
          .announcement-modal-actions button {
            width: 100%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .announcement-admin-main,
          .announcement-modal-overlay,
          .announcement-modal {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Announcements;