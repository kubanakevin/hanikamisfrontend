// src/pages/admin/Programs.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyForm = {
  department_id: "",
  name: "",
  slug: "",
  level: "",
  duration: "",
  short_description: "",
  full_description: "",
  entry_requirements: "",
  career_opportunities: "",
  is_featured: false,
  is_active: true,
  display_order: 0,
};

function Programs() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
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
          await fetchPrograms();
          await fetchDepartments();
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

  const fetchPrograms = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/programs`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setPrograms(data.data);
    } catch (err) {
      console.error("Failed to fetch programs:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/programs/departments/list`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setDepartments(data.data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => {
    setEditingProgram(null);
    setFormData(emptyForm);
    resetImageState();
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEditModal = (program) => {
    setEditingProgram(program);
    setFormData({
      department_id: program.department_id || "",
      name: program.name || "",
      slug: program.slug || "",
      level: program.level || "",
      duration: program.duration || "",
      short_description: program.short_description || "",
      full_description: program.full_description || "",
      entry_requirements: program.entry_requirements || "",
      career_opportunities: program.career_opportunities || "",
      is_featured: program.is_featured === 1 || program.is_featured === true,
      is_active: program.is_active === 1 || program.is_active === true,
      display_order: program.display_order || 0,
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

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFormError("Only JPG, PNG, or WEBP images are allowed");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be under 5MB");
      e.target.value = "";
      return;
    }

    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
    if (formError) setFormError("");
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFormSuccess("");

    try {
      const url = editingProgram
        ? `${API_BASE}/api/admin/programs/${editingProgram.id}`
        : `${API_BASE}/api/admin/programs`;
      const method = editingProgram ? "PUT" : "POST";

      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        body.append(key, value);
      });
      if (imageFile) body.append("image", imageFile);
      if (editingProgram && removeExistingImage) body.append("remove_image", "true");

      const res = await fetch(url, {
        method,
        credentials: "include",
        body,
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess(editingProgram ? "Program updated successfully!" : "Program created successfully!");
        await fetchPrograms();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess("");
          setFormData(emptyForm);
          resetImageState();
        }, 1500);
      } else {
        setFormError(data.error || "Failed to save program");
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
      const res = await fetch(`${API_BASE}/api/admin/programs/${deleteConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchPrograms();
        setDeleteConfirm(null);
      } else {
        alert(data.error || "Failed to delete program");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/programs/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPrograms();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const getLevelBadge = (level) => {
    const levels = {
      certificate: { color: "#4A90D9", label: "Certificate" },
      diploma: { color: "#2E7D32", label: "Diploma" },
      degree: { color: "#D69E2E", label: "Degree" },
    };
    const levelData = levels[level?.toLowerCase()] || { color: "#6B646B", label: level || "N/A" };
    return <span className="level-badge" style={{ backgroundColor: levelData.color }}>{levelData.label}</span>;
  };

  const resolveImageSrc = (imageUrl) => (imageUrl ? `${API_BASE}${imageUrl}` : null);

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
              <h1>Programs</h1>
              <p className="page-subtitle">Manage all academic programs</p>
            </div>
            <button className="prog-btn-primary" onClick={openCreateModal}>
              + Add New Program
            </button>
          </div>

          <div className="stats-summary">
            <div className="stat-box">
              <span className="stat-number">{programs.length}</span>
              <span className="stat-label">Total Programs</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{programs.filter((p) => p.is_active).length}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{programs.filter((p) => p.is_featured).length}</span>
              <span className="stat-label">Featured</span>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>Duration</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      <span className="empty-icon">📚</span>
                      <p>No programs found. Click "Add New Program" to create one.</p>
                    </td>
                  </tr>
                ) : (
                  programs.map((program) => (
                    <tr key={program.id}>
                      <td>
                        {program.image_url ? (
                          <img
                            src={resolveImageSrc(program.image_url)}
                            alt={program.name}
                            className="table-thumb"
                          />
                        ) : (
                          <div className="table-thumb table-thumb-empty">📚</div>
                        )}
                      </td>
                      <td>
                        <div className="program-info">
                          <strong>{program.name}</strong>
                          <span className="program-slug">{program.slug}</span>
                        </div>
                      </td>
                      <td>{program.department_name || "N/A"}</td>
                      <td>{getLevelBadge(program.level)}</td>
                      <td>{program.duration || "N/A"}</td>
                      <td>
                        {program.is_featured ? (
                          <span className="status-badge status-badge-success">★ Featured</span>
                        ) : (
                          <span className="status-badge status-badge-muted">Not Featured</span>
                        )}
                      </td>
                      <td>
                        <button
                          className={`status-toggle ${program.is_active ? "active" : "inactive"}`}
                          onClick={() => toggleStatus(program.id, program.is_active)}
                        >
                          {program.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn edit" onClick={() => openEditModal(program)} title="Edit">
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => setDeleteConfirm(program.id)}
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

      {showModal && (
        <div className="prog-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="prog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prog-modal-head">
              <h2>{editingProgram ? "Edit Program" : "Add New Program"}</h2>
              <button className="prog-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="prog-modal-form">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">{formSuccess}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="department_id">Department *</label>
                  <select
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Program Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Computer Science"
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
                    placeholder="e.g., computer-science"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="level">Level *</label>
                  <select id="level" name="level" value={formData.level} onChange={handleInputChange} required>
                    <option value="">Select Level</option>
                    <option value="certificate">Certificate</option>
                    <option value="diploma">Diploma</option>
                    <option value="degree">Degree</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="duration">Duration</label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 2 Years"
                  />
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

                <div className="form-group full-width">
                  <label htmlFor="short_description">Short Description</label>
                  <textarea
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Brief description of the program"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="full_description">Full Description</label>
                  <textarea
                    id="full_description"
                    name="full_description"
                    value={formData.full_description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Detailed description of the program"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="entry_requirements">Entry Requirements</label>
                  <textarea
                    id="entry_requirements"
                    name="entry_requirements"
                    value={formData.entry_requirements}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="List of entry requirements"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="career_opportunities">Career Opportunities</label>
                  <textarea
                    id="career_opportunities"
                    name="career_opportunities"
                    value={formData.career_opportunities}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Career paths for graduates"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Program Image</label>
                  <div className="image-upload-area">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                    ) : editingProgram?.image_url && !removeExistingImage ? (
                      <img
                        src={resolveImageSrc(editingProgram.image_url)}
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
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                      />
                      {(imagePreview || (editingProgram?.image_url && !removeExistingImage)) && (
                        <button type="button" className="prog-btn-link" onClick={handleRemoveImage}>
                          Remove image
                        </button>
                      )}
                      <span className="image-hint">JPG, PNG or WEBP, up to 5MB</span>
                    </div>
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                    />
                    Featured Program
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                    Active
                  </label>
                </div>
              </div>

              <div className="prog-modal-actions">
                <button type="button" className="prog-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="prog-btn-primary" disabled={formLoading}>
                  {formLoading ? "Saving..." : editingProgram ? "Update Program" : "Create Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="prog-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="prog-modal prog-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="prog-modal-head">
              <h2>Confirm Delete</h2>
              <button className="prog-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="prog-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this program?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="prog-modal-actions">
              <button className="prog-btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="prog-btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Program"}
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

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

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
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

        .prog-btn-primary {
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

        .prog-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }

        .prog-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .prog-btn-secondary {
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

        .prog-btn-secondary:hover {
          background: #D1C9D0;
        }

        .prog-btn-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .prog-btn-danger {
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

        .prog-btn-danger:hover {
          background: #B71C1C;
        }

        .prog-btn-danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .prog-btn-link {
          background: none;
          border: none;
          color: #C62828;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-align: left;
        }

        .prog-btn-link:hover {
          text-decoration: underline;
        }

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

        .program-info {
          display: flex;
          flex-direction: column;
        }

        .program-info strong {
          font-size: 14px;
        }

        .program-slug {
          font-size: 12px;
          color: #8A7E88;
        }

        .level-badge {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #FFFFFF;
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

        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }

        .empty-state p {
          color: #6B646B;
          font-size: 15px;
          margin: 0;
        }

        .prog-modal-overlay {
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

        .prog-modal {
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

        .prog-modal-sm {
          max-width: 480px;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .prog-modal-head {
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

        .prog-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }

        .prog-modal-close {
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

        .prog-modal-close:hover {
          color: #241F24;
        }

        .prog-modal-body {
          padding: 24px;
          text-align: center;
        }

        .prog-modal-body p {
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

        .prog-modal-form {
          padding: 24px;
        }

        .prog-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #E1D9E0;
        }

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

        .image-upload-area {
          display: flex;
          gap: 16px;
          align-items: center;
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
            gap: 12px;
          }

          .stats-summary {
            grid-template-columns: repeat(3, 1fr);
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .prog-modal {
            max-width: 100%;
            margin: 10px;
            border-radius: 12px;
          }

          .prog-modal-actions {
            flex-direction: column;
          }

          .prog-modal-actions button {
            width: 100%;
          }

          .image-upload-area {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-main,
          .prog-modal-overlay,
          .prog-modal {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Programs;