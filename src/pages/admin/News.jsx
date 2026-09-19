// src/pages/admin/News.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyNews = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "",
  author: "",
  is_published: false,
  published_at: "",
};

function News() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [news, setNews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState(emptyNews);
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
          await fetchNews();
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

  const fetchNews = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/news`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setNews(data.data);
    } catch (err) {
      console.error("Failed to fetch news:", err);
    }
  };

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => {
    setEditingNews(null);
    setFormData(emptyNews);
    resetImageState();
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEditModal = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title || "",
      slug: newsItem.slug || "",
      excerpt: newsItem.excerpt || "",
      content: newsItem.content || "",
      category: newsItem.category || "",
      author: newsItem.author || "",
      is_published: newsItem.is_published === 1 || newsItem.is_published === true,
      published_at: newsItem.published_at || "",
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
      const url = editingNews
        ? `${API_BASE}/api/admin/news/${editingNews.id}`
        : `${API_BASE}/api/admin/news`;
      const method = editingNews ? "PUT" : "POST";

      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          body.append(key, value);
        }
      });

      if (imageFile) body.append("featured_image", imageFile);
      if (editingNews && removeImage) body.append("remove_image", "true");

      const res = await fetch(url, {
        method,
        credentials: "include",
        body,
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess(editingNews ? "News article updated successfully!" : "News article created successfully!");
        await fetchNews();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess("");
          setFormData(emptyNews);
          resetImageState();
        }, 1500);
      } else {
        setFormError(data.error || "Failed to save news article");
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
      const res = await fetch(`${API_BASE}/api/admin/news/${deleteConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchNews();
        setDeleteConfirm(null);
      } else {
        alert(data.error || "Failed to delete news article");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePublish = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/news/${id}/toggle-publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_published: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchNews();
      } else {
        alert(data.error || "Failed to update publish status");
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
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
      <AdminHeader user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`admin-main ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1>News</h1>
              <p className="page-subtitle">Manage all news articles</p>
            </div>
            <button className="news-btn-primary" onClick={openCreateModal}>
              + Add New Article
            </button>
          </div>

          <div className="stats-summary">
            <div className="stat-box">
              <span className="stat-number">{news.length}</span>
              <span className="stat-label">Total Articles</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{news.filter((n) => n.is_published).length}</span>
              <span className="stat-label">Published</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{news.filter((n) => !n.is_published).length}</span>
              <span className="stat-label">Drafts</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{news.reduce((sum, n) => sum + (n.views || 0), 0)}</span>
              <span className="stat-label">Total Views</span>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Published</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {news.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      <span className="empty-icon">📰</span>
                      <p>No news articles found. Click "Add New Article" to create one.</p>
                    </td>
                  </tr>
                ) : (
                  news.map((article) => (
                    <tr key={article.id}>
                      <td>
                        {article.featured_image ? (
                          <img
                            src={resolveImageSrc(article.featured_image)}
                            alt={article.title}
                            className="table-thumb"
                          />
                        ) : (
                          <div className="table-thumb table-thumb-empty">📰</div>
                        )}
                      </td>
                      <td>
                        <div className="news-info">
                          <strong>{article.title}</strong>
                          <span className="news-slug">{article.slug}</span>
                          {article.excerpt && (
                            <span className="news-excerpt">{truncateText(article.excerpt, 60)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">{article.category || "General"}</span>
                      </td>
                      <td>{article.author || "Unknown"}</td>
                      <td>
                        <div className="news-date-info">
                          <div>{formatDate(article.published_at)}</div>
                        </div>
                      </td>
                      <td>
                        <span className="views-count">👁️ {article.views || 0}</span>
                      </td>
                      <td>
                        <button
                          className={`status-toggle ${article.is_published ? "published" : "draft"}`}
                          onClick={() => togglePublish(article.id, article.is_published)}
                        >
                          {article.is_published ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => openEditModal(article)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => setDeleteConfirm(article.id)}
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

      {/* ===== NEWS MODAL ===== */}
      {showModal && (
        <div className="news-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="news-modal news-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="news-modal-head">
              <h2>{editingNews ? "Edit Article" : "Add New Article"}</h2>
              <button className="news-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="news-modal-form">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">{formSuccess}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., New Academic Year Begins"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="slug">Slug *</label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., new-academic-year-begins"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Academics, Events, Announcements"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="author">Author</label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Author name"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="excerpt">Excerpt</label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Brief summary of the article"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="content">Content</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows="8"
                    placeholder="Full article content..."
                  />
                </div>

                <div className="form-group full-width">
                  <label>Featured Image</label>
                  <div className="image-upload-area">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                    ) : editingNews?.featured_image && !removeImage ? (
                      <img
                        src={resolveImageSrc(editingNews.featured_image)}
                        alt="Current"
                        className="image-preview"
                      />
                    ) : (
                      <div className="image-preview image-preview-empty">No image</div>
                    )}
                    <div className="image-upload-controls">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleImageChange}
                      />
                      {(imagePreview || (editingNews?.featured_image && !removeImage)) && (
                        <button type="button" className="news-btn-link" onClick={handleRemoveImage}>
                          Remove image
                        </button>
                      )}
                      <span className="image-hint">JPG, PNG, WEBP or GIF, up to 10MB</span>
                    </div>
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                    />
                    Publish Now
                  </label>
                </div>

                {formData.is_published && (
                  <div className="form-group">
                    <label htmlFor="published_at">Published Date</label>
                    <input
                      type="datetime-local"
                      id="published_at"
                      name="published_at"
                      value={formData.published_at}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>

              <div className="news-modal-actions">
                <button type="button" className="news-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="news-btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving..." : editingNews ? "Update Article" : "Create Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div className="news-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="news-modal news-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="news-modal-head">
              <h2>Confirm Delete</h2>
              <button className="news-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="news-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this news article?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="news-modal-actions">
              <button className="news-btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="news-btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Article"}
              </button>
            </div>
          </div>
        </div>
      )}

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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ===== Layout ===== */
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
        .admin-main.sidebar-closed {
          margin-left: 0;
        }
        .page-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        /* ===== Header ===== */
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
        .page-subtitle {
          font-size: 14px;
          color: #6B646B;
          margin: 4px 0 0;
        }

        /* ===== Buttons ===== */
        .news-btn-primary {
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
        .news-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .news-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .news-btn-secondary {
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
        .news-btn-secondary:hover {
          background: #D1C9D0;
        }
        .news-btn-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .news-btn-danger {
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
        .news-btn-danger:hover {
          background: #B71C1C;
        }
        .news-btn-danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .news-btn-link {
          background: none;
          border: none;
          color: #C62828;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-align: left;
        }
        .news-btn-link:hover {
          text-decoration: underline;
        }

        /* ===== Stats ===== */
        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-box {
          background: #FFFFFF;
          padding: 16px 20px;
          border-radius: 10px;
          text-align: center;
          border: 1px solid #E1D9E0;
        }
        .stat-number {
          display: block;
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 700;
          color: #893C87;
        }
        .stat-label {
          font-size: 13px;
          color: #6B646B;
        }

        /* ===== Table ===== */
        .table-container {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E1D9E0;
          overflow: hidden;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table thead {
          background: #F8F5F7;
        }
        .data-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #6B646B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E1D9E0;
        }
        .data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #E1D9E0;
          font-size: 14px;
          color: #241F24;
        }
        .data-table tr:last-child td {
          border-bottom: none;
        }
        .data-table tbody tr:hover {
          background: #FBF9FA;
        }

        .table-thumb {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #E1D9E0;
          display: block;
        }
        .table-thumb-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F3EAF2;
          font-size: 18px;
        }

        .news-info {
          display: flex;
          flex-direction: column;
        }
        .news-info strong {
          font-size: 14px;
        }
        .news-slug {
          font-size: 12px;
          color: #8A7E88;
        }
        .news-excerpt {
          font-size: 13px;
          color: #6B646B;
          margin-top: 2px;
        }

        .category-tag {
          display: inline-block;
          padding: 3px 12px;
          background: #F3EAF2;
          color: #893C87;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .views-count {
          font-size: 13px;
          color: #6B646B;
        }

        .news-date-info {
          display: flex;
          flex-direction: column;
          font-size: 13px;
        }

        .status-toggle {
          padding: 4px 14px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .status-toggle.published {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .status-toggle.draft {
          background: #FFF3E0;
          color: #E65100;
        }
        .status-toggle:hover {
          opacity: 0.8;
        }

        .action-buttons {
          display: flex;
          gap: 6px;
        }
        .action-btn {
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
        .action-btn:hover {
          transform: scale(1.1);
        }
        .action-btn.edit:hover {
          background: #F3EAF2;
        }
        .action-btn.delete:hover {
          background: #FDE8E8;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px !important;
        }
        .empty-state .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .empty-state p {
          color: #6B646B;
          font-size: 15px;
          margin: 0;
        }

        /* ===== Modal ===== */
        .news-modal-overlay {
          position: fixed !important;
          inset: 0 !important;
          background: rgba(41, 20, 40, 0.5) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 9999 !important;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .news-modal {
          background: #FFFFFF !important;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
          position: relative !important;
          display: block !important;
        }
        .news-modal-lg {
          max-width: 1000px;
        }
        .news-modal-sm {
          max-width: 480px;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .news-modal-head {
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
        .news-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .news-modal-close {
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
        .news-modal-close:hover {
          color: #241F24;
        }
        .news-modal-body {
          padding: 24px;
          text-align: center;
        }
        .news-modal-body p {
          font-size: 15px;
          color: #4A444A;
          margin: 8px 0;
        }
        .delete-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .delete-warning {
          color: #C62828 !important;
          font-size: 13px !important;
        }
        .news-modal-form {
          padding: 24px;
        }
        .news-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #E1D9E0;
        }

        /* ===== Form ===== */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #E1D9E0;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.15s ease;
          background: #FFFFFF;
          color: #241F24;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.1);
        }
        .form-group textarea {
          resize: vertical;
        }
        .checkbox-group {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 400;
          cursor: pointer;
        }
        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #893C87;
          cursor: pointer;
        }

        /* ===== Image Upload ===== */
        .image-upload-area {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .image-preview {
          width: 120px;
          height: 120px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #E1D9E0;
        }
        .image-preview-empty {
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
        .image-upload-controls {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .image-hint {
          font-size: 12px;
          color: #8A7E88;
        }

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
          .admin-main {
            margin-left: 0 !important;
          }
        }
        @media (max-width: 768px) {
          .admin-main {
            padding: 16px;
          }
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .stats-summary {
            grid-template-columns: repeat(2, 1fr);
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .news-modal {
            max-width: 100%;
            margin: 10px;
            border-radius: 12px;
          }
          .news-modal-actions {
            flex-direction: column;
          }
          .news-modal-actions button {
            width: 100%;
          }
          .image-upload-area {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-main,
          .news-modal-overlay,
          .news-modal {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default News;