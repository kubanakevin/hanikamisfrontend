// src/pages/admin/HeroBanners.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyBanner = {
  title: "",
  subtitle: "",
  description: "",
  media_type: "image",
  button_text: "",
  button_link: "",
  display_order: 0,
  is_active: true,
};

// FIX: This list used to include container formats (avi, mkv, flv, wmv,
// mpg, mpeg, 3gp, 3g2, ogg/ogv) that browsers can't actually decode in a
// <video> element. Uploading one of those "succeeded" here, but on the
// homepage it just rendered as a solid black box — no error, no frame,
// nothing. MP4 (H.264), WebM, and MOV/M4V are the formats that reliably
// play across Chrome, Firefox, Edge, and Safari. Keep this list in sync
// with VIDEO_EXT_REGEX in routes/admin/hero-banners.js.
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "m4v"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "svg"];

function HeroBanners() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState(emptyBanner);

  // File states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

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
          await fetchBanners();
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
      if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      if (videoPreview && videoPreview.startsWith("blob:")) URL.revokeObjectURL(videoPreview);
      if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [imagePreview, videoPreview, thumbnailPreview]);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/hero-banners`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setBanners(data.data);
    } catch (err) {
      console.error("Failed to fetch banners:", err);
    }
  };

  const resetFileState = () => {
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setRemoveImage(false);
    setRemoveVideo(false);
    setRemoveThumbnail(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData(emptyBanner);
    resetFileState();
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      media_type: banner.media_type || "image",
      button_text: banner.button_text || "",
      button_link: banner.button_link || "",
      display_order: banner.display_order || 0,
      is_active: banner.is_active === 1 || banner.is_active === true,
    });
    resetFileState();
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

  const handleMediaTypeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, media_type: value }));

    if (value === "image") {
      setVideoFile(null);
      setVideoPreview(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      if (editingBanner?.video_url) setRemoveVideo(true);
      if (editingBanner?.video_thumbnail) setRemoveThumbnail(true);
    } else {
      setImageFile(null);
      setImagePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (editingBanner?.image_url) setRemoveImage(true);
    }
    if (formError) setFormError("");
  };

  const validateAndSetImage = (file) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setFormError("Only JPG, PNG, WEBP, GIF, or SVG images are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Image must be under 10MB");
      return;
    }

    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    if (formError) setFormError("");
  };

  const validateAndSetVideo = (file) => {
    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!VIDEO_EXTENSIONS.includes(fileExtension)) {
      setFormError(
        `Unsupported video format: ${fileExtension}. For playback to work in every browser, please use MP4 (H.264), WebM, or MOV/M4V. Other formats (AVI, MKV, FLV, WMV, MPG, 3GP, OGG, etc.) will upload but will show as a black box on the site because browsers can't decode them.`
      );
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setFormError("Video must be under 100MB");
      return;
    }

    if (videoPreview && videoPreview.startsWith("blob:")) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setRemoveVideo(false);
    if (formError) setFormError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (VIDEO_EXTENSIONS.includes(ext) || file.type.startsWith("video/")) {
      setFormData((prev) => ({ ...prev, media_type: "video" }));
      if (imageInputRef.current) imageInputRef.current.value = "";
      validateAndSetVideo(file);
      return;
    }

    validateAndSetImage(file);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext) || file.type.startsWith("image/")) {
      setFormData((prev) => ({ ...prev, media_type: "image" }));
      if (videoInputRef.current) videoInputRef.current.value = "";
      validateAndSetImage(file);
      return;
    }

    validateAndSetVideo(file);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setFormError("Only JPG, PNG, WEBP, or GIF images are allowed for thumbnails");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Thumbnail must be under 10MB");
      e.target.value = "";
      return;
    }

    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setRemoveThumbnail(false);
    if (formError) setFormError("");
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleRemoveVideo = () => {
    if (videoPreview && videoPreview.startsWith("blob:")) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    setRemoveVideo(true);
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleRemoveThumbnail = () => {
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setRemoveThumbnail(true);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (formData.media_type === "image") {
      const hasImage = imageFile || (editingBanner?.image_url && !removeImage);
      if (!hasImage) {
        setFormError("Please select a banner image");
        return;
      }
    } else {
      const hasVideo = videoFile || (editingBanner?.video_url && !removeVideo);
      if (!hasVideo) {
        setFormError("Please select a banner video");
        return;
      }
      // FIX: guard against submitting with an existing video whose
      // extension is no longer in the supported list (e.g. an old AVI/MKV
      // upload from before this fix) without the admin realizing it's the
      // reason playback is broken.
      const existingExt = editingBanner?.video_url?.split(".").pop()?.toLowerCase();
      if (!videoFile && existingExt && !VIDEO_EXTENSIONS.includes(existingExt)) {
        setFormError(
          `The current video (.${existingExt}) is in a format most browsers can't play. Please upload a replacement in MP4, WebM, or MOV/M4V.`
        );
        return;
      }
    }

    setFormLoading(true);

    try {
      const url = editingBanner
        ? `${API_BASE}/api/admin/hero-banners/${editingBanner.id}`
        : `${API_BASE}/api/admin/hero-banners`;
      const method = editingBanner ? "PUT" : "POST";

      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          body.append(key, value);
        }
      });

      if (imageFile) body.append("image", imageFile);
      if (videoFile) body.append("video", videoFile);
      if (thumbnailFile) body.append("thumbnail", thumbnailFile);
      if (editingBanner && removeImage) body.append("remove_image", "true");
      if (editingBanner && removeVideo) body.append("remove_video", "true");
      if (editingBanner && removeThumbnail) body.append("remove_thumbnail", "true");

      const res = await fetch(url, {
        method,
        credentials: "include",
        body,
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess(editingBanner ? "Banner updated successfully!" : "Banner created successfully!");
        await fetchBanners();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess("");
          setFormData(emptyBanner);
          resetFileState();
        }, 1500);
      } else {
        setFormError(data.error || "Failed to save banner");
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
      const res = await fetch(`${API_BASE}/api/admin/hero-banners/${deleteConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchBanners();
        setDeleteConfirm(null);
      } else {
        alert(data.error || "Failed to delete banner");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/hero-banners/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchBanners();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const resolveMediaSrc = (url) => (url ? `${API_BASE}${url}` : null);

  // FIX: surface a warning badge on cards whose stored video is in an
  // unsupported format, so admins can spot and fix the old black-video
  // banners at a glance instead of guessing.
  const isUnsupportedVideo = (banner) => {
    if (banner.media_type !== "video" || !banner.video_url) return false;
    const ext = banner.video_url.split(".").pop()?.toLowerCase();
    return !VIDEO_EXTENSIONS.includes(ext);
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
              <h1>Hero Banners</h1>
              <p className="page-subtitle">Manage homepage hero banners (supports images and videos)</p>
            </div>
            <button className="hero-btn-primary" onClick={openCreateModal}>
              + Add New Banner
            </button>
          </div>

          <div className="stats-summary">
            <div className="stat-box">
              <span className="stat-number">{banners.length}</span>
              <span className="stat-label">Total Banners</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{banners.filter((b) => b.is_active).length}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{banners.filter((b) => b.media_type === "video").length}</span>
              <span className="stat-label">Videos</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{banners.filter((b) => b.media_type === "image").length}</span>
              <span className="stat-label">Images</span>
            </div>
          </div>

          <div className="banner-grid-container">
            <div className="banner-grid">
              {banners.length === 0 ? (
                <div className="empty-state-full">
                  <span className="empty-icon">🏠</span>
                  <p>No banners found. Click "Add New Banner" to create one.</p>
                </div>
              ) : (
                banners.map((banner) => (
                  <div className="banner-card" key={banner.id}>
                    <div className="banner-card-media">
                      {banner.media_type === "video" ? (
                        <>
                          {banner.video_thumbnail ? (
                            <img
                              src={resolveMediaSrc(banner.video_thumbnail)}
                              alt={banner.title}
                              className="banner-thumb"
                            />
                          ) : banner.video_url ? (
                            <video
                              src={resolveMediaSrc(banner.video_url)}
                              className="banner-thumb"
                              muted
                              playsInline
                            />
                          ) : (
                            <div className="banner-placeholder">🎬</div>
                          )}
                          <span className="media-badge video-badge">🎬 Video</span>
                          {isUnsupportedVideo(banner) && (
                            <span className="media-badge warning-badge" title="This video format may not play in all browsers">
                              ⚠️ Unsupported format
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {banner.image_url ? (
                            <img
                              src={resolveMediaSrc(banner.image_url)}
                              alt={banner.title}
                              className="banner-thumb"
                            />
                          ) : (
                            <div className="banner-placeholder">🖼️</div>
                          )}
                          <span className="media-badge image-badge">🖼️ Image</span>
                        </>
                      )}
                      {!banner.is_active && <span className="inactive-overlay">Inactive</span>}
                    </div>
                    <div className="banner-card-content">
                      <div className="banner-card-header">
                        <h3>{banner.title}</h3>
                        <div className="banner-card-actions">
                          <button className="action-btn edit" onClick={() => openEditModal(banner)} title="Edit">
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => setDeleteConfirm(banner.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      {banner.subtitle && <p className="banner-subtitle">{banner.subtitle}</p>}
                      <div className="banner-card-footer">
                        <span className="banner-order">Order: {banner.display_order || 0}</span>
                        <button
                          className={`status-toggle-sm ${banner.is_active ? "active" : "inactive"}`}
                          onClick={() => toggleStatus(banner.id, banner.is_active)}
                        >
                          {banner.is_active ? "Active" : "Inactive"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ===== BANNER MODAL ===== */}
      {showModal && (
        <div className="hero-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="hero-modal hero-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="hero-modal-head">
              <h2>{editingBanner ? "Edit Banner" : "Add New Banner"}</h2>
              <button className="hero-modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="hero-modal-form">
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
                    placeholder="Banner title"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subtitle">Subtitle</label>
                  <input
                    type="text"
                    id="subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    placeholder="Banner subtitle"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Banner description"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="media_type">Media Type</label>
                  <select id="media_type" name="media_type" value={formData.media_type} onChange={handleMediaTypeChange}>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="display_order">Display Order</label>
                  <input
                    type="number"
                    id="display_order"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                {formData.media_type === "image" && (
                  <div className="form-group full-width">
                    <label>Banner Image *</label>
                    <div className="image-upload-area">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                      ) : editingBanner?.image_url && !removeImage ? (
                        <img src={resolveMediaSrc(editingBanner.image_url)} alt="Current" className="image-preview" />
                      ) : (
                        <div className="image-preview image-preview-empty">No image</div>
                      )}
                      <div className="image-upload-controls">
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime"
                          onChange={handleImageChange}
                        />
                        {(imagePreview || (editingBanner?.image_url && !removeImage)) && (
                          <button type="button" className="hero-btn-link" onClick={handleRemoveImage}>
                            Remove image
                          </button>
                        )}
                        <span className="image-hint">JPG, PNG, WEBP, GIF or SVG, up to 10MB</span>
                      </div>
                    </div>
                  </div>
                )}

                {formData.media_type === "video" && (
                  <>
                    <div className="form-group full-width">
                      <label>Video File *</label>
                      <div className="video-upload-area">
                        {videoPreview ? (
                          <video src={videoPreview} className="video-preview" controls muted playsInline />
                        ) : editingBanner?.video_url && !removeVideo ? (
                          <video
                            src={resolveMediaSrc(editingBanner.video_url)}
                            className="video-preview"
                            controls
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="video-preview-empty">No video</div>
                        )}
                        <div className="image-upload-controls">
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v,image/*"
                            onChange={handleVideoChange}
                          />
                          {(videoPreview || (editingBanner?.video_url && !removeVideo)) && (
                            <button type="button" className="hero-btn-link" onClick={handleRemoveVideo}>
                              Remove video
                            </button>
                          )}
                          <span className="image-hint">
                            MP4 (recommended), WebM, or MOV/M4V, up to 100MB. Other formats (AVI, MKV, WMV, FLV, 3GP,
                            OGG…) will not play in browsers — convert to MP4 first if that's what you have.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label>Video Thumbnail (Recommended)</label>
                      <div className="image-upload-area">
                        {thumbnailPreview ? (
                          <img src={thumbnailPreview} alt="Thumbnail" className="image-preview" />
                        ) : editingBanner?.video_thumbnail && !removeThumbnail ? (
                          <img
                            src={resolveMediaSrc(editingBanner.video_thumbnail)}
                            alt="Current thumbnail"
                            className="image-preview"
                          />
                        ) : (
                          <div className="image-preview image-preview-empty">No thumbnail</div>
                        )}
                        <div className="image-upload-controls">
                          <input
                            ref={thumbnailInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            onChange={handleThumbnailChange}
                          />
                          {(thumbnailPreview || (editingBanner?.video_thumbnail && !removeThumbnail)) && (
                            <button type="button" className="hero-btn-link" onClick={handleRemoveThumbnail}>
                              Remove thumbnail
                            </button>
                          )}
                          <span className="image-hint">
                            JPG, PNG, WEBP or GIF, up to 10MB. Shown instantly while the video loads/decodes, and as a
                            fallback if the browser can't play the video at all.
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="button_text">Button Text</label>
                  <input
                    type="text"
                    id="button_text"
                    name="button_text"
                    value={formData.button_text}
                    onChange={handleInputChange}
                    placeholder="e.g., Learn More"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="button_link">Button Link</label>
                  <input
                    type="text"
                    id="button_link"
                    name="button_link"
                    value={formData.button_link}
                    onChange={handleInputChange}
                    placeholder="e.g., /about"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                    Active
                  </label>
                </div>
              </div>

              <div className="hero-modal-actions">
                <button type="button" className="hero-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="hero-btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving..." : editingBanner ? "Update Banner" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div className="hero-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="hero-modal hero-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="hero-modal-head">
              <h2>Confirm Delete</h2>
              <button className="hero-modal-close" onClick={() => setDeleteConfirm(null)}>
                ×
              </button>
            </div>
            <div className="hero-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this banner?</p>
              <p className="delete-warning">This will also delete all associated media files.</p>
            </div>
            <div className="hero-modal-actions">
              <button className="hero-btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="hero-btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Banner"}
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
        .hero-btn-primary {
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
        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .hero-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .hero-btn-secondary {
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
        .hero-btn-secondary:hover {
          background: #D1C9D0;
        }
        .hero-btn-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .hero-btn-danger {
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
        .hero-btn-danger:hover {
          background: #B71C1C;
        }
        .hero-btn-danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .hero-btn-link {
          background: none;
          border: none;
          color: #C62828;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-align: left;
        }
        .hero-btn-link:hover {
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

        /* ===== Banner Grid ===== */
        .banner-grid-container {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E1D9E0;
          padding: 20px;
        }
        .banner-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .banner-card {
          border: 1px solid #E1D9E0;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.15s ease;
          background: #FFFFFF;
        }
        .banner-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .banner-card-media {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          background: #F3EAF2;
          overflow: hidden;
        }
        .banner-card-media img,
        .banner-card-media video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .banner-thumb {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .banner-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: #8A7E88;
          background: #F3EAF2;
        }

        .media-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #FFFFFF;
        }
        .video-badge {
          background: #D32F2F;
        }
        .image-badge {
          background: #1976D2;
        }
        .warning-badge {
          top: auto;
          bottom: 10px;
          left: 10px;
          background: #F9A825;
          color: #241F24;
        }

        .inactive-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-size: 18px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .banner-card-content {
          padding: 14px;
        }
        .banner-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }
        .banner-card-header h3 {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
          color: #241F24;
          flex: 1;
        }
        .banner-card-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
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

        .banner-subtitle {
          font-size: 13px;
          color: #6B646B;
          margin: 0 0 8px 0;
        }

        .banner-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid #E1D9E0;
        }
        .banner-order {
          font-size: 12px;
          color: #8A7E88;
        }

        .status-toggle-sm {
          padding: 3px 10px;
          border: none;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .status-toggle-sm.active {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .status-toggle-sm.inactive {
          background: #FDE8E8;
          color: #C62828;
        }
        .status-toggle-sm:hover {
          opacity: 0.8;
        }

        .empty-state-full {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
        }
        .empty-state-full .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .empty-state-full p {
          color: #6B646B;
          font-size: 15px;
          margin: 0 0 16px;
        }

        /* ===== Modal ===== */
        .hero-modal-overlay {
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
        .hero-modal {
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
        .hero-modal-lg {
          max-width: 1000px;
        }
        .hero-modal-sm {
          max-width: 480px;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .hero-modal-head {
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
        .hero-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .hero-modal-close {
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
        .hero-modal-close:hover {
          color: #241F24;
        }
        .hero-modal-body {
          padding: 24px;
          text-align: center;
        }
        .hero-modal-body p {
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
        .hero-modal-form {
          padding: 24px;
        }
        .hero-modal-actions {
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

        /* ===== Image/Video Upload ===== */
        .image-upload-area,
        .video-upload-area {
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
        .video-preview {
          width: 200px;
          max-height: 120px;
          border-radius: 10px;
          border: 1px solid #E1D9E0;
          background: #000;
        }
        .video-preview-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F3EAF2;
          color: #8A7E88;
          font-size: 12px;
          text-align: center;
          width: 200px;
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
          .hero-modal {
            max-width: 100%;
            margin: 10px;
            border-radius: 12px;
          }
          .hero-modal-actions {
            flex-direction: column;
          }
          .hero-modal-actions button {
            width: 100%;
          }
          .banner-grid {
            grid-template-columns: 1fr;
          }
          .image-upload-area,
          .video-upload-area {
            flex-direction: column;
            align-items: flex-start;
          }
          .video-preview {
            width: 100%;
          }
          .video-preview-empty {
            width: 100%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-main,
          .hero-modal-overlay,
          .hero-modal {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default HeroBanners;