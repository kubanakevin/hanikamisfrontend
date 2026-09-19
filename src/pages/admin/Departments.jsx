// src/pages/admin/Departments.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyDepartment = {
  name: "",
  slug: "",
  description: "",
  head_of_department: "",
  is_active: true,
};

function Departments() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState(emptyDepartment);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          await fetchDepartments();
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

  const fetchDepartments = async (opts = {}) => {
    try {
      const params = new URLSearchParams();
      const s = opts.search !== undefined ? opts.search : search;
      const st = opts.status !== undefined ? opts.status : statusFilter;
      if (s) params.append("search", s);
      if (st) params.append("status", st);

      const res = await fetch(
        `${API_BASE}/api/admin/departments?${params.toString()}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) setDepartments(data.data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  const slugify = (text) =>
    String(text)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const openCreateModal = () => {
    setEditingDepartment(null);
    setFormData(emptyDepartment);
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setEditingDepartment(dept);
    setFormData({
      name: dept.name || "",
      slug: dept.slug || "",
      description: dept.description || "",
      head_of_department: dept.head_of_department || "",
      is_active: dept.is_active === 1 || dept.is_active === true,
    });
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      // Auto-fill slug from name when creating a new department
      if (name === "name" && !editingDepartment) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFormSuccess("");

    try {
      const url = editingDepartment
        ? `${API_BASE}/api/admin/departments/${editingDepartment.id}`
        : `${API_BASE}/api/admin/departments`;
      const method = editingDepartment ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess(
          editingDepartment
            ? "Department updated successfully!"
            : "Department created successfully!"
        );
        await fetchDepartments();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess("");
          setFormData(emptyDepartment);
        }, 1200);
      } else {
        setFormError(data.error || "Failed to save department");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/departments/${deleteConfirm}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        await fetchDepartments();
        setDeleteConfirm(null);
      } else {
        alert(data.error || "Failed to delete department");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/departments/${id}/toggle-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ is_active: !currentStatus }),
        }
      );
      const data = await res.json();
      if (data.success) {
        await fetchDepartments();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDepartments({ search });
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    fetchDepartments({ status: value });
  };

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return value;
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
      <AdminHeader user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`admin-main ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1>Departments</h1>
              <p className="page-subtitle">Manage academic departments</p>
            </div>
            <button className="dept-btn-primary" onClick={openCreateModal}>
              + Add New Department
            </button>
          </div>

          <div className="stats-summary">
            <div className="stat-box">
              <span className="stat-number">{departments.length}</span>
              <span className="stat-label">Total Departments</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {departments.filter((d) => d.is_active).length}
              </span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {departments.reduce((sum, d) => sum + (d.program_count || 0), 0)}
              </span>
              <span className="stat-label">Total Programs</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {departments.filter((d) => !d.is_active).length}
              </span>
              <span className="stat-label">Inactive</span>
            </div>
          </div>

          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="status-filter">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <form className="filter-search" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search by name, slug, or head..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="dept-btn-secondary">
                Search
              </button>
            </form>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Head of Department</th>
                  <th>Programs</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      <span className="empty-icon">🏛️</span>
                      <p>No departments found. Click "Add New Department" to create one.</p>
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id}>
                      <td>
                        <div className="dept-info">
                          <strong>{dept.name}</strong>
                          {dept.description && (
                            <span className="dept-desc">
                              {dept.description.slice(0, 60)}
                              {dept.description.length > 60 ? "…" : ""}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="dept-slug">{dept.slug}</span>
                      </td>
                      <td>{dept.head_of_department || "—"}</td>
                      <td>
                        <span className="program-count-badge">
                          📚 {dept.program_count || 0}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`status-toggle ${dept.is_active ? "active" : "inactive"}`}
                          onClick={() => toggleStatus(dept.id, dept.is_active)}
                        >
                          {dept.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <span className="timestamp-cell">
                          {formatDate(dept.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => openEditModal(dept)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => setDeleteConfirm(dept.id)}
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

      {/* ===== DEPARTMENT MODAL ===== */}
      {showModal && (
        <div className="dept-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="dept-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dept-modal-head">
              <h2>{editingDepartment ? "Edit Department" : "Add New Department"}</h2>
              <button className="dept-modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="dept-modal-form">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">{formSuccess}</div>}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="name">Department Name *</label>
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

                <div className="form-group full-width">
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
                  <span className="field-hint">
                    Auto-generated from name. Used in URLs.
                  </span>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="head_of_department">Head of Department</label>
                  <input
                    type="text"
                    id="head_of_department"
                    name="head_of_department"
                    value={formData.head_of_department}
                    onChange={handleInputChange}
                    placeholder="e.g., Dr. Jane Smith"
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
                    placeholder="Brief description of the department..."
                  />
                </div>

                <div className="form-group checkbox-group full-width">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Active (visible on the website)
                  </label>
                </div>
              </div>

              <div className="dept-modal-actions">
                <button
                  type="button"
                  className="dept-btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dept-btn-primary"
                  disabled={formLoading}
                >
                  {formLoading
                    ? "Saving..."
                    : editingDepartment
                    ? "Update Department"
                    : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div className="dept-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dept-modal dept-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="dept-modal-head">
              <h2>Confirm Delete</h2>
              <button
                className="dept-modal-close"
                onClick={() => setDeleteConfirm(null)}
              >
                ×
              </button>
            </div>
            <div className="dept-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this department?</p>
              <p className="delete-warning">
                This action cannot be undone. Departments with programs or assigned users cannot be deleted.
              </p>
            </div>
            <div className="dept-modal-actions">
              <button
                className="dept-btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="dept-btn-danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Department"}
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

        .admin-layout { min-height: 100vh; background: #F8F5F7; }
        .admin-main {
          padding: 24px;
          margin-top: 64px;
          margin-left: 250px;
          transition: margin-left 0.28s ease;
          min-height: calc(100vh - 64px);
        }
        .admin-main.sidebar-closed { margin-left: 0; }
        .page-container { max-width: 1400px; margin: 0 auto; }

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

        .dept-btn-primary {
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
        .dept-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .dept-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .dept-btn-secondary {
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
        .dept-btn-secondary:hover { background: #D1C9D0; }
        .dept-btn-secondary:disabled { opacity: 0.7; cursor: not-allowed; }
        .dept-btn-danger {
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
        .dept-btn-danger:hover { background: #B71C1C; }
        .dept-btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }

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
        .stat-label { font-size: 13px; color: #6B646B; }

        .filter-container {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
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
          white-space: nowrap;
        }
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #E1D9E0;
          border-radius: 6px;
          font-size: 14px;
          background: #FFFFFF;
          color: #241F24;
          min-width: 160px;
        }
        .filter-group select:focus { outline: none; border-color: #893C87; }
        .filter-search {
          display: flex;
          gap: 8px;
          flex: 1;
          min-width: 240px;
        }
        .filter-search input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #E1D9E0;
          border-radius: 10px;
          font-size: 14px;
          background: #FFFFFF;
          color: #241F24;
        }
        .filter-search input:focus { outline: none; border-color: #893C87; }

        .table-container {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E1D9E0;
          overflow-x: auto;
        }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead { background: #F8F5F7; }
        .data-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #6B646B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E1D9E0;
          white-space: nowrap;
        }
        .data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #E1D9E0;
          font-size: 14px;
          color: #241F24;
          vertical-align: middle;
        }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tbody tr:hover { background: #FBF9FA; }

        .dept-info {
          display: flex;
          flex-direction: column;
        }
        .dept-info strong {
          font-size: 14px;
          color: #241F24;
        }
        .dept-desc {
          font-size: 12px;
          color: #8A7E88;
          margin-top: 2px;
        }
        .dept-slug {
          font-family: monospace;
          font-size: 12px;
          background: #F3EAF2;
          color: #893C87;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .program-count-badge {
          display: inline-block;
          padding: 3px 10px;
          background: #E3F2FD;
          color: #1565C0;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .timestamp-cell {
          font-size: 12px;
          color: #8A7E88;
          white-space: nowrap;
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
        .status-toggle.active { background: #E8F5E9; color: #2E7D32; }
        .status-toggle.inactive { background: #FDE8E8; color: #C62828; }
        .status-toggle:hover { opacity: 0.8; }

        .action-buttons { display: flex; gap: 6px; }
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
        .action-btn:hover { transform: scale(1.1); }
        .action-btn.edit:hover { background: #F3EAF2; }
        .action-btn.delete:hover { background: #FDE8E8; }

        .empty-state { text-align: center; padding: 60px 20px !important; }
        .empty-state .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .empty-state p { color: #6B646B; font-size: 15px; margin: 0; }

        .dept-modal-overlay {
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .dept-modal {
          background: #FFFFFF !important;
          border-radius: 16px;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }
        .dept-modal-sm { max-width: 460px; }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .dept-modal-head {
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
        .dept-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .dept-modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          font-size: 24px;
          cursor: pointer;
          color: #8A7E88;
          transition: color 0.15s ease;
        }
        .dept-modal-close:hover { color: #241F24; }
        .dept-modal-body { padding: 24px; text-align: center; }
        .dept-modal-body p {
          font-size: 15px;
          color: #4A444A;
          margin: 8px 0;
        }
        .delete-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .delete-warning { color: #C62828 !important; font-size: 13px !important; }
        .dept-modal-form { padding: 24px; }
        .dept-modal-actions {
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
        .form-group { display: flex; flex-direction: column; gap: 4px; }
        .form-group.full-width { grid-column: 1 / -1; }
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
        .form-group textarea { resize: vertical; }
        .field-hint {
          font-size: 12px;
          color: #8A7E88;
          margin-top: 2px;
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
          .admin-main { margin-left: 0 !important; }
        }
        @media (max-width: 768px) {
          .admin-main { padding: 16px; }
          .page-header { flex-direction: column; align-items: flex-start; }
          .stats-summary { grid-template-columns: repeat(2, 1fr); }
          .form-grid { grid-template-columns: 1fr; }
          .dept-modal { max-width: 100%; margin: 10px; border-radius: 12px; }
          .dept-modal-actions { flex-direction: column; }
          .dept-modal-actions button { width: 100%; }
          .filter-container { flex-direction: column; }
          .filter-group { flex-direction: column; align-items: stretch; }
          .filter-group select { width: 100%; min-width: unset; }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-main,
          .dept-modal-overlay,
          .dept-modal { animation: none; transition: none; }
        }
      `}</style>
    </div>
  );
}

export default Departments;