// src/pages/admin/AdminWhyChoose.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyFeature = {
    icon: "fas fa-star",
    title: "",
    description: "",
    display_order: 0,
    is_active: true,
};

// Common icon options
const ICON_OPTIONS = [
    "fas fa-star",
    "fas fa-graduation-cap",
    "fas fa-laptop-code",
    "fas fa-users",
    "fas fa-certificate",
    "fas fa-rocket",
    "fas fa-lightbulb",
    "fas fa-chart-line",
    "fas fa-shield-alt",
    "fas fa-handshake",
    "fas fa-brain",
    "fas fa-cogs",
    "fas fa-globe",
    "fas fa-heart",
    "fas fa-leaf",
    "fas fa-bolt",
    "fas fa-trophy",
    "fas fa-award",
    "fas fa-book",
    "fas fa-video",
    "fas fa-puzzle-piece",
    "fas fa-crown",
    "fas fa-gem",
    "fas fa-meteor",
    "fas fa-sparkles",
];

function AdminWhyChoose() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [features, setFeatures] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingFeature, setEditingFeature] = useState(null);
    const [formData, setFormData] = useState(emptyFeature);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
                const data = await res.json();
                if (data.success) {
                    setUser(data.user);
                    await fetchFeatures();
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

        const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, [navigate]);

    const fetchFeatures = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/why-choose-features`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) setFeatures(data.data);
        } catch (err) {
            console.error("Failed to fetch features:", err);
        }
    };

    const openModal = (feature = null) => {
        if (feature) {
            setEditingFeature(feature);
            setFormData({
                icon: feature.icon || "fas fa-star",
                title: feature.title || "",
                description: feature.description || "",
                display_order: feature.display_order || 0,
                is_active: feature.is_active === 1 || feature.is_active === true,
            });
        } else {
            setEditingFeature(null);
            setFormData(emptyFeature);
        }
        setFormError("");
        setFormSuccess("");
        setShowModal(true);
    };

    const handleChange = (e) => {
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
            const url = editingFeature
                ? `${API_BASE}/api/admin/why-choose-features/${editingFeature.id}`
                : `${API_BASE}/api/admin/why-choose-features`;
            const method = editingFeature ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (data.success) {
                setFormSuccess(editingFeature ? "Feature updated!" : "Feature added!");
                await fetchFeatures();
                setTimeout(() => {
                    setShowModal(false);
                    setFormSuccess("");
                    setFormData(emptyFeature);
                }, 1200);
            } else {
                setFormError(data.error || "Failed to save feature");
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
            const res = await fetch(`${API_BASE}/api/admin/why-choose-features/${deleteConfirm}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                await fetchFeatures();
                setDeleteConfirm(null);
            } else {
                alert(data.error || "Failed to delete feature");
            }
        } catch (err) {
            alert("Network error. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/why-choose-features/${id}/toggle-status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ is_active: !currentStatus }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchFeatures();
            } else {
                alert(data.error || "Failed to update status");
            }
        } catch (err) {
            alert("Network error. Please try again.");
        }
    };

    // Drag and drop reordering
    const handleDragStart = (e, index) => {
        setIsDragging(true);
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDraggedIndex(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e, targetIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setIsDragging(false);
            return;
        }

        const reorderedFeatures = [...features];
        const [draggedItem] = reorderedFeatures.splice(draggedIndex, 1);
        reorderedFeatures.splice(targetIndex, 0, draggedItem);

        // Update display_order values
        const updatedItems = reorderedFeatures.map((item, index) => ({
            id: item.id,
            display_order: index,
        }));

        // Optimistically update UI
        setFeatures(reorderedFeatures);
        setIsDragging(false);
        setDraggedIndex(null);

        // Send reorder to backend
        try {
            const res = await fetch(`${API_BASE}/api/admin/why-choose-features/reorder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ items: updatedItems }),
            });
            const data = await res.json();
            if (!data.success) {
                // Revert on failure
                await fetchFeatures();
                alert("Failed to reorder features");
            }
        } catch (err) {
            console.error("Reorder error:", err);
            await fetchFeatures();
            alert("Network error while reordering");
        }
    };

    const formatDateTime = (value) => {
        if (!value) return "—";
        try {
            return new Date(value).toLocaleString();
        } catch {
            return value;
        }
    };

    const truncate = (str, len = 80) => {
        if (!str) return "";
        return str.length > len ? `${str.slice(0, len)}…` : str;
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
                            <h1>Why Choose Us</h1>
                            <p className="page-subtitle">Manage the features that make your institution stand out</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary" onClick={() => openModal()}>
                                + New Feature
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "50px" }}>#</th>
                                    <th style={{ width: "60px" }}>Icon</th>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th style={{ width: "100px" }}>Status</th>
                                    <th style={{ width: "150px" }}>Updated</th>
                                    <th style={{ width: "120px" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {features.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="empty-state">
                                            <span className="empty-icon">⭐</span>
                                            <p>No features found. Click "New Feature" to add one.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    features.map((feature, index) => (
                                        <tr
                                            key={feature.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            className={isDragging && draggedIndex === index ? "dragging" : ""}
                                        >
                                            <td>
                                                <span className="drag-handle">⠿</span>
                                                <span className="order-number">{index + 1}</span>
                                            </td>
                                            <td>
                                                <span className="feature-icon">
                                                    <i className={feature.icon}></i>
                                                </span>
                                            </td>
                                            <td>
                                                <div className="feature-title-cell">
                                                    <div>
                                                        <strong>{feature.title}</strong>
                                                        <p className="feature-meta">
                                                            Order: {feature.display_order || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <p className="feature-description">{truncate(feature.description, 100)}</p>
                                            </td>
                                            <td>
                                                <button
                                                    className={`status-toggle ${feature.is_active ? "active" : "inactive"}`}
                                                    onClick={() => toggleStatus(feature.id, feature.is_active)}
                                                >
                                                    {feature.is_active ? "Active" : "Inactive"}
                                                </button>
                                            </td>
                                            <td>
                                                <span className="timestamp-cell">{formatDateTime(feature.updated_at)}</span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => openModal(feature)}
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => setDeleteConfirm(feature.id)}
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
                    {features.length > 1 && (
                        <p className="drag-hint">🔄 Drag rows to reorder features</p>
                    )}
                </div>
            </main>

            {/* ===== MODAL ===== */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>{editingFeature ? "Edit Feature" : "New Feature"}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {formError && <div className="form-error">{formError}</div>}
                            {formSuccess && <div className="form-success">{formSuccess}</div>}

                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="f-icon">Icon *</label>
                                    <select
                                        id="f-icon"
                                        name="icon"
                                        value={formData.icon}
                                        onChange={handleChange}
                                        required
                                        className="icon-select"
                                    >
                                        {ICON_OPTIONS.map((icon) => (
                                            <option key={icon} value={icon}>
                                                <i className={icon}></i> {icon.replace("fas fa-", "")}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="f-title">Title *</label>
                                    <input
                                        type="text"
                                        id="f-title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., Expert Faculty"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="f-description">Description *</label>
                                    <textarea
                                        id="f-description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="4"
                                        required
                                        placeholder="Describe this feature in detail..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="f-display-order">Display Order</label>
                                    <input
                                        type="number"
                                        id="f-display-order"
                                        name="display_order"
                                        value={formData.display_order}
                                        onChange={handleChange}
                                        min="0"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleChange}
                                        />
                                        Active
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={formLoading}>
                                    {formLoading ? "Saving..." : editingFeature ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRM ===== */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h2>Confirm Delete</h2>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="delete-icon">🗑️</div>
                            <p>Are you sure you want to delete this feature?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete Feature"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== STYLES ===== */}
            <style>{`
                /* Loading */
                .loading-page {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    gap: 16px;
                }
                .loading-spinner {
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

                /* Layout */
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

                /* Header */
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

                /* Buttons */
                .btn-primary {
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
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
                }
                .btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }
                .btn-secondary {
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
                .btn-secondary:hover {
                    background: #D1C9D0;
                }
                .btn-danger {
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
                .btn-danger:hover {
                    background: #B71C1C;
                }
                .btn-danger:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                /* Table */
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
                    white-space: nowrap;
                }
                .data-table td {
                    padding: 14px 16px;
                    border-bottom: 1px solid #E1D9E0;
                    font-size: 14px;
                    color: #241F24;
                    vertical-align: middle;
                }
                .data-table tr:last-child td {
                    border-bottom: none;
                }
                .data-table tbody tr:hover {
                    background: #FBF9FA;
                }
                .data-table tr.dragging {
                    opacity: 0.5;
                }

                .drag-handle {
                    cursor: grab;
                    color: #B5ADB5;
                    font-size: 16px;
                    margin-right: 8px;
                    user-select: none;
                }
                .drag-handle:active {
                    cursor: grabbing;
                }
                .order-number {
                    font-size: 12px;
                    color: #8A7E88;
                }

                .feature-icon {
                    font-size: 24px;
                    color: #893C87;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background: #F3EAF2;
                    border-radius: 8px;
                }
                .feature-title-cell {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                }
                .feature-meta {
                    font-size: 12px;
                    color: #8A7E88;
                    margin: 2px 0 0;
                }
                .feature-description {
                    font-size: 13px;
                    color: #4A444A;
                    margin: 0;
                    line-height: 1.4;
                }
                .drag-hint {
                    font-size: 13px;
                    color: #8A7E88;
                    margin-top: 12px;
                    text-align: center;
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

                /* Modal */
                .modal-overlay {
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
                .modal {
                    background: #FFFFFF !important;
                    border-radius: 16px;
                    max-width: 800px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease;
                    position: relative !important;
                    display: flex !important;
                    flex-direction: column;
                }
                .modal-lg {
                    max-width: 800px;
                }
                .modal-sm {
                    max-width: 480px;
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-head {
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
                .modal-head h2 {
                    font-family: 'Fraunces', serif;
                    font-size: 22px;
                    font-weight: 600;
                    color: #241F24;
                    margin: 0;
                }
                .modal-close {
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
                .modal-close:hover {
                    color: #241F24;
                }
                .modal-body {
                    padding: 24px;
                    text-align: center;
                }
                .modal-body p {
                    font-size: 15px;
                    color: #4A444A;
                    margin: 8px 0;
                }
                .modal-form {
                    padding: 24px;
                }
                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    padding: 16px 24px;
                    border-top: 1px solid #E1D9E0;
                    position: sticky;
                    bottom: 0;
                    background: #FFFFFF;
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

                /* Form */
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
                .icon-select option {
                    padding: 4px;
                }
                .icon-select option i {
                    margin-right: 8px;
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

                /* Empty State */
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

                /* Responsive */
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
                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                    .modal {
                        max-width: 100%;
                        margin: 10px;
                        border-radius: 12px;
                    }
                    .modal-actions {
                        flex-direction: column;
                    }
                    .modal-actions button {
                        width: 100%;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .admin-main,
                    .modal-overlay,
                    .modal {
                        animation: none;
                        transition: none;
                    }
                }
            `}</style>
        </div>
    );
}

export default AdminWhyChoose;