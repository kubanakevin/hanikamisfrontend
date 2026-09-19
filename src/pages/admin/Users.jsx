// src/pages/admin/Users.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyUser = {
  email: "",
  password: "",
  full_name: "",
  role: "staff",
  department_id: "",
  is_active: true,
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

function Users() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(emptyUser);
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
          await Promise.all([fetchUsers(), fetchDepartments()]);
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

  const fetchUsers = async (opts = {}) => {
    try {
      const params = new URLSearchParams();
      const s = opts.search !== undefined ? opts.search : search;
      const r = opts.role !== undefined ? opts.role : roleFilter;
      const st = opts.status !== undefined ? opts.status : statusFilter;
      if (s) params.append("search", s);
      if (r) params.append("role", r);
      if (st) params.append("status", st);

      const res = await fetch(
        `${API_BASE}/api/admin/users?${params.toString()}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/programs/departments/list`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setDepartments(data.data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(emptyUser);
    setFormError("");
    setFormSuccess("");
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      email: u.email || "",
      password: "",
      full_name: u.full_name || "",
      role: u.role || "staff",
      department_id: u.department_id || "",
      is_active: u.is_active === 1 || u.is_active === true,
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
      const url = editingUser
        ? `${API_BASE}/api/admin/users/${editingUser.id}`
        : `${API_BASE}/api/admin/users`;
      const method = editingUser ? "PUT" : "POST";

      const body = { ...formData };
      // On edit: if password is blank, don't send it (leave unchanged)
      if (editingUser && !body.password) {
        delete body.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setFormSuccess(
          editingUser ? "User updated successfully!" : "User created successfully!"
        );
        await fetchUsers();
        setTimeout(() => {
          setShowModal(false);
          setFormSuccess("");
          setFormData(emptyUser);
        }, 1200);
      } else {
        setFormError(data.error || "Failed to save user");
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
      const res = await fetch(`${API_BASE}/api/admin/users/${deleteConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchUsers();
        setDeleteConfirm(null);
      } else {
        alert(data.error || "Failed to delete user");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchUsers();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers({ search });
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    fetchUsers({ role: value });
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    fetchUsers({ status: value });
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin": return "role-admin";
      case "editor": return "role-editor";
      case "viewer": return "role-viewer";
      default: return "role-staff";
    }
  };

  const getDepartmentName = (departmentId) => {
    if (!departmentId) return "—";
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.name : "—";
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
              <h1>Users</h1>
              <p className="page-subtitle">Manage admin panel users and their permissions</p>
            </div>
            <button className="users-btn-primary" onClick={openCreateModal}>
              + Add New User
            </button>
          </div>

          <div className="stats-summary">
            <div className="stat-box">
              <span className="stat-number">{users.length}</span>
              <span className="stat-label">Total Users</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{users.filter((u) => u.is_active).length}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{users.filter((u) => u.role === "admin").length}</span>
              <span className="stat-label">Admins</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{users.filter((u) => !u.is_active).length}</span>
              <span className="stat-label">Inactive</span>
            </div>
          </div>

          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="role-filter">Role:</label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
              >
                <option value="">All Roles</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
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
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="users-btn-secondary">Search</button>
            </form>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      <span className="empty-icon">👥</span>
                      <p>No users found. Click "Add New User" to create one.</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <strong>{u.full_name || "(no name)"}</strong>
                            <span className="user-email">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>
                          {u.role || "staff"}
                        </span>
                      </td>
                      <td>{getDepartmentName(u.department_id)}</td>
                      <td>
                        <button
                          className={`status-toggle ${u.is_active ? "active" : "inactive"}`}
                          onClick={() => toggleStatus(u.id, u.is_active)}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <span className="timestamp-cell">
                          {formatDateTime(u.last_login)}
                        </span>
                      </td>
                      <td>
                        <span className="timestamp-cell">
                          {formatDateTime(u.created_at)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => openEditModal(u)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => setDeleteConfirm(u.id)}
                            title="Delete"
                            disabled={u.id === user.id}
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

      {/* ===== USER MODAL ===== */}
      {showModal && (
        <div className="users-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="users-modal" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-head">
              <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
              <button className="users-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="users-modal-form">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">{formSuccess}</div>}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="full_name">Full Name *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="user@example.com"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="password">
                    Password {editingUser ? "(leave blank to keep current)" : "*"}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    placeholder={editingUser ? "••••••••" : "Minimum 6 characters"}
                    minLength={formData.password ? 6 : undefined}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="department_id">Department</label>
                  <select
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                  >
                    <option value="">None</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group checkbox-group full-width">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    Active (user can log in)
                  </label>
                </div>
              </div>

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="users-btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? "Saving..." : editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div className="users-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="users-modal users-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-head">
              <h2>Confirm Delete</h2>
              <button className="users-modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div className="users-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this user?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="users-modal-actions">
              <button
                className="users-btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="users-btn-danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete User"}
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
        @keyframes spin { to { transform: rotate(360deg); } }

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
        .admin-main.sidebar-closed { margin-left: 0; }
        .page-container { max-width: 1400px; margin: 0 auto; }

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
        .page-subtitle { font-size: 14px; color: #6B646B; margin: 4px 0 0; }

        /* ===== Buttons ===== */
        .users-btn-primary {
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
        .users-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .users-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .users-btn-secondary {
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
        .users-btn-secondary:hover { background: #D1C9D0; }
        .users-btn-secondary:disabled { opacity: 0.7; cursor: not-allowed; }
        .users-btn-danger {
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
        .users-btn-danger:hover { background: #B71C1C; }
        .users-btn-danger:disabled { opacity: 0.7; cursor: not-allowed; }

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
        .stat-label { font-size: 13px; color: #6B646B; }

        /* ===== Filter ===== */
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
        .filter-group select:focus {
          outline: none;
          border-color: #893C87;
        }
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
        .filter-search input:focus {
          outline: none;
          border-color: #893C87;
        }

        /* ===== Table ===== */
        .table-container {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E1D9E0;
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
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

        .user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .user-info {
          display: flex;
          flex-direction: column;
        }
        .user-info strong {
          font-size: 14px;
          color: #241F24;
        }
        .user-email {
          font-size: 12px;
          color: #8A7E88;
        }

        .role-badge {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .role-admin { background: #FDE8E8; color: #C62828; }
        .role-staff { background: #E3F2FD; color: #1565C0; }
        .role-editor { background: #FFF3E0; color: #E65100; }
        .role-viewer { background: #F1EDF0; color: #6B646B; }

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
        .action-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

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
        .users-modal-overlay {
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
        .users-modal {
          background: #FFFFFF !important;
          border-radius: 16px;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
          position: relative !important;
        }
        .users-modal-sm { max-width: 460px; }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .users-modal-head {
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
        .users-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .users-modal-close {
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
        .users-modal-close:hover { color: #241F24; }
        .users-modal-body {
          padding: 24px;
          text-align: center;
        }
        .users-modal-body p {
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
        .users-modal-form { padding: 24px; }
        .users-modal-actions {
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

        /* ===== Responsive ===== */
        @media (max-width: 1023px) {
          .admin-main { margin-left: 0 !important; }
        }
        @media (max-width: 768px) {
          .admin-main { padding: 16px; }
          .page-header { flex-direction: column; align-items: flex-start; }
          .stats-summary { grid-template-columns: repeat(2, 1fr); }
          .form-grid { grid-template-columns: 1fr; }
          .users-modal { max-width: 100%; margin: 10px; border-radius: 12px; }
          .users-modal-actions { flex-direction: column; }
          .users-modal-actions button { width: 100%; }
          .filter-container { flex-direction: column; }
          .filter-group { flex-direction: column; align-items: stretch; }
          .filter-group select { width: 100%; min-width: unset; }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-main,
          .users-modal-overlay,
          .users-modal { animation: none; transition: none; }
        }
      `}</style>
    </div>
  );
}

export default Users;