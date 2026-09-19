// src/pages/admin/Gallery.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyCategory = {
  name: "",
  slug: "",
  display_order: 0,
  is_active: true,
};

const emptyImage = {
  category_id: "",
  title: "",
  caption: "",
  is_featured: false,
  is_active: true,
  display_order: 0,
};

function Gallery() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("categories"); // "categories" | "images"

  // Categories state
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState("");
  const [categoryFormSuccess, setCategoryFormSuccess] = useState("");
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Images state
  const [images, setImages] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [imageForm, setImageForm] = useState(emptyImage);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [imageFormLoading, setImageFormLoading] = useState(false);
  const [imageFormError, setImageFormError] = useState("");
  const [imageFormSuccess, setImageFormSuccess] = useState("");
  const [deleteImageConfirm, setDeleteImageConfirm] = useState(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");

  // ===== Bulk upload state =====
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkIsActive, setBulkIsActive] = useState(true);
  const [bulkIsFeatured, setBulkIsFeatured] = useState(false);
  const [bulkStartOrder, setBulkStartOrder] = useState(0);
  const [bulkItems, setBulkItems] = useState([]); // { id, file, preview, title, caption }
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const bulkFileInputRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          await fetchCategories();
          await fetchImages();
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

  // ===================== CATEGORY FUNCTIONS =====================

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/gallery/categories`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name || "",
        slug: category.slug || "",
        display_order: category.display_order || 0,
        is_active: category.is_active === 1 || category.is_active === true,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm(emptyCategory);
    }
    setCategoryFormError("");
    setCategoryFormSuccess("");
    setShowCategoryModal(true);
  };

  const handleCategoryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (categoryFormError) setCategoryFormError("");
    if (categoryFormSuccess) setCategoryFormSuccess("");
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryFormLoading(true);
    setCategoryFormError("");
    setCategoryFormSuccess("");

    try {
      const url = editingCategory
        ? `${API_BASE}/api/admin/gallery/categories/${editingCategory.id}`
        : `${API_BASE}/api/admin/gallery/categories`;
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(categoryForm),
      });

      const data = await res.json();

      if (data.success) {
        setCategoryFormSuccess(editingCategory ? "Category updated!" : "Category created!");
        await fetchCategories();
        setTimeout(() => {
          setShowCategoryModal(false);
          setCategoryFormSuccess("");
          setCategoryForm(emptyCategory);
        }, 1500);
      } else {
        setCategoryFormError(data.error || "Failed to save category");
      }
    } catch (err) {
      setCategoryFormError("Network error. Please try again.");
    } finally {
      setCategoryFormLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryConfirm) return;

    setIsDeletingCategory(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/gallery/categories/${deleteCategoryConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchCategories();
        await fetchImages();
        setDeleteCategoryConfirm(null);
      } else {
        alert(data.error || "Failed to delete category");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const toggleCategoryStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/gallery/categories/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchCategories();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  // ===================== IMAGE FUNCTIONS =====================

  const fetchImages = async () => {
    try {
      const url = selectedCategoryFilter
        ? `${API_BASE}/api/admin/gallery/images/category/${selectedCategoryFilter}`
        : `${API_BASE}/api/admin/gallery/images`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (data.success) setImages(data.data);
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openImageModal = (image = null) => {
    if (image) {
      setEditingImage(image);
      setImageForm({
        category_id: image.category_id || "",
        title: image.title || "",
        caption: image.caption || "",
        is_featured: image.is_featured === 1 || image.is_featured === true,
        is_active: image.is_active === 1 || image.is_active === true,
        display_order: image.display_order || 0,
      });
      resetImageState();
    } else {
      setEditingImage(null);
      setImageForm(emptyImage);
      resetImageState();
    }
    setImageFormError("");
    setImageFormSuccess("");
    setShowImageModal(true);
  };

  const handleImageChange = (e) => {
    const { name, value, type, checked } = e.target;
    setImageForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (imageFormError) setImageFormError("");
    if (imageFormSuccess) setImageFormSuccess("");
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setImageFormError("Only JPG, PNG, WEBP, or GIF images are allowed");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageFormError("Image must be under 10MB");
      e.target.value = "";
      return;
    }

    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
    if (imageFormError) setImageFormError("");
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    setImageFormLoading(true);
    setImageFormError("");
    setImageFormSuccess("");

    try {
      const url = editingImage
        ? `${API_BASE}/api/admin/gallery/images/${editingImage.id}`
        : `${API_BASE}/api/admin/gallery/images`;
      const method = editingImage ? "PUT" : "POST";

      const body = new FormData();
      Object.entries(imageForm).forEach(([key, value]) => {
        body.append(key, value);
      });
      if (imageFile) body.append("image", imageFile);
      if (editingImage && removeExistingImage) body.append("remove_image", "true");

      const res = await fetch(url, {
        method,
        credentials: "include",
        body,
      });

      const data = await res.json();

      if (data.success) {
        setImageFormSuccess(editingImage ? "Image updated!" : "Image added!");
        await fetchImages();
        await fetchCategories();
        setTimeout(() => {
          setShowImageModal(false);
          setImageFormSuccess("");
          setImageForm(emptyImage);
          resetImageState();
        }, 1500);
      } else {
        setImageFormError(data.error || "Failed to save image");
      }
    } catch (err) {
      setImageFormError("Network error. Please try again.");
    } finally {
      setImageFormLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteImageConfirm) return;

    setIsDeletingImage(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/gallery/images/${deleteImageConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchImages();
        setDeleteImageConfirm(null);
      } else {
        alert(data.error || "Failed to delete image");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeletingImage(false);
    }
  };

  const toggleImageStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/gallery/images/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchImages();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  // ===================== BULK UPLOAD FUNCTIONS =====================

  const resetBulkState = () => {
    bulkItems.forEach((item) => {
      if (item.preview && item.preview.startsWith("blob:")) {
        URL.revokeObjectURL(item.preview);
      }
    });
    setBulkItems([]);
    setBulkError("");
    setBulkSuccess("");
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = "";
  };

  const openBulkModal = () => {
    resetBulkState();
    setBulkCategoryId(selectedCategoryFilter || "");
    setBulkIsActive(true);
    setBulkIsFeatured(false);
    setBulkStartOrder(0);
    setShowBulkModal(true);
  };

  const handleBulkFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const MAX_SIZE = 10 * 1024 * 1024;
    const MAX_FILES = 20;

    const remainingSlots = MAX_FILES - bulkItems.length;
    if (remainingSlots <= 0) {
      setBulkError(`You can upload up to ${MAX_FILES} images at once.`);
      e.target.value = "";
      return;
    }

    const valid = [];
    const errors = [];

    files.slice(0, remainingSlots).forEach((file) => {
      if (!allowed.includes(file.type)) {
        errors.push(`${file.name}: unsupported file type`);
        return;
      }
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name}: exceeds 10MB`);
        return;
      }
      valid.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        title: file.name.replace(/\.[^.]+$/, ""),
        caption: "",
      });
    });

    if (files.length > remainingSlots) {
      errors.push(
        `Only ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"} accepted (max ${MAX_FILES}).`
      );
    }

    setBulkItems((prev) => [...prev, ...valid]);
    setBulkError(errors.length ? errors.join(" • ") : "");
    setBulkSuccess("");
    e.target.value = "";
  };

  const updateBulkItem = (id, field, value) => {
    setBulkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeBulkItem = (id) => {
    setBulkItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkError("");
    setBulkSuccess("");

    if (!bulkCategoryId) {
      setBulkError("Please select a category.");
      return;
    }
    if (bulkItems.length === 0) {
      setBulkError("Please choose at least one image.");
      return;
    }

    setBulkLoading(true);
    try {
      const body = new FormData();
      body.append("category_id", bulkCategoryId);
      body.append("is_active", bulkIsActive ? "true" : "false");
      body.append("is_featured", bulkIsFeatured ? "true" : "false");
      body.append("display_order", String(bulkStartOrder || 0));

      bulkItems.forEach((item) => {
        body.append("images", item.file);
        body.append("titles[]", item.title || "");
        body.append("captions[]", item.caption || "");
      });

      const res = await fetch(`${API_BASE}/api/admin/gallery/images/bulk`, {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await res.json();

      if (data.success) {
        setBulkSuccess(data.message || "Images uploaded successfully!");
        await fetchImages();
        await fetchCategories();
        setTimeout(() => {
          setShowBulkModal(false);
          resetBulkState();
        }, 1500);
      } else {
        setBulkError(data.error || "Failed to upload images");
      }
    } catch (err) {
      console.error(err);
      setBulkError("Network error. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  };

  const resolveImageSrc = (imageUrl) => (imageUrl ? `${API_BASE}${imageUrl}` : null);

  const filteredImages = selectedCategoryFilter
    ? images.filter((img) => img.category_id === parseInt(selectedCategoryFilter))
    : images;

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
              <h1>Gallery</h1>
              <p className="page-subtitle">Manage gallery categories and images</p>
            </div>
            <div className="header-actions">
              {activeTab === "categories" ? (
                <button className="gallery-btn-primary" onClick={() => openCategoryModal()}>
                  + New Category
                </button>
              ) : (
                <>
                  <button className="gallery-btn-secondary" onClick={openBulkModal}>
                    ⬆ Bulk Upload
                  </button>
                  <button className="gallery-btn-primary" onClick={() => openImageModal()}>
                    + Add Image
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="gallery-tabs">
            <button
              className={`gallery-tab ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => setActiveTab("categories")}
            >
              📂 Categories ({categories.length})
            </button>
            <button
              className={`gallery-tab ${activeTab === "images" ? "active" : ""}`}
              onClick={() => setActiveTab("images")}
            >
              🖼️ Images ({images.length})
            </button>
          </div>

          {/* Categories Tab */}
          {activeTab === "categories" && (
            <>
              <div className="stats-summary">
                <div className="stat-box">
                  <span className="stat-number">{categories.length}</span>
                  <span className="stat-label">Total Categories</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">{categories.filter((c) => c.is_active).length}</span>
                  <span className="stat-label">Active</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">
                    {categories.reduce((sum, c) => sum + (c.image_count || 0), 0)}
                  </span>
                  <span className="stat-label">Total Images</span>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Display Order</th>
                      <th>Images</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-state">
                          <span className="empty-icon">📂</span>
                          <p>No categories found. Click "New Category" to create one.</p>
                        </td>
                      </tr>
                    ) : (
                      categories.map((category) => (
                        <tr key={category.id}>
                          <td>
                            <div className="category-info">
                              <strong>{category.name}</strong>
                            </div>
                          </td>
                          <td>
                            <span className="category-slug">{category.slug}</span>
                          </td>
                          <td>{category.display_order || 0}</td>
                          <td>{category.image_count || 0}</td>
                          <td>
                            <button
                              className={`status-toggle ${category.is_active ? "active" : "inactive"}`}
                              onClick={() => toggleCategoryStatus(category.id, category.is_active)}
                            >
                              {category.is_active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit"
                                onClick={() => openCategoryModal(category)}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => setDeleteCategoryConfirm(category.id)}
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
            </>
          )}

          {/* Images Tab */}
          {activeTab === "images" && (
            <>
              <div className="filter-container">
                <div className="filter-group">
                  <label htmlFor="category-filter">Filter by Category:</label>
                  <select
                    id="category-filter"
                    value={selectedCategoryFilter}
                    onChange={(e) => {
                      setSelectedCategoryFilter(e.target.value);
                      fetchImages();
                    }}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.image_count || 0})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="image-grid-container">
                <div className="image-grid">
                  {filteredImages.length === 0 ? (
                    <div className="empty-state-full">
                      <span className="empty-icon">🖼️</span>
                      <p>No images found in this category.</p>
                      <div className="empty-actions">
                        <button className="gallery-btn-secondary" onClick={openBulkModal}>
                          ⬆ Bulk Upload
                        </button>
                        <button className="gallery-btn-primary" onClick={() => openImageModal()}>
                          + Add Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredImages.map((image) => (
                      <div className="image-card" key={image.id}>
                        <div className="image-card-image">
                          {image.image_url ? (
                            <img
                              src={resolveImageSrc(image.image_url)}
                              alt={image.title}
                            />
                          ) : (
                            <div className="image-placeholder">🖼️</div>
                          )}
                          {image.is_featured && (
                            <span className="featured-badge">★ Featured</span>
                          )}
                          {!image.is_active && (
                            <span className="inactive-badge">Inactive</span>
                          )}
                        </div>
                        <div className="image-card-content">
                          <div className="image-card-header">
                            <h3>{image.title}</h3>
                            <div className="image-card-actions">
                              <button
                                className="action-btn edit"
                                onClick={() => openImageModal(image)}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => setDeleteImageConfirm(image.id)}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div className="image-card-meta">
                            <span className="category-tag">{image.category_name || "N/A"}</span>
                            {image.caption && <p className="image-caption">{image.caption}</p>}
                          </div>
                          <div className="image-card-footer">
                            <span className="image-order">Order: {image.display_order || 0}</span>
                            <button
                              className={`status-toggle-sm ${image.is_active ? "active" : "inactive"}`}
                              onClick={() => toggleImageStatus(image.id, image.is_active)}
                            >
                              {image.is_active ? "Active" : "Inactive"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ===================== CATEGORY MODAL ===================== */}
      {showCategoryModal && (
        <div className="gallery-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-modal-head">
              <h2>{editingCategory ? "Edit Category" : "New Category"}</h2>
              <button className="gallery-modal-close" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>

            <form onSubmit={handleCategorySubmit} className="gallery-modal-form">
              {categoryFormError && <div className="form-error">{categoryFormError}</div>}
              {categoryFormSuccess && <div className="form-success">{categoryFormSuccess}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="cat-name">Name *</label>
                  <input
                    type="text"
                    id="cat-name"
                    name="name"
                    value={categoryForm.name}
                    onChange={handleCategoryChange}
                    required
                    placeholder="e.g., Campus Life"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cat-slug">Slug *</label>
                  <input
                    type="text"
                    id="cat-slug"
                    name="slug"
                    value={categoryForm.slug}
                    onChange={handleCategoryChange}
                    required
                    placeholder="e.g., campus-life"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cat-display-order">Display Order</label>
                  <input
                    type="number"
                    id="cat-display-order"
                    name="display_order"
                    value={categoryForm.display_order}
                    onChange={handleCategoryChange}
                    placeholder="0"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={categoryForm.is_active}
                      onChange={handleCategoryChange}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="gallery-modal-actions">
                <button type="button" className="gallery-btn-secondary" onClick={() => setShowCategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="gallery-btn-primary" disabled={categoryFormLoading}>
                  {categoryFormLoading ? "Saving..." : editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== SINGLE IMAGE MODAL ===================== */}
      {showImageModal && (
        <div className="gallery-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="gallery-modal gallery-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-modal-head">
              <h2>{editingImage ? "Edit Image" : "Add Image"}</h2>
              <button className="gallery-modal-close" onClick={() => setShowImageModal(false)}>×</button>
            </div>

            <form onSubmit={handleImageSubmit} className="gallery-modal-form">
              {imageFormError && <div className="form-error">{imageFormError}</div>}
              {imageFormSuccess && <div className="form-success">{imageFormSuccess}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="img-category">Category *</label>
                  <select
                    id="img-category"
                    name="category_id"
                    value={imageForm.category_id}
                    onChange={handleImageChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="img-title">Title *</label>
                  <input
                    type="text"
                    id="img-title"
                    name="title"
                    value={imageForm.title}
                    onChange={handleImageChange}
                    required
                    placeholder="Image title"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="img-caption">Caption</label>
                  <textarea
                    id="img-caption"
                    name="caption"
                    value={imageForm.caption}
                    onChange={handleImageChange}
                    rows="2"
                    placeholder="Image description"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Image File</label>
                  <div className="image-upload-area">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                    ) : editingImage?.image_url && !removeExistingImage ? (
                      <img
                        src={resolveImageSrc(editingImage.image_url)}
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
                        onChange={handleImageFileChange}
                      />
                      {(imagePreview || (editingImage?.image_url && !removeExistingImage)) && (
                        <button type="button" className="gallery-btn-link" onClick={handleRemoveImage}>
                          Remove image
                        </button>
                      )}
                      <span className="image-hint">JPG, PNG, WEBP or GIF, up to 10MB</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="img-display-order">Display Order</label>
                  <input
                    type="number"
                    id="img-display-order"
                    name="display_order"
                    value={imageForm.display_order}
                    onChange={handleImageChange}
                    placeholder="0"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={imageForm.is_featured}
                      onChange={handleImageChange}
                    />
                    Featured Image
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={imageForm.is_active}
                      onChange={handleImageChange}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="gallery-modal-actions">
                <button type="button" className="gallery-btn-secondary" onClick={() => setShowImageModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="gallery-btn-primary" disabled={imageFormLoading}>
                  {imageFormLoading ? "Saving..." : editingImage ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== BULK UPLOAD MODAL ===================== */}
      {showBulkModal && (
        <div className="gallery-modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div
            className="gallery-modal gallery-modal-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gallery-modal-head">
              <h2>Bulk Upload Images</h2>
              <button
                className="gallery-modal-close"
                onClick={() => setShowBulkModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="gallery-modal-form">
              {bulkError && <div className="form-error">{bulkError}</div>}
              {bulkSuccess && <div className="form-success">{bulkSuccess}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="bulk-category">Category *</label>
                  <select
                    id="bulk-category"
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="bulk-order">Starting Display Order</label>
                  <input
                    type="number"
                    id="bulk-order"
                    value={bulkStartOrder}
                    onChange={(e) => setBulkStartOrder(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={bulkIsActive}
                      onChange={(e) => setBulkIsActive(e.target.checked)}
                    />
                    Active
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={bulkIsFeatured}
                      onChange={(e) => setBulkIsFeatured(e.target.checked)}
                    />
                    Featured
                  </label>
                </div>

                <div className="form-group full-width">
                  <label>Select Images (up to 20 at once)</label>
                  <div className="bulk-drop-area">
                    <input
                      ref={bulkFileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleBulkFilesSelected}
                      className="bulk-file-input"
                      id="bulk-file-input"
                    />
                    <label htmlFor="bulk-file-input" className="bulk-drop-label">
                      <span className="bulk-drop-icon">📁</span>
                      <span>
                        Click to choose images
                        <small>JPG, PNG, WEBP or GIF — up to 10MB each</small>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {bulkItems.length > 0 && (
                <div className="bulk-preview-section">
                  <div className="bulk-preview-header">
                    <h3>
                      {bulkItems.length} image{bulkItems.length === 1 ? "" : "s"} ready to upload
                    </h3>
                    <button
                      type="button"
                      className="gallery-btn-link"
                      onClick={() => {
                        bulkItems.forEach((item) => {
                          if (item.preview?.startsWith("blob:")) {
                            URL.revokeObjectURL(item.preview);
                          }
                        });
                        setBulkItems([]);
                      }}
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="bulk-preview-grid">
                    {bulkItems.map((item) => (
                      <div key={item.id} className="bulk-preview-item">
                        <div className="bulk-preview-thumb">
                          <img src={item.preview} alt={item.title} />
                          <button
                            type="button"
                            className="bulk-preview-remove"
                            onClick={() => removeBulkItem(item.id)}
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                        <input
                          type="text"
                          className="bulk-item-input"
                          placeholder="Title"
                          value={item.title}
                          onChange={(e) =>
                            updateBulkItem(item.id, "title", e.target.value)
                          }
                        />
                        <input
                          type="text"
                          className="bulk-item-input"
                          placeholder="Caption (optional)"
                          value={item.caption}
                          onChange={(e) =>
                            updateBulkItem(item.id, "caption", e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="gallery-modal-actions">
                <button
                  type="button"
                  className="gallery-btn-secondary"
                  onClick={() => setShowBulkModal(false)}
                  disabled={bulkLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gallery-btn-primary"
                  disabled={bulkLoading || bulkItems.length === 0}
                >
                  {bulkLoading
                    ? "Uploading..."
                    : `Upload ${bulkItems.length || ""} Image${
                        bulkItems.length === 1 ? "" : "s"
                      }`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRM MODALS ===================== */}
      {deleteCategoryConfirm && (
        <div className="gallery-modal-overlay" onClick={() => setDeleteCategoryConfirm(null)}>
          <div className="gallery-modal gallery-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-modal-head">
              <h2>Confirm Delete</h2>
              <button className="gallery-modal-close" onClick={() => setDeleteCategoryConfirm(null)}>×</button>
            </div>
            <div className="gallery-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this category?</p>
              <p className="delete-warning">This will also delete all images in this category.</p>
            </div>
            <div className="gallery-modal-actions">
              <button className="gallery-btn-secondary" onClick={() => setDeleteCategoryConfirm(null)} disabled={isDeletingCategory}>
                Cancel
              </button>
              <button className="gallery-btn-danger" onClick={handleDeleteCategory} disabled={isDeletingCategory}>
                {isDeletingCategory ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteImageConfirm && (
        <div className="gallery-modal-overlay" onClick={() => setDeleteImageConfirm(null)}>
          <div className="gallery-modal gallery-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="gallery-modal-head">
              <h2>Confirm Delete</h2>
              <button className="gallery-modal-close" onClick={() => setDeleteImageConfirm(null)}>×</button>
            </div>
            <div className="gallery-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this image?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="gallery-modal-actions">
              <button className="gallery-btn-secondary" onClick={() => setDeleteImageConfirm(null)} disabled={isDeletingImage}>
                Cancel
              </button>
              <button className="gallery-btn-danger" onClick={handleDeleteImage} disabled={isDeletingImage}>
                {isDeletingImage ? "Deleting..." : "Delete Image"}
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
        .header-actions {
          display: flex;
          gap: 10px;
        }

        /* ===== Buttons ===== */
        .gallery-btn-primary {
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
        .gallery-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .gallery-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
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
        .gallery-btn-secondary:hover {
          background: #D1C9D0;
        }
        .gallery-btn-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

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
        .gallery-btn-danger:hover {
          background: #B71C1C;
        }
        .gallery-btn-danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .gallery-btn-link {
          background: none;
          border: none;
          color: #C62828;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-align: left;
        }
        .gallery-btn-link:hover {
          text-decoration: underline;
        }

        /* ===== Tabs ===== */
        .gallery-tabs {
          display: flex;
          gap: 4px;
          background: #FFFFFF;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #E1D9E0;
          margin-bottom: 24px;
        }
        .gallery-tab {
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #6B646B;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .gallery-tab:hover {
          background: #F3EAF2;
          color: #4A444A;
        }
        .gallery-tab.active {
          background: #893C87;
          color: #FFFFFF;
        }
        .gallery-tab.active:hover {
          background: #6F2F6D;
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

        .category-info strong {
          font-size: 14px;
        }
        .category-slug {
          font-size: 12px;
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

        /* ===== Filter ===== */
        .filter-container {
          margin-bottom: 20px;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #FFFFFF;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid #E1D9E0;
        }
        .filter-group label {
          font-size: 14px;
          font-weight: 600;
          color: #4A444A;
        }
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #E1D9E0;
          border-radius: 6px;
          font-size: 14px;
          background: #FFFFFF;
          color: #241F24;
          min-width: 200px;
        }
        .filter-group select:focus {
          outline: none;
          border-color: #893C87;
        }

        /* ===== Image Grid ===== */
        .image-grid-container {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E1D9E0;
          padding: 20px;
        }
        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        .image-card {
          border: 1px solid #E1D9E0;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.15s ease;
          background: #FFFFFF;
        }
        .image-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .image-card-image {
          position: relative;
          width: 100%;
          padding-top: 66.67%;
          background: #F3EAF2;
          overflow: hidden;
        }
        .image-card-image img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-placeholder {
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
        .featured-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #D69E2E;
          color: #FFFFFF;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }
        .inactive-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #C62828;
          color: #FFFFFF;
          padding: 3px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }

        .image-card-content {
          padding: 14px;
        }
        .image-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 6px;
        }
        .image-card-header h3 {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
          color: #241F24;
          flex: 1;
        }
        .image-card-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .image-card-meta {
          margin-bottom: 8px;
        }
        .category-tag {
          display: inline-block;
          padding: 2px 10px;
          background: #F3EAF2;
          color: #893C87;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .image-caption {
          font-size: 13px;
          color: #6B646B;
          margin: 4px 0 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .image-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid #E1D9E0;
        }
        .image-order {
          font-size: 12px;
          color: #8A7E88;
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
        .empty-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ===== Modal ===== */
        .gallery-modal-overlay {
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
        .gallery-modal {
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
        .gallery-modal-lg {
          max-width: 900px;
        }
        .gallery-modal-xl {
          max-width: 1000px;
        }
        .gallery-modal-sm {
          max-width: 480px;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .gallery-modal-head {
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
        .gallery-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .gallery-modal-close {
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
        .gallery-modal-close:hover {
          color: #241F24;
        }
        .gallery-modal-body {
          padding: 24px;
          text-align: center;
        }
        .gallery-modal-body p {
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
        .gallery-modal-form {
          padding: 24px;
        }
        .gallery-modal-actions {
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

        .image-upload-area {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .image-preview {
          width: 96px;
          height: 96px;
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

        /* ===== Bulk Upload ===== */
        .bulk-drop-area {
          position: relative;
          width: 100%;
        }

        .bulk-file-input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .bulk-drop-label {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          border: 2px dashed #D1C9D0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          background: #FBF9FA;
        }

        .bulk-drop-label:hover {
          border-color: #893C87;
          background: #F8F2F8;
        }

        .bulk-drop-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .bulk-drop-label > span:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
          font-weight: 600;
          color: #241F24;
        }

        .bulk-drop-label small {
          font-weight: 400;
          font-size: 12px;
          color: #8A7E88;
        }

        .bulk-preview-section {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #E1D9E0;
        }

        .bulk-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .bulk-preview-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }

        .bulk-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          max-height: 420px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .bulk-preview-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: #FBF9FA;
          padding: 8px;
          border-radius: 10px;
          border: 1px solid #E1D9E0;
        }

        .bulk-preview-thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          background: #F3EAF2;
        }

        .bulk-preview-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .bulk-preview-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: rgba(41, 20, 40, 0.75);
          color: #FFFFFF;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
        }

        .bulk-preview-remove:hover {
          background: #C62828;
        }

        .bulk-item-input {
          padding: 6px 8px;
          border: 1px solid #E1D9E0;
          border-radius: 6px;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          background: #FFFFFF;
          color: #241F24;
        }

        .bulk-item-input:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 2px rgba(137, 60, 135, 0.1);
        }

        /* ===== Form Feedback ===== */
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

        /* ===== Empty State (table) ===== */
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
          .header-actions {
            width: 100%;
            flex-wrap: wrap;
          }
          .stats-summary {
            grid-template-columns: repeat(3, 1fr);
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .gallery-modal {
            max-width: 100%;
            margin: 10px;
            border-radius: 12px;
          }
          .gallery-modal-actions {
            flex-direction: column;
          }
          .gallery-modal-actions button {
            width: 100%;
          }
          .image-grid {
            grid-template-columns: 1fr 1fr;
          }
          .filter-group {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-group select {
            width: 100%;
            min-width: unset;
          }
          .bulk-preview-grid {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          }
        }
        @media (max-width: 480px) {
          .image-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-main,
          .gallery-modal-overlay,
          .gallery-modal {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Gallery;