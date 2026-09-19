// src/pages/admin/About.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyAbout = {
  title: "",
  short_description: "",
  full_content: "",
  mission: "",
  vision: "",
  core_values: "",
  video_url: "",
  founded_year: "",
};

function About() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aboutItems, setAboutItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAbout, setEditingAbout] = useState(null);
  const [formData, setFormData] = useState(emptyAbout);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingAbout, setViewingAbout] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          await fetchAbout();
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

  const fetchAbout = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/about`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setAboutItems(data.data);
    } catch (err) {
      console.error("Failed to fetch about sections:", err);
    }
  };

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => {
    setEditingAbout(null);
    setFormData(emptyAbout);
    resetImageState();
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEditModal = (aboutItem) => {
    setEditingAbout(aboutItem);
    setFormData({
      title: aboutItem.title || "",
      short_description: aboutItem.short_description || "",
      full_content: aboutItem.full_content || "",
      mission: aboutItem.mission || "",
      vision: aboutItem.vision || "",
      core_values: aboutItem.core_values || "",
      video_url: aboutItem.video_url || "",
      founded_year: aboutItem.founded_year || "",
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

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setFormError("Only JPG, PNG, WEBP, GIF, or SVG images are allowed");
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
      const url = editingAbout
        ? `${API_BASE}/api/admin/about/${editingAbout.id}`
        : `${API_BASE}/api/admin/about`;
      const method = editingAbout ? "PUT" : "POST";

      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          body.append(key, value);
        }
      });

      if (imageFile) body.append("image_url", imageFile);
      if (editingAbout && removeImage) body.append("remove_image", "true");

      const res = await fetch(url, {
        method,
        credentials: "include",
        body,
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess(editingAbout ? "About section updated successfully!" : "About section created successfully!");
        await fetchAbout();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess("");
          setFormData(emptyAbout);
          resetImageState();
        }, 1500);
      } else {
        setFormError(data.error || "Failed to save about section");
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
      const res = await fetch(`${API_BASE}/api/admin/about/${deleteConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchAbout();
        setDeleteConfirm(null);
      } else {
        alert(data.error || "Failed to delete about section");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
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
      <div className="about-loading-page">
        <div className="about-loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="about-admin-layout">
      <AdminHeader user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`about-admin-main ${sidebarOpen ? "about-sidebar-open" : "about-sidebar-closed"}`}>
        <div className="about-page-container">
          <div className="about-page-header">
            <div>
              <h1>About Section</h1>
              <p className="about-page-subtitle">Manage the About Us content displayed on the website</p>
            </div>
            <button className="about-btn-primary" onClick={openCreateModal}>
              + Add New About Section
            </button>
          </div>

          <div className="about-stats-summary">
            <div className="about-stat-box">
              <span className="about-stat-number">{aboutItems.length}</span>
              <span className="about-stat-label">Total Sections</span>
            </div>
            <div className="about-stat-box">
              <span className="about-stat-number">{aboutItems.filter((a) => a.title).length}</span>
              <span className="about-stat-label">With Title</span>
            </div>
            <div className="about-stat-box">
              <span className="about-stat-number">{aboutItems.filter((a) => a.image_url).length}</span>
              <span className="about-stat-label">With Image</span>
            </div>
          </div>

          <div className="about-table-container">
            <table className="about-data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Short Description</th>
                  <th>Mission</th>
                  <th>Founded</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {aboutItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="about-empty-state">
                      <span className="about-empty-icon">ℹ️</span>
                      <p>No about sections found. Click "Add New About Section" to create one.</p>
                    </td>
                  </tr>
                ) : (
                  aboutItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.image_url ? (
                          <img
                            src={resolveImageSrc(item.image_url)}
                            alt={item.title}
                            className="about-table-thumb"
                          />
                        ) : (
                          <div className="about-table-thumb about-table-thumb-empty">🖼️</div>
                        )}
                      </td>
                      <td>
                        <div className="about-info">
                          <strong>{item.title}</strong>
                          {item.video_url && (
                            <span className="about-video-indicator">🎬 Video available</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="about-description-text">{truncateText(item.short_description, 60)}</span>
                      </td>
                      <td>
                        {item.mission ? (
                          <span className="about-mission-tag">{truncateText(item.mission, 30)}</span>
                        ) : (
                          <span className="about-empty-tag">Not set</span>
                        )}
                      </td>
                      <td>
                        <span className="about-founded-year">{item.founded_year || "N/A"}</span>
                      </td>
                      <td>
                        <div className="about-date-info">{formatDate(item.updated_at)}</div>
                      </td>
                      <td>
                        <div className="about-action-buttons">
                          <button
                            className="about-action-btn about-view"
                            onClick={() => setViewingAbout(item)}
                            title="View"
                          >
                            👁️
                          </button>
                          <button
                            className="about-action-btn about-edit"
                            onClick={() => openEditModal(item)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="about-action-btn about-delete"
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

      {/* ===== ABOUT MODAL ===== */}
      {showModal && (
        <div className="about-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="about-modal about-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="about-modal-head">
              <h2>{editingAbout ? "Edit About Section" : "Add New About Section"}</h2>
              <button className="about-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="about-modal-form">
              {formError && <div className="about-form-error">{formError}</div>}
              {formSuccess && <div className="about-form-success">{formSuccess}</div>}

              <div className="about-form-grid">
                <div className="about-form-group about-full-width">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., About Our School"
                  />
                </div>

                <div className="about-form-group about-full-width">
                  <label htmlFor="short_description">Short Description</label>
                  <textarea
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Brief description about the organization..."
                  />
                </div>

                <div className="about-form-group about-full-width">
                  <label htmlFor="full_content">Full Content</label>
                  <textarea
                    id="full_content"
                    name="full_content"
                    value={formData.full_content}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Detailed content about the organization..."
                  />
                </div>

                <div className="about-form-group">
                  <label htmlFor="mission">Mission</label>
                  <textarea
                    id="mission"
                    name="mission"
                    value={formData.mission}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Our mission statement..."
                  />
                </div>

                <div className="about-form-group">
                  <label htmlFor="vision">Vision</label>
                  <textarea
                    id="vision"
                    name="vision"
                    value={formData.vision}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Our vision statement..."
                  />
                </div>

                <div className="about-form-group about-full-width">
                  <label htmlFor="core_values">Core Values</label>
                  <textarea
                    id="core_values"
                    name="core_values"
                    value={formData.core_values}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="List your core values (one per line)..."
                  />
                </div>

                <div className="about-form-group">
                  <label htmlFor="founded_year">Founded Year</label>
                  <input
                    type="number"
                    id="founded_year"
                    name="founded_year"
                    value={formData.founded_year}
                    onChange={handleInputChange}
                    placeholder="e.g., 1985"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="about-form-group">
                  <label htmlFor="video_url">Video URL</label>
                  <input
                    type="url"
                    id="video_url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div className="about-form-group about-full-width">
                  <label>Image</label>
                  <div className="about-image-upload-area">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="about-image-preview" />
                    ) : editingAbout?.image_url && !removeImage ? (
                      <img
                        src={resolveImageSrc(editingAbout.image_url)}
                        alt="Current"
                        className="about-image-preview"
                      />
                    ) : (
                      <div className="about-image-preview about-image-preview-empty">No image</div>
                    )}
                    <div className="about-image-upload-controls">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
                        onChange={handleImageChange}
                      />
                      {(imagePreview || (editingAbout?.image_url && !removeImage)) && (
                        <button type="button" className="about-btn-link" onClick={handleRemoveImage}>
                          Remove image
                        </button>
                      )}
                      <span className="about-image-hint">JPG, PNG, WEBP, GIF or SVG, up to 10MB</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="about-modal-actions">
                <button type="button" className="about-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="about-btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving..." : editingAbout ? "Update Section" : "Create Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== VIEW MODAL ===== */}
      {viewingAbout && (
        <div className="about-modal-overlay" onClick={() => setViewingAbout(null)}>
          <div className="about-modal about-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="about-modal-head">
              <h2>About Section Details</h2>
              <button className="about-modal-close" onClick={() => setViewingAbout(null)}>×</button>
            </div>
            <div className="about-view-content">
              {viewingAbout.image_url && (
                <div className="about-view-image">
                  <img src={resolveImageSrc(viewingAbout.image_url)} alt={viewingAbout.title} />
                </div>
              )}
              <div className="about-view-field">
                <strong>Title:</strong>
                <p>{viewingAbout.title}</p>
              </div>
              {viewingAbout.short_description && (
                <div className="about-view-field">
                  <strong>Short Description:</strong>
                  <p>{viewingAbout.short_description}</p>
                </div>
              )}
              {viewingAbout.full_content && (
                <div className="about-view-field">
                  <strong>Full Content:</strong>
                  <p>{viewingAbout.full_content}</p>
                </div>
              )}
              {viewingAbout.mission && (
                <div className="about-view-field">
                  <strong>Mission:</strong>
                  <p>{viewingAbout.mission}</p>
                </div>
              )}
              {viewingAbout.vision && (
                <div className="about-view-field">
                  <strong>Vision:</strong>
                  <p>{viewingAbout.vision}</p>
                </div>
              )}
              {viewingAbout.core_values && (
                <div className="about-view-field">
                  <strong>Core Values:</strong>
                  <p>{viewingAbout.core_values}</p>
                </div>
              )}
              {viewingAbout.video_url && (
                <div className="about-view-field">
                  <strong>Video URL:</strong>
                  <a href={viewingAbout.video_url} target="_blank" rel="noopener noreferrer">
                    {viewingAbout.video_url}
                  </a>
                </div>
              )}
              {viewingAbout.founded_year && (
                <div className="about-view-field">
                  <strong>Founded Year:</strong>
                  <p>{viewingAbout.founded_year}</p>
                </div>
              )}
              <div className="about-view-field">
                <strong>Updated:</strong>
                <p>{formatDate(viewingAbout.updated_at)}</p>
              </div>
            </div>
            <div className="about-modal-actions">
              <button className="about-btn-secondary" onClick={() => setViewingAbout(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div className="about-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="about-modal about-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="about-modal-head">
              <h2>Confirm Delete</h2>
              <button className="about-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="about-modal-body">
              <div className="about-delete-icon">🗑️</div>
              <p>Are you sure you want to delete this about section?</p>
              <p className="about-delete-warning">This action cannot be undone.</p>
            </div>
            <div className="about-modal-actions">
              <button className="about-btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="about-btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Section"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ===== Loading ===== */
        .about-loading-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 16px;
        }
        .about-loading-page .about-loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #F3EAF2;
          border-top-color: #893C87;
          border-radius: 50%;
          animation: about-spin 0.8s linear infinite;
        }
        @keyframes about-spin {
          to { transform: rotate(360deg); }
        }

        /* ===== Layout ===== */
        .about-admin-layout {
          min-height: 100vh;
          background: #F8F5F7;
        }
        .about-admin-main {
          padding: 24px;
          margin-top: 64px;
          margin-left: 250px;
          transition: margin-left 0.28s ease;
          min-height: calc(100vh - 64px);
        }
        .about-admin-main.about-sidebar-closed {
          margin-left: 0;
        }
        .about-page-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* ===== Header ===== */
        .about-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .about-page-header h1 {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .about-page-subtitle {
          font-size: 14px;
          color: #6B646B;
          margin: 4px 0 0;
        }

        /* ===== Buttons ===== */
        .about-btn-primary {
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
        .about-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .about-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .about-btn-secondary {
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
        .about-btn-secondary:hover {
          background: #D1C9D0;
        }
        .about-btn-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .about-btn-danger {
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
        .about-btn-danger:hover {
          background: #B71C1C;
        }
        .about-btn-danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .about-btn-link {
          background: none;
          border: none;
          color: #C62828;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-align: left;
        }
        .about-btn-link:hover {
          text-decoration: underline;
        }

        /* ===== Stats ===== */
        .about-stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .about-stat-box {
          background: #FFFFFF;
          padding: 16px 20px;
          border-radius: 10px;
          text-align: center;
          border: 1px solid #E1D9E0;
        }
        .about-stat-number {
          display: block;
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 700;
          color: #893C87;
        }
        .about-stat-label {
          font-size: 13px;
          color: #6B646B;
        }

        /* ===== Table ===== */
        .about-table-container {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E1D9E0;
          overflow: hidden;
        }
        .about-data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .about-data-table thead {
          background: #F8F5F7;
        }
        .about-data-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #6B646B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E1D9E0;
        }
        .about-data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #E1D9E0;
          font-size: 14px;
          color: #241F24;
        }
        .about-data-table tr:last-child td {
          border-bottom: none;
        }
        .about-data-table tbody tr:hover {
          background: #FBF9FA;
        }

        .about-table-thumb {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #E1D9E0;
          display: block;
        }
        .about-table-thumb-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F3EAF2;
          font-size: 18px;
        }

        .about-info {
          display: flex;
          flex-direction: column;
        }
        .about-info strong {
          font-size: 14px;
        }
        .about-video-indicator {
          font-size: 12px;
          color: #893C87;
          margin-top: 2px;
        }

        .about-description-text {
          font-size: 13px;
          color: #6B646B;
        }

        .about-mission-tag {
          display: inline-block;
          padding: 2px 10px;
          background: #F3EAF2;
          color: #893C87;
          border-radius: 4px;
          font-size: 12px;
        }
        .about-empty-tag {
          display: inline-block;
          padding: 2px 10px;
          background: #F3EAF2;
          color: #8A7E88;
          border-radius: 4px;
          font-size: 12px;
        }

        .about-founded-year {
          font-size: 14px;
          font-weight: 500;
          color: #241F24;
        }

        .about-date-info {
          font-size: 13px;
          color: #6B646B;
        }

        .about-action-buttons {
          display: flex;
          gap: 6px;
        }
        .about-action-btn {
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
        .about-action-btn:hover {
          transform: scale(1.1);
        }
        .about-action-btn.about-view:hover {
          background: #E3F2FD;
        }
        .about-action-btn.about-edit:hover {
          background: #F3EAF2;
        }
        .about-action-btn.about-delete:hover {
          background: #FDE8E8;
        }

        .about-empty-state {
          text-align: center;
          padding: 60px 20px !important;
        }
        .about-empty-state .about-empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .about-empty-state p {
          color: #6B646B;
          font-size: 15px;
          margin: 0;
        }

        /* ===== Modal ===== */
        .about-modal-overlay {
          position: fixed !important;
          inset: 0 !important;
          background: rgba(41, 20, 40, 0.5) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 9999 !important;
          padding: 20px;
          animation: about-fadeIn 0.2s ease;
        }
        @keyframes about-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .about-modal {
          background: #FFFFFF !important;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: about-slideUp 0.3s ease;
          position: relative !important;
          display: block !important;
        }
        .about-modal-lg {
          max-width: 1000px;
        }
        .about-modal-sm {
          max-width: 480px;
        }
        @keyframes about-slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .about-modal-head {
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
        .about-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .about-modal-close {
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
        .about-modal-close:hover {
          color: #241F24;
        }
        .about-modal-body {
          padding: 24px;
          text-align: center;
        }
        .about-modal-body p {
          font-size: 15px;
          color: #4A444A;
          margin: 8px 0;
        }
        .about-delete-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .about-delete-warning {
          color: #C62828 !important;
          font-size: 13px !important;
        }
        .about-modal-form {
          padding: 24px;
        }
        .about-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #E1D9E0;
        }

        /* ===== View Content ===== */
        .about-view-content {
          padding: 24px;
        }
        .about-view-image {
          margin-bottom: 16px;
          text-align: center;
        }
        .about-view-image img {
          max-width: 100%;
          max-height: 300px;
          border-radius: 10px;
          border: 1px solid #E1D9E0;
        }
        .about-view-field {
          margin-bottom: 16px;
        }
        .about-view-field strong {
          display: block;
          font-size: 13px;
          color: #8A7E88;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .about-view-field p {
          margin: 0;
          font-size: 15px;
          color: #241F24;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .about-view-field a {
          color: #893C87;
          text-decoration: none;
          word-break: break-all;
        }
        .about-view-field a:hover {
          text-decoration: underline;
        }

        /* ===== Form ===== */
        .about-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .about-form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .about-form-group.about-full-width {
          grid-column: 1 / -1;
        }
        .about-form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .about-form-group input,
        .about-form-group select,
        .about-form-group textarea {
          padding: 10px 12px;
          border: 1px solid #E1D9E0;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.15s ease;
          background: #FFFFFF;
          color: #241F24;
        }
        .about-form-group input:focus,
        .about-form-group select:focus,
        .about-form-group textarea:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.1);
        }
        .about-form-group textarea {
          resize: vertical;
        }

        /* ===== Image Upload ===== */
        .about-image-upload-area {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .about-image-preview {
          width: 120px;
          height: 120px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #E1D9E0;
        }
        .about-image-preview-empty {
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
        .about-image-upload-controls {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .about-image-hint {
          font-size: 12px;
          color: #8A7E88;
        }

        .about-form-error {
          padding: 10px 14px;
          background: #FDE8E8;
          color: #C62828;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .about-form-success {
          padding: 10px 14px;
          background: #E8F5E9;
          color: #2E7D32;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* ===== Responsive ===== */
        @media (max-width: 1023px) {
          /* Sidebar overlays on mobile/tablet — no push */
          .about-admin-main {
            margin-left: 0 !important;
          }
        }
        @media (max-width: 768px) {
          .about-admin-main {
            padding: 16px;
          }
          .about-page-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .about-stats-summary {
            grid-template-columns: repeat(2, 1fr);
          }
          .about-form-grid {
            grid-template-columns: 1fr;
          }
          .about-modal {
            max-width: 100%;
            margin: 10px;
            border-radius: 12px;
          }
          .about-modal-actions {
            flex-direction: column;
          }
          .about-modal-actions button {
            width: 100%;
          }
          .about-image-upload-area {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .about-admin-main,
          .about-modal-overlay,
          .about-modal {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default About;