// src/pages/admin/Events.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyEvent = {
  title: "",
  slug: "",
  description: "",
  event_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  location: "",
  category: "",
  is_featured: false,
  is_active: true,
};

function Events() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(emptyEvent);
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removeFeaturedImage, setRemoveFeaturedImage] = useState(false);
  const [removeImageIds, setRemoveImageIds] = useState([]);
  const featuredInputRef = useRef(null);
  const additionalInputRef = useRef(null);
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
          await fetchEvents();
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
      if (featuredImagePreview && featuredImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(featuredImagePreview);
      }
      additionalImagePreviews.forEach(preview => {
        if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      });
    };
  }, [featuredImagePreview, additionalImagePreviews]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setEvents(data.data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const fetchEventDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${id}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) return data.data;
    } catch (err) {
      console.error("Failed to fetch event details:", err);
      return null;
    }
  };

  const resetImageState = () => {
    setFeaturedImageFile(null);
    setFeaturedImagePreview(null);
    setAdditionalImages([]);
    setAdditionalImagePreviews([]);
    setRemoveFeaturedImage(false);
    setRemoveImageIds([]);
    if (featuredInputRef.current) featuredInputRef.current.value = "";
    if (additionalInputRef.current) additionalInputRef.current.value = "";
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData(emptyEvent);
    setExistingImages([]);
    resetImageState();
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEditModal = async (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || "",
      slug: event.slug || "",
      description: event.description || "",
      event_date: event.event_date || "",
      end_date: event.end_date || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      location: event.location || "",
      category: event.category || "",
      is_featured: event.is_featured === 1 || event.is_featured === true,
      is_active: event.is_active === 1 || event.is_active === true,
    });

    // Fetch existing images
    const details = await fetchEventDetails(event.id);
    setExistingImages(details?.images || []);
    resetImageState();
    setRemoveImageIds([]);
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

  const handleFeaturedImageChange = (e) => {
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

    if (featuredImagePreview && featuredImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(featuredImagePreview);
    }
    setFeaturedImageFile(file);
    setFeaturedImagePreview(URL.createObjectURL(file));
    setRemoveFeaturedImage(false);
    if (formError) setFormError("");
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const validFiles = files.filter(f => allowed.includes(f.type));
    const invalidFiles = files.filter(f => !allowed.includes(f.type));

    if (invalidFiles.length > 0) {
      setFormError("Some files are not supported. Only JPG, PNG, WEBP, GIF allowed.");
      e.target.value = "";
      return;
    }

    const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      setFormError("Some images exceed 10MB limit.");
      e.target.value = "";
      return;
    }

    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setAdditionalImages(prev => [...prev, ...validFiles]);
    setAdditionalImagePreviews(prev => [...prev, ...newPreviews]);
    if (formError) setFormError("");
    e.target.value = "";
  };

  const handleRemoveFeaturedImage = () => {
    if (featuredImagePreview && featuredImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(featuredImagePreview);
    }
    setFeaturedImageFile(null);
    setFeaturedImagePreview(null);
    setRemoveFeaturedImage(true);
    if (featuredInputRef.current) featuredInputRef.current.value = "";
  };

  const handleRemoveAdditionalImage = (index) => {
    const preview = additionalImagePreviews[index];
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (imageId) => {
    setRemoveImageIds(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFormSuccess("");

    try {
      const url = editingEvent
        ? `${API_BASE}/api/admin/events/${editingEvent.id}`
        : `${API_BASE}/api/admin/events`;
      const method = editingEvent ? "PUT" : "POST";

      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          body.append(key, value);
        }
      });

      if (featuredImageFile) body.append("featured_image", featuredImageFile);
      if (editingEvent && removeFeaturedImage) body.append("remove_featured_image", "true");

      additionalImages.forEach(img => body.append("images", img));

      if (editingEvent && removeImageIds.length > 0) {
        body.append("remove_images", removeImageIds.join(","));
      }

      const res = await fetch(url, {
        method,
        credentials: "include",
        body,
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess(editingEvent ? "Event updated successfully!" : "Event created successfully!");
        await fetchEvents();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess("");
          setFormData(emptyEvent);
          resetImageState();
          setExistingImages([]);
        }, 1500);
      } else {
        setFormError(data.error || "Failed to save event");
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
      const res = await fetch(`${API_BASE}/api/admin/events/${deleteConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchEvents();
        setDeleteConfirm(null);
      } else {
        alert(data.error || "Failed to delete event");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchEvents();
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
    });
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
              <h1>Events</h1>
              <p className="page-subtitle">Manage all events</p>
            </div>
            <button className="events-btn-primary" onClick={openCreateModal}>
              + Add New Event
            </button>
          </div>

          <div className="stats-summary">
            <div className="stat-box">
              <span className="stat-number">{events.length}</span>
              <span className="stat-label">Total Events</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{events.filter((e) => e.is_active).length}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{events.filter((e) => e.is_featured).length}</span>
              <span className="stat-label">Featured</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {events.filter(e => new Date(e.event_date) >= new Date()).length}
              </span>
              <span className="stat-label">Upcoming</span>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      <span className="empty-icon">🎉</span>
                      <p>No events found. Click "Add New Event" to create one.</p>
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        {event.featured_image ? (
                          <img
                            src={resolveImageSrc(event.featured_image)}
                            alt={event.title}
                            className="table-thumb"
                          />
                        ) : (
                          <div className="table-thumb table-thumb-empty">🎉</div>
                        )}
                      </td>
                      <td>
                        <div className="event-info">
                          <strong>{event.title}</strong>
                          <span className="event-slug">{event.slug}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">{event.category || "General"}</span>
                      </td>
                      <td>
                        <div className="event-date-info">
                          <div>{formatDate(event.event_date)}</div>
                          {event.start_time && (
                            <div className="event-time">{event.start_time}</div>
                          )}
                        </div>
                      </td>
                      <td>{event.location || "N/A"}</td>
                      <td>
                        {event.is_featured ? (
                          <span className="status-badge status-badge-success">★ Featured</span>
                        ) : (
                          <span className="status-badge status-badge-muted">Not Featured</span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`status-toggle ${event.is_active ? "active" : "inactive"}`}
                          onClick={() => toggleStatus(event.id, event.is_active)}
                        >
                          {event.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => openEditModal(event)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => setDeleteConfirm(event.id)}
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

      {/* ===== EVENT MODAL ===== */}
      {showModal && (
        <div className="events-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="events-modal events-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="events-modal-head">
              <h2>{editingEvent ? "Edit Event" : "Add New Event"}</h2>
              <button className="events-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="events-modal-form">
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
                    placeholder="e.g., Annual Tech Conference"
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
                    placeholder="e.g., annual-tech-conference"
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
                    placeholder="e.g., Conference, Workshop, Seminar"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Campus Hall"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="event_date">Event Date *</label>
                  <input
                    type="date"
                    id="event_date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end_date">End Date</label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="start_time">Start Time</label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end_time">End Time</label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Event description..."
                  />
                </div>

                {/* Featured Image */}
                <div className="form-group full-width">
                  <label>Featured Image</label>
                  <div className="image-upload-area">
                    {featuredImagePreview ? (
                      <img src={featuredImagePreview} alt="Preview" className="image-preview" />
                    ) : editingEvent?.featured_image && !removeFeaturedImage ? (
                      <img
                        src={resolveImageSrc(editingEvent.featured_image)}
                        alt="Current"
                        className="image-preview"
                      />
                    ) : (
                      <div className="image-preview image-preview-empty">No image</div>
                    )}
                    <div className="image-upload-controls">
                      <input
                        ref={featuredInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleFeaturedImageChange}
                      />
                      {(featuredImagePreview || (editingEvent?.featured_image && !removeFeaturedImage)) && (
                        <button type="button" className="events-btn-link" onClick={handleRemoveFeaturedImage}>
                          Remove image
                        </button>
                      )}
                      <span className="image-hint">JPG, PNG, WEBP or GIF, up to 10MB</span>
                    </div>
                  </div>
                </div>

                {/* Additional Images */}
                <div className="form-group full-width">
                  <label>Additional Images</label>
                  <div className="additional-images-area">
                    <input
                      ref={additionalInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleAdditionalImagesChange}
                      multiple
                    />
                    <span className="image-hint">Add multiple images (JPG, PNG, WEBP, GIF, up to 10MB each)</span>
                  </div>

                  {/* Preview additional images */}
                  {(additionalImagePreviews.length > 0 || existingImages.length > 0) && (
                    <div className="additional-images-grid">
                      {/* Existing images */}
                      {existingImages.map((img) => (
                        <div key={img.id} className="additional-image-item">
                          <img src={resolveImageSrc(img.image_url)} alt={img.caption || "Event image"} />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveExistingImage(img.id)}
                          >
                            ×
                          </button>
                          {img.caption && <span className="image-caption-label">{img.caption}</span>}
                        </div>
                      ))}
                      {/* New images */}
                      {additionalImagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="additional-image-item">
                          <img src={preview} alt={`New image ${index + 1}`} />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveAdditionalImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                    />
                    Featured Event
                  </label>
                </div>

                <div className="form-group checkbox-group">
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

              <div className="events-modal-actions">
                <button type="button" className="events-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="events-btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div className="events-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="events-modal events-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="events-modal-head">
              <h2>Confirm Delete</h2>
              <button className="events-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="events-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this event?</p>
              <p className="delete-warning">This will also delete all associated images.</p>
            </div>
            <div className="events-modal-actions">
              <button className="events-btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="events-btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Event"}
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
        .events-btn-primary {
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
        .events-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .events-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .events-btn-secondary {
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
        .events-btn-secondary:hover {
          background: #D1C9D0;
        }
        .events-btn-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .events-btn-danger {
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
        .events-btn-danger:hover {
          background: #B71C1C;
        }
        .events-btn-danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .events-btn-link {
          background: none;
          border: none;
          color: #C62828;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-align: left;
        }
        .events-btn-link:hover {
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

        .event-info {
          display: flex;
          flex-direction: column;
        }
        .event-info strong {
          font-size: 14px;
        }
        .event-slug {
          font-size: 12px;
          color: #8A7E88;
        }

        .event-date-info {
          display: flex;
          flex-direction: column;
        }
        .event-time {
          font-size: 12px;
          color: #8A7E88;
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

        .status-badge {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-badge-success {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .status-badge-muted {
          background: #F1EDF0;
          color: #8A7E88;
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
        .status-toggle.active {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .status-toggle.inactive {
          background: #FDE8E8;
          color: #C62828;
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
        .events-modal-overlay {
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
        .events-modal {
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
        .events-modal-lg {
          max-width: 1000px;
        }
        .events-modal-sm {
          max-width: 480px;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .events-modal-head {
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
        .events-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .events-modal-close {
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
        .events-modal-close:hover {
          color: #241F24;
        }
        .events-modal-body {
          padding: 24px;
          text-align: center;
        }
        .events-modal-body p {
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
        .events-modal-form {
          padding: 24px;
        }
        .events-modal-actions {
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

        .additional-images-area {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .additional-images-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
        }
        .additional-image-item {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #E1D9E0;
        }
        .additional-image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-image-btn {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: #C62828;
          color: #FFFFFF;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .remove-image-btn:hover {
          transform: scale(1.1);
        }
        .image-caption-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.6);
          color: #FFFFFF;
          font-size: 10px;
          padding: 2px 6px;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
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
          .events-modal {
            max-width: 100%;
            margin: 10px;
            border-radius: 12px;
          }
          .events-modal-actions {
            flex-direction: column;
          }
          .events-modal-actions button {
            width: 100%;
          }
          .image-upload-area {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-main,
          .events-modal-overlay,
          .events-modal {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Events;