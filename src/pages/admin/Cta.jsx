// src/pages/admin/CTA.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyCTA = {
  title: "",
  description: "",
  primary_button_text: "",
  primary_button_link: "",
  secondary_button_text: "",
  secondary_button_link: "",
  is_active: false,
};

function CTA() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ctaItems, setCtaItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCTA, setEditingCTA] = useState(null);
  const [formData, setFormData] = useState(emptyCTA);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          await fetchCTA();
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

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchCTA = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/cta`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setCtaItems(data.data);
    } catch (err) {
      console.error("Failed to fetch CTA sections:", err);
    }
  };

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => {
    setEditingCTA(null);
    setFormData(emptyCTA);
    resetImageState();
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEditModal = (ctaItem) => {
    setEditingCTA(ctaItem);
    setFormData({
      title: ctaItem.title || "",
      description: ctaItem.description || "",
      primary_button_text: ctaItem.primary_button_text || "",
      primary_button_link: ctaItem.primary_button_link || "",
      secondary_button_text: ctaItem.secondary_button_text || "",
      secondary_button_link: ctaItem.secondary_button_link || "",
      is_active: ctaItem.is_active === 1 || ctaItem.is_active === true,
    });
    resetImageState();
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setFormError("Only JPG, PNG, WEBP, or GIF images are allowed");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Image must be under 10MB");
      e.target.value = "";
      return;
    }

    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    if (formError) setFormError("");
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFormSuccess("");

    try {
      const url = editingCTA
        ? `${API_BASE}/api/admin/cta/${editingCTA.id}`
        : `${API_BASE}/api/admin/cta`;
      const method = editingCTA ? "PUT" : "POST";

      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          body.append(key, value);
        }
      });

      if (imageFile) body.append("background_image", imageFile);
      if (editingCTA && removeImage) body.append("remove_image", "true");

      const res = await fetch(url, {
        method,
        credentials: "include",
        body,
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess(editingCTA ? "CTA section updated successfully!" : "CTA section created successfully!");
        await fetchCTA();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess("");
          setFormData(emptyCTA);
          resetImageState();
        }, 1500);
      } else {
        setFormError(data.error || "Failed to save CTA section");
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
      const res = await fetch(`${API_BASE}/api/admin/cta/${deleteConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchCTA();
        setDeleteConfirm(null);
      } else {
        alert(data.error || "Failed to delete CTA section");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/cta/${id}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCTA();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const resolveImageSrc = (imageUrl) => (imageUrl ? `${API_BASE}${imageUrl}` : null);

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

  const truncateText = (text, maxLength = 80) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="cta-loading-page">
        <div className="cta-loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="cta-admin-layout">
      <AdminHeader user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`cta-admin-main ${sidebarOpen ? "cta-sidebar-open" : "cta-sidebar-closed"}`}>
        <div className="cta-page-container">
          <div className="cta-page-header">
            <div>
              <h1>CTA Sections</h1>
              <p className="cta-page-subtitle">Manage Call-to-Action sections displayed on the website</p>
            </div>
            <button className="cta-btn-primary" onClick={openCreateModal}>
              + Add New CTA Section
            </button>
          </div>

          <div className="cta-stats-summary">
            <div className="cta-stat-box">
              <span className="cta-stat-number">{ctaItems.length}</span>
              <span className="cta-stat-label">Total Sections</span>
            </div>
            <div className="cta-stat-box">
              <span className="cta-stat-number">{ctaItems.filter((c) => c.is_active).length}</span>
              <span className="cta-stat-label">Active</span>
            </div>
            <div className="cta-stat-box">
              <span className="cta-stat-number">{ctaItems.filter((c) => !c.is_active).length}</span>
              <span className="cta-stat-label">Inactive</span>
            </div>
          </div>

          <div className="cta-table-container">
            <table className="cta-data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Primary Button</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ctaItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="cta-empty-state">
                      <span className="cta-empty-icon">📢</span>
                      <p>No CTA sections found. Click "Add New CTA Section" to create one.</p>
                    </td>
                  </tr>
                ) : (
                  ctaItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.background_image ? (
                          <img
                            src={resolveImageSrc(item.background_image)}
                            alt={item.title}
                            className="cta-table-thumb"
                          />
                        ) : (
                          <div className="cta-table-thumb cta-table-thumb-empty">🖼️</div>
                        )}
                      </td>
                      <td>
                        <div className="cta-info">
                          <strong>{item.title}</strong>
                          {item.primary_button_link && (
                            <span className="cta-link-preview">🔗 {truncateText(item.primary_button_link, 30)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="cta-description-text">{truncateText(item.description, 50)}</span>
                      </td>
                      <td>
                        {item.primary_button_text ? (
                          <span className="cta-button-tag cta-primary-btn">{item.primary_button_text}</span>
                        ) : (
                          <span className="cta-button-tag cta-empty-btn">Not set</span>
                        )}
                        {item.secondary_button_text && (
                          <span className="cta-button-tag cta-secondary-btn">{item.secondary_button_text}</span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`cta-status-toggle ${item.is_active ? "cta-active" : "cta-inactive"}`}
                          onClick={() => toggleActive(item.id, item.is_active)}
                        >
                          {item.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <div className="cta-date-info">{formatDate(item.updated_at)}</div>
                      </td>
                      <td>
                        <div className="cta-action-buttons">
                          <button
                            className="cta-action-btn cta-edit"
                            onClick={() => openEditModal(item)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="cta-action-btn cta-delete"
                            onClick={() => setDeleteConfirm(item.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ===== CTA MODAL ===== */}
      {showModal && (
        <div className="cta-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cta-modal cta-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="cta-modal-head">
              <h2>{editingCTA ? "Edit CTA Section" : "Add New CTA Section"}</h2>
              <button className="cta-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="cta-modal-form">
              {formError && <div className="cta-form-error">{formError}</div>}
              {formSuccess && <div className="cta-form-success">{formSuccess}</div>}

              <div className="cta-form-grid">
                <div className="cta-form-group cta-full-width">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Join Our Community Today"
                  />
                </div>

                <div className="cta-form-group cta-full-width">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Brief description of the call-to-action..."
                  />
                </div>

                <div className="cta-form-group">
                  <label htmlFor="primary_button_text">Primary Button Text</label>
                  <input
                    type="text"
                    id="primary_button_text"
                    name="primary_button_text"
                    value={formData.primary_button_text}
                    onChange={handleInputChange}
                    placeholder="e.g., Get Started"
                  />
                </div>

                <div className="cta-form-group">
                  <label htmlFor="primary_button_link">Primary Button Link</label>
                  <input
                    type="text"
                    id="primary_button_link"
                    name="primary_button_link"
                    value={formData.primary_button_link}
                    onChange={handleInputChange}
                    placeholder="e.g., /register"
                  />
                </div>

                <div className="cta-form-group">
                  <label htmlFor="secondary_button_text">Secondary Button Text</label>
                  <input
                    type="text"
                    id="secondary_button_text"
                    name="secondary_button_text"
                    value={formData.secondary_button_text}
                    onChange={handleInputChange}
                    placeholder="e.g., Learn More"
                  />
                </div>

                <div className="cta-form-group">
                  <label htmlFor="secondary_button_link">Secondary Button Link</label>
                  <input
                    type="text"
                    id="secondary_button_link"
                    name="secondary_button_link"
                    value={formData.secondary_button_link}
                    onChange={handleInputChange}
                    placeholder="e.g., /about"
                  />
                </div>

                <div className="cta-form-group cta-full-width">
                  <label>Background Image</label>
                  <div className="cta-image-upload-area">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="cta-image-preview" />
                    ) : editingCTA?.background_image && !removeImage ? (
                      <img
                        src={resolveImageSrc(editingCTA.background_image)}
                        alt="Current"
                        className="cta-image-preview"
                      />
                    ) : (
                      <div className="cta-image-preview cta-image-preview-empty">No image</div>
                    )}
                    <div className="cta-image-upload-controls">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleImageChange}
                      />
                      {(imagePreview || (editingCTA?.background_image && !removeImage)) && (
                        <button type="button" className="cta-btn-link" onClick={handleRemoveImage}>
                          Remove image
                        </button>
                      )}
                      <span className="cta-image-hint">JPG, PNG, WEBP or GIF, up to 10MB</span>
                    </div>
                  </div>
                </div>

                <div className="cta-form-group cta-checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Active (display on website)
                  </label>
                </div>
              </div>

              <div className="cta-modal-actions">
                <button type="button" className="cta-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cta-btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving..." : editingCTA ? "Update Section" : "Create Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div className="cta-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="cta-modal cta-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="cta-modal-head">
              <h2>Confirm Delete</h2>
              <button className="cta-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="cta-modal-body">
              <div className="cta-delete-icon">🗑️</div>
              <p>Are you sure you want to delete this CTA section?</p>
              <p className="cta-delete-warning">This action cannot be undone.</p>
            </div>
            <div className="cta-modal-actions">
              <button className="cta-btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="cta-btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Section"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ===== Loading ===== */
        .cta-loading-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
        }
        .cta-loading-page .cta-loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #F3EAF2;
          border-top-color: #893C87;
          border-radius: 50%;
          animation: cta-spin 0.8s linear infinite;
        }
        @keyframes cta-spin {
          to { transform: rotate(360deg); }
        }

        /* ===== Layout ===== */
        .cta-admin-layout {
          min-height: 100vh;
          background: #F8F5F7;
        }
        .cta-admin-main {
          padding: 24px;
          margin-top: 64px;
          margin-left: 250px;
          transition: margin-left 0.28s ease;
          min-height: calc(100vh - 64px);
        }
        .cta-admin-main.cta-sidebar-closed {
          margin-left: 0;
        }
        .cta-page-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* ===== Header ===== */
        .cta-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .cta-page-header h1 {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .cta-page-subtitle {
          font-size: 14px;
          color: #6B646B;
          margin: 4px 0 0;
        }

        /* ===== Buttons ===== */
        .cta-btn-primary {
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
        .cta-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .cta-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .cta-btn-secondary {
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
        .cta-btn-secondary:hover {
          background: #D1C9D0;
        }
        .cta-btn-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .cta-btn-danger {
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
        .cta-btn-danger:hover {
          background: #B71C1C;
        }
        .cta-btn-danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .cta-btn-link {
          background: none;
          border: none;
          color: #C62828;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-align: left;
        }
        .cta-btn-link:hover {
          text-decoration: underline;
        }

        /* ===== Stats ===== */
        .cta-stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .cta-stat-box {
          background: #FFFFFF;
          padding: 16px 20px;
          border-radius: 10px;
          text-align: center;
          border: 1px solid #E1D9E0;
        }
        .cta-stat-number {
          display: block;
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 700;
          color: #893C87;
        }
        .cta-stat-label {
          font-size: 13px;
          color: #6B646B;
        }

        /* ===== Table ===== */
        .cta-table-container {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E1D9E0;
          overflow: hidden;
        }
        .cta-data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .cta-data-table thead {
          background: #F8F5F7;
        }
        .cta-data-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #6B646B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E1D9E0;
        }
        .cta-data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #E1D9E0;
          font-size: 14px;
          color: #241F24;
        }
        .cta-data-table tr:last-child td {
          border-bottom: none;
        }
        .cta-data-table tbody tr:hover {
          background: #FBF9FA;
        }

        .cta-table-thumb {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #E1D9E0;
          display: block;
        }
        .cta-table-thumb-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F3EAF2;
          font-size: 18px;
        }

        .cta-info {
          display: flex;
          flex-direction: column;
        }
        .cta-info strong {
          font-size: 14px;
        }
        .cta-link-preview {
          font-size: 12px;
          color: #8A7E88;
          margin-top: 2px;
        }

        .cta-description-text {
          font-size: 13px;
          color: #6B646B;
        }

        .cta-button-tag {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin: 2px 4px 2px 0;
        }
        .cta-primary-btn {
          background: #893C87;
          color: #FFFFFF;
        }
        .cta-secondary-btn {
          background: #E1D9E0;
          color: #4A444A;
        }
        .cta-empty-btn {
          background: #F3EAF2;
          color: #8A7E88;
        }

        .cta-date-info {
          font-size: 13px;
          color: #6B646B;
        }

        .cta-status-toggle {
          padding: 4px 14px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .cta-status-toggle.cta-active {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .cta-status-toggle.cta-inactive {
          background: #FDE8E8;
          color: #C62828;
        }
        .cta-status-toggle:hover {
          opacity: 0.8;
        }

        .cta-action-buttons {
          display: flex;
          gap: 6px;
        }
        .cta-action-btn {
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
        .cta-action-btn:hover {
          transform: scale(1.1);
        }
        .cta-action-btn.cta-edit:hover {
          background: #F3EAF2;
        }
        .cta-action-btn.cta-delete:hover {
          background: #FDE8E8;
        }

        .cta-empty-state {
          text-align: center;
          padding: 60px 20px !important;
        }
        .cta-empty-state .cta-empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .cta-empty-state p {
          color: #6B646B;
          font-size: 15px;
          margin: 0;
        }

        /* ===== Modal ===== */
        .cta-modal-overlay {
          position: fixed !important;
          inset: 0 !important;
          background: rgba(41, 20, 40, 0.5) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 9999 !important;
          padding: 20px;
          animation: cta-fadeIn 0.2s ease;
        }
        @keyframes cta-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cta-modal {
          background: #FFFFFF !important;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: cta-slideUp 0.3s ease;
          position: relative !important;
          display: block !important;
        }
        .cta-modal-lg {
          max-width: 1000px;
        }
        .cta-modal-sm {
          max-width: 480px;
        }
        @keyframes cta-slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .cta-modal-head {
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
        .cta-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .cta-modal-close {
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
        .cta-modal-close:hover {
          color: #241F24;
        }
        .cta-modal-body {
          padding: 24px;
          text-align: center;
        }
        .cta-modal-body p {
          font-size: 15px;
          color: #4A444A;
          margin: 8px 0;
        }
        .cta-delete-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .cta-delete-warning {
          color: #C62828 !important;
          font-size: 13px !important;
        }
        .cta-modal-form {
          padding: 24px;
        }
        .cta-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #E1D9E0;
        }

        /* ===== Form ===== */
        .cta-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .cta-form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cta-form-group.cta-full-width {
          grid-column: 1 / -1;
        }
        .cta-form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .cta-form-group input,
        .cta-form-group select,
        .cta-form-group textarea {
          padding: 10px 12px;
          border: 1px solid #E1D9E0;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.15s ease;
          background: #FFFFFF;
          color: #241F24;
        }
        .cta-form-group input:focus,
        .cta-form-group select:focus,
        .cta-form-group textarea:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.1);
        }
        .cta-form-group textarea {
          resize: vertical;
        }
        .cta-checkbox-group {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
        .cta-checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 400;
          cursor: pointer;
        }
        .cta-checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #893C87;
          cursor: pointer;
        }

        /* ===== Image Upload ===== */
        .cta-image-upload-area {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .cta-image-preview {
          width: 120px;
          height: 120px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #E1D9E0;
        }
        .cta-image-preview-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F3EAF2;
          color: #8A7E88;
          font-size: 12px;
          text-align: center;
          width: 120px;
          height: 120px;
          border-radius: 10px;
          border: 1px solid #E1D9E0;
        }
        .cta-image-upload-controls {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cta-image-hint {
          font-size: 12px;
          color: #8A7E88;
        }

        .cta-form-error {
          padding: 10px 14px;
          background: #FDE8E8;
          color: #C62828;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .cta-form-success {
          padding: 10px 14px;
          background: #E8F5E9;
          color: #2E7D32;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* ===== Responsive ===== */
        @media (max-width: 1023px) {
          .cta-admin-main {
            margin-left: 0 !important;
          }
        }
        @media (max-width: 768px) {
          .cta-admin-main {
            padding: 16px;
          }
          .cta-page-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .cta-stats-summary {
            grid-template-columns: repeat(2, 1fr);
          }
          .cta-form-grid {
            grid-template-columns: 1fr;
          }
          .cta-modal {
            max-width: 100%;
            margin: 10px;
            border-radius: 12px;
          }
          .cta-modal-actions {
            flex-direction: column;
          }
          .cta-modal-actions button {
            width: 100%;
          }
          .cta-image-upload-area {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cta-admin-main,
          .cta-modal-overlay,
          .cta-modal {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default CTA;