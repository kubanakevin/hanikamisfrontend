// src/pages/admin/AiAssistant.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyKnowledge = {
  category: "",
  title: "",
  content: "",
  keywords: "",
  is_active: true,
  display_order: 0,
};

function AiAssistant() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("knowledge"); // "knowledge" | "conversations"

  // Shared stats
  const [stats, setStats] = useState(null);

  // ----- Knowledge state -----
  const [knowledgeEntries, setKnowledgeEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [knowledgeForm, setKnowledgeForm] = useState(emptyKnowledge);
  const [knowledgeFile, setKnowledgeFile] = useState(null);
  const [knowledgePreview, setKnowledgePreview] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [knowledgeFormLoading, setKnowledgeFormLoading] = useState(false);
  const [knowledgeFormError, setKnowledgeFormError] = useState("");
  const [knowledgeFormSuccess, setKnowledgeFormSuccess] = useState("");
  const [deleteKnowledgeConfirm, setDeleteKnowledgeConfirm] = useState(null);
  const [isDeletingKnowledge, setIsDeletingKnowledge] = useState(false);

  // ----- Conversation state -----
  const [conversations, setConversations] = useState([]);
  const [conversationStatusFilter, setConversationStatusFilter] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [viewingConversation, setViewingConversation] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [deleteConversationConfirm, setDeleteConversationConfirm] = useState(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          await Promise.all([fetchKnowledge(), fetchCategories(), fetchConversations(), fetchStats()]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (knowledgePreview && knowledgePreview.startsWith("blob:")) {
        URL.revokeObjectURL(knowledgePreview);
      }
    };
  }, [knowledgePreview]);

  // ===================== SHARED =====================

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai/stats`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error("Failed to fetch AI stats:", err);
    }
  };

  // ===================== KNOWLEDGE FUNCTIONS =====================

  const fetchKnowledge = async (opts = {}) => {
    try {
      const params = new URLSearchParams();
      const cat = opts.category !== undefined ? opts.category : categoryFilter;
      const search = opts.search !== undefined ? opts.search : knowledgeSearch;
      if (cat) params.append("category", cat);
      if (search) params.append("search", search);

      const res = await fetch(`${API_BASE}/api/admin/ai/knowledge?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setKnowledgeEntries(data.data);
    } catch (err) {
      console.error("Failed to fetch knowledge entries:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai/knowledge/categories`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const resetKnowledgeImageState = () => {
    setKnowledgeFile(null);
    setKnowledgePreview(null);
    setRemoveExistingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openKnowledgeModal = (entry = null) => {
    if (entry) {
      setEditingKnowledge(entry);
      setKnowledgeForm({
        category: entry.category || "",
        title: entry.title || "",
        content: entry.content || "",
        keywords: entry.keywords || "",
        is_active: entry.is_active === 1 || entry.is_active === true,
        display_order: entry.display_order || 0,
      });
      resetKnowledgeImageState();
    } else {
      setEditingKnowledge(null);
      setKnowledgeForm(emptyKnowledge);
      resetKnowledgeImageState();
    }
    setKnowledgeFormError("");
    setKnowledgeFormSuccess("");
    setShowKnowledgeModal(true);
  };

  const handleKnowledgeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setKnowledgeForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (knowledgeFormError) setKnowledgeFormError("");
    if (knowledgeFormSuccess) setKnowledgeFormSuccess("");
  };

  const handleKnowledgeFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setKnowledgeFormError("Only JPG, PNG, WEBP, or GIF images are allowed");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setKnowledgeFormError("Image must be under 10MB");
      e.target.value = "";
      return;
    }

    if (knowledgePreview && knowledgePreview.startsWith("blob:")) URL.revokeObjectURL(knowledgePreview);
    setKnowledgeFile(file);
    setKnowledgePreview(URL.createObjectURL(file));
    setRemoveExistingImage(false);
    if (knowledgeFormError) setKnowledgeFormError("");
  };

  const handleRemoveKnowledgeImage = () => {
    if (knowledgePreview && knowledgePreview.startsWith("blob:")) URL.revokeObjectURL(knowledgePreview);
    setKnowledgeFile(null);
    setKnowledgePreview(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKnowledgeSubmit = async (e) => {
    e.preventDefault();
    setKnowledgeFormLoading(true);
    setKnowledgeFormError("");
    setKnowledgeFormSuccess("");

    try {
      const url = editingKnowledge
        ? `${API_BASE}/api/admin/ai/knowledge/${editingKnowledge.id}`
        : `${API_BASE}/api/admin/ai/knowledge`;
      const method = editingKnowledge ? "PUT" : "POST";

      const body = new FormData();
      Object.entries(knowledgeForm).forEach(([key, value]) => {
        body.append(key, value);
      });
      if (knowledgeFile) body.append("image", knowledgeFile);
      if (editingKnowledge && removeExistingImage) body.append("remove_image", "true");

      const res = await fetch(url, { method, credentials: "include", body });
      const data = await res.json();

      if (data.success) {
        setKnowledgeFormSuccess(editingKnowledge ? "Knowledge entry updated!" : "Knowledge entry added!");
        await fetchKnowledge();
        await fetchCategories();
        setTimeout(() => {
          setShowKnowledgeModal(false);
          setKnowledgeFormSuccess("");
          setKnowledgeForm(emptyKnowledge);
          resetKnowledgeImageState();
        }, 1200);
      } else {
        setKnowledgeFormError(data.error || "Failed to save knowledge entry");
      }
    } catch (err) {
      setKnowledgeFormError("Network error. Please try again.");
    } finally {
      setKnowledgeFormLoading(false);
    }
  };

  const handleDeleteKnowledge = async () => {
    if (!deleteKnowledgeConfirm) return;
    setIsDeletingKnowledge(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai/knowledge/${deleteKnowledgeConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchKnowledge();
        await fetchCategories();
        await fetchStats();
        setDeleteKnowledgeConfirm(null);
      } else {
        alert(data.error || "Failed to delete knowledge entry");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeletingKnowledge(false);
    }
  };

  const toggleKnowledgeStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai/knowledge/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchKnowledge();
        await fetchStats();
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    fetchKnowledge({ category: value });
  };

  const handleKnowledgeSearchSubmit = (e) => {
    e.preventDefault();
    fetchKnowledge({ search: knowledgeSearch });
  };

  // ===================== CONVERSATION FUNCTIONS =====================

  const fetchConversations = async (opts = {}) => {
    try {
      const params = new URLSearchParams();
      const status = opts.status !== undefined ? opts.status : conversationStatusFilter;
      const search = opts.search !== undefined ? opts.search : conversationSearch;
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      const res = await fetch(`${API_BASE}/api/admin/ai/conversations?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  const handleConversationStatusFilterChange = (value) => {
    setConversationStatusFilter(value);
    fetchConversations({ status: value });
  };

  const handleConversationSearchSubmit = (e) => {
    e.preventDefault();
    fetchConversations({ search: conversationSearch });
  };

  const openConversation = async (id) => {
    setConversationLoading(true);
    setViewingConversation({ id, messages: [] });
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai/conversations/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setViewingConversation(data.data);
      } else {
        alert(data.error || "Failed to load conversation");
        setViewingConversation(null);
      }
    } catch (err) {
      alert("Network error. Please try again.");
      setViewingConversation(null);
    } finally {
      setConversationLoading(false);
    }
  };

  const handleConversationStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai/conversations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchConversations();
        if (viewingConversation?.id === id) await openConversation(id);
      } else {
        alert(data.error || "Failed to update conversation status");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const handleDeleteConversation = async () => {
    if (!deleteConversationConfirm) return;
    setIsDeletingConversation(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai/conversations/${deleteConversationConfirm}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchConversations();
        await fetchStats();
        if (viewingConversation?.id === deleteConversationConfirm) setViewingConversation(null);
        setDeleteConversationConfirm(null);
      } else {
        alert(data.error || "Failed to delete conversation");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsDeletingConversation(false);
    }
  };

  const resolveImageSrc = (imageUrl) => (imageUrl ? `${API_BASE}${imageUrl}` : null);

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const truncate = (str, len = 60) => {
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
              <h1>AI Assistant</h1>
              <p className="page-subtitle">Manage the knowledge base and review visitor conversations</p>
            </div>
            <div className="header-actions">
              {activeTab === "knowledge" && (
                <button className="ai-btn-primary" onClick={() => openKnowledgeModal()}>
                  + New Knowledge Entry
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="stats-summary">
              <div className="stat-box">
                <span className="stat-number">{stats.total_conversations || 0}</span>
                <span className="stat-label">Total Conversations</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{stats.active_conversations || 0}</span>
                <span className="stat-label">Active Now</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{stats.total_messages || 0}</span>
                <span className="stat-label">Total Messages</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{stats.unmatched_user_messages || 0}</span>
                <span className="stat-label">Unmatched Questions</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{stats.active_knowledge_entries || 0}</span>
                <span className="stat-label">Active Knowledge Entries</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="ai-tabs">
            <button
              className={`ai-tab ${activeTab === "knowledge" ? "active" : ""}`}
              onClick={() => setActiveTab("knowledge")}
            >
              📚 Knowledge Base ({knowledgeEntries.length})
            </button>
            <button
              className={`ai-tab ${activeTab === "conversations" ? "active" : ""}`}
              onClick={() => setActiveTab("conversations")}
            >
              💬 Conversations ({conversations.length})
            </button>
          </div>

          {/* ===================== KNOWLEDGE TAB ===================== */}
          {activeTab === "knowledge" && (
            <>
              <div className="filter-container">
                <div className="filter-group">
                  <label htmlFor="category-filter">Category:</label>
                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={(e) => handleCategoryFilterChange(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category} ({cat.entry_count})
                      </option>
                    ))}
                  </select>
                </div>
                <form className="filter-search" onSubmit={handleKnowledgeSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Search title, content, or keywords..."
                    value={knowledgeSearch}
                    onChange={(e) => setKnowledgeSearch(e.target.value)}
                  />
                  <button type="submit" className="ai-btn-secondary">Search</button>
                </form>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Keywords</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {knowledgeEntries.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          <span className="empty-icon">📚</span>
                          <p>No knowledge entries found. Click "New Knowledge Entry" to create one.</p>
                        </td>
                      </tr>
                    ) : (
                      knowledgeEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <div className="knowledge-title-cell">
                              {entry.image_url && (
                                <img
                                  src={resolveImageSrc(entry.image_url)}
                                  alt=""
                                  className="knowledge-thumb"
                                />
                              )}
                              <div>
                                <strong>{entry.title}</strong>
                                <p className="knowledge-preview">{truncate(entry.content, 80)}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="category-tag">{entry.category}</span>
                          </td>
                          <td>
                            <span className="keywords-cell">{truncate(entry.keywords, 40) || "—"}</span>
                          </td>
                          <td>{entry.display_order || 0}</td>
                          <td>
                            <button
                              className={`status-toggle ${entry.is_active ? "active" : "inactive"}`}
                              onClick={() => toggleKnowledgeStatus(entry.id, entry.is_active)}
                            >
                              {entry.is_active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td>
                            <span className="timestamp-cell">{formatDateTime(entry.updated_at)}</span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit"
                                onClick={() => openKnowledgeModal(entry)}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => setDeleteKnowledgeConfirm(entry.id)}
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

          {/* ===================== CONVERSATIONS TAB ===================== */}
          {activeTab === "conversations" && (
            <>
              <div className="filter-container">
                <div className="filter-group">
                  <label htmlFor="status-filter">Status:</label>
                  <select
                    id="status-filter"
                    value={conversationStatusFilter}
                    onChange={(e) => handleConversationStatusFilterChange(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <form className="filter-search" onSubmit={handleConversationSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Search by session ID or IP..."
                    value={conversationSearch}
                    onChange={(e) => setConversationSearch(e.target.value)}
                  />
                  <button type="submit" className="ai-btn-secondary">Search</button>
                </form>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th>Visitor IP</th>
                      <th>Status</th>
                      <th>Started</th>
                      <th>Last Activity</th>
                      <th>Messages</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          <span className="empty-icon">💬</span>
                          <p>No conversations yet. They'll show up here once visitors chat with the assistant.</p>
                        </td>
                      </tr>
                    ) : (
                      conversations.map((conv) => (
                        <tr key={conv.id}>
                          <td>
                            <span className="session-id">{truncate(conv.session_id, 18)}</span>
                            {conv.last_message && (
                              <p className="last-message-preview">{truncate(conv.last_message, 60)}</p>
                            )}
                          </td>
                          <td>{conv.user_ip || "—"}</td>
                          <td>
                            <span className={`status-pill status-${conv.status}`}>{conv.status}</span>
                          </td>
                          <td>
                            <span className="timestamp-cell">{formatDateTime(conv.started_at)}</span>
                          </td>
                          <td>
                            <span className="timestamp-cell">
                              {formatDateTime(conv.last_message_at || conv.ended_at)}
                            </span>
                          </td>
                          <td>{conv.message_count || 0}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn view"
                                onClick={() => openConversation(conv.id)}
                                title="View conversation"
                              >
                                👁️
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => setDeleteConversationConfirm(conv.id)}
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
        </div>
      </main>

      {/* ===================== KNOWLEDGE MODAL ===================== */}
      {showKnowledgeModal && (
        <div className="ai-modal-overlay" onClick={() => setShowKnowledgeModal(false)}>
          <div className="ai-modal ai-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-head">
              <h2>{editingKnowledge ? "Edit Knowledge Entry" : "New Knowledge Entry"}</h2>
              <button className="ai-modal-close" onClick={() => setShowKnowledgeModal(false)}>×</button>
            </div>

            <form onSubmit={handleKnowledgeSubmit} className="ai-modal-form">
              {knowledgeFormError && <div className="form-error">{knowledgeFormError}</div>}
              {knowledgeFormSuccess && <div className="form-success">{knowledgeFormSuccess}</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="k-category">Category *</label>
                  <input
                    type="text"
                    id="k-category"
                    name="category"
                    list="category-suggestions"
                    value={knowledgeForm.category}
                    onChange={handleKnowledgeChange}
                    required
                    placeholder="e.g., Admissions"
                  />
                  <datalist id="category-suggestions">
                    {categories.map((cat) => (
                      <option key={cat.category} value={cat.category} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label htmlFor="k-title">Title *</label>
                  <input
                    type="text"
                    id="k-title"
                    name="title"
                    value={knowledgeForm.title}
                    onChange={handleKnowledgeChange}
                    required
                    placeholder="e.g., How do I apply?"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="k-content">Answer / Content *</label>
                  <textarea
                    id="k-content"
                    name="content"
                    value={knowledgeForm.content}
                    onChange={handleKnowledgeChange}
                    rows="5"
                    required
                    placeholder="The full answer the assistant should give when this entry matches."
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="k-keywords">Keywords</label>
                  <input
                    type="text"
                    id="k-keywords"
                    name="keywords"
                    value={knowledgeForm.keywords}
                    onChange={handleKnowledgeChange}
                    placeholder="Comma-separated terms that should trigger this entry, e.g. apply, admission, enroll"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Illustrative Image (optional)</label>
                  <div className="image-upload-area">
                    {knowledgePreview ? (
                      <img src={knowledgePreview} alt="Preview" className="image-preview" />
                    ) : editingKnowledge?.image_url && !removeExistingImage ? (
                      <img
                        src={resolveImageSrc(editingKnowledge.image_url)}
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
                        onChange={handleKnowledgeFileChange}
                      />
                      {(knowledgePreview || (editingKnowledge?.image_url && !removeExistingImage)) && (
                        <button type="button" className="ai-btn-link" onClick={handleRemoveKnowledgeImage}>
                          Remove image
                        </button>
                      )}
                      <span className="image-hint">JPG, PNG, WEBP or GIF, up to 10MB</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="k-display-order">Display Order</label>
                  <input
                    type="number"
                    id="k-display-order"
                    name="display_order"
                    value={knowledgeForm.display_order}
                    onChange={handleKnowledgeChange}
                    placeholder="0"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={knowledgeForm.is_active}
                      onChange={handleKnowledgeChange}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="ai-modal-actions">
                <button type="button" className="ai-btn-secondary" onClick={() => setShowKnowledgeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ai-btn-primary" disabled={knowledgeFormLoading}>
                  {knowledgeFormLoading ? "Saving..." : editingKnowledge ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CONVERSATION VIEW MODAL ===================== */}
      {viewingConversation && (
        <div className="ai-modal-overlay" onClick={() => setViewingConversation(null)}>
          <div className="ai-modal ai-modal-lg ai-modal-chat" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-head">
              <div>
                <h2>Conversation #{viewingConversation.id}</h2>
                {viewingConversation.session_id && (
                  <p className="chat-meta-line">
                    Session: {viewingConversation.session_id} · {viewingConversation.user_ip || "unknown IP"}
                  </p>
                )}
              </div>
              <button className="ai-modal-close" onClick={() => setViewingConversation(null)}>×</button>
            </div>

            {conversationLoading ? (
              <div className="chat-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <>
                <div className="chat-status-bar">
                  <span className={`status-pill status-${viewingConversation.status}`}>
                    {viewingConversation.status}
                  </span>
                  <div className="chat-status-actions">
                    {["active", "closed", "resolved", "archived"]
                      .filter((s) => s !== viewingConversation.status)
                      .map((s) => (
                        <button
                          key={s}
                          className="ai-btn-link"
                          onClick={() => handleConversationStatusChange(viewingConversation.id, s)}
                        >
                          Mark {s}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="chat-thread">
                  {viewingConversation.messages && viewingConversation.messages.length > 0 ? (
                    viewingConversation.messages.map((msg) => (
                      <div key={msg.id} className={`chat-bubble-row ${msg.sender === "user" ? "from-user" : "from-ai"}`}>
                        <div className="chat-bubble">
                          <div className="chat-bubble-head">
                            <span className="chat-sender">{msg.sender === "user" ? "Visitor" : "Assistant"}</span>
                            <span className="chat-time">{formatDateTime(msg.created_at)}</span>
                          </div>
                          {msg.image_url && (
                            <img src={resolveImageSrc(msg.image_url)} alt="" className="chat-bubble-image" />
                          )}
                          <p className="chat-bubble-text">{msg.message}</p>
                          {msg.matched_knowledge_title && (
                            <span className="matched-knowledge-tag">
                              Matched: {msg.matched_knowledge_title}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-full">
                      <span className="empty-icon">💬</span>
                      <p>No messages in this conversation.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="ai-modal-actions">
              <button
                className="ai-btn-danger"
                onClick={() => setDeleteConversationConfirm(viewingConversation.id)}
              >
                Delete Conversation
              </button>
              <button className="ai-btn-secondary" onClick={() => setViewingConversation(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRM MODALS ===================== */}
      {deleteKnowledgeConfirm && (
        <div className="ai-modal-overlay" onClick={() => setDeleteKnowledgeConfirm(null)}>
          <div className="ai-modal ai-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-head">
              <h2>Confirm Delete</h2>
              <button className="ai-modal-close" onClick={() => setDeleteKnowledgeConfirm(null)}>×</button>
            </div>
            <div className="ai-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this knowledge entry?</p>
              <p className="delete-warning">The assistant will no longer be able to use it to answer questions.</p>
            </div>
            <div className="ai-modal-actions">
              <button className="ai-btn-secondary" onClick={() => setDeleteKnowledgeConfirm(null)} disabled={isDeletingKnowledge}>
                Cancel
              </button>
              <button className="ai-btn-danger" onClick={handleDeleteKnowledge} disabled={isDeletingKnowledge}>
                {isDeletingKnowledge ? "Deleting..." : "Delete Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConversationConfirm && (
        <div className="ai-modal-overlay" onClick={() => setDeleteConversationConfirm(null)}>
          <div className="ai-modal ai-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-head">
              <h2>Confirm Delete</h2>
              <button className="ai-modal-close" onClick={() => setDeleteConversationConfirm(null)}>×</button>
            </div>
            <div className="ai-modal-body">
              <div className="delete-icon">🗑️</div>
              <p>Are you sure you want to delete this conversation?</p>
              <p className="delete-warning">All messages in it will be permanently removed.</p>
            </div>
            <div className="ai-modal-actions">
              <button className="ai-btn-secondary" onClick={() => setDeleteConversationConfirm(null)} disabled={isDeletingConversation}>
                Cancel
              </button>
              <button className="ai-btn-danger" onClick={handleDeleteConversation} disabled={isDeletingConversation}>
                {isDeletingConversation ? "Deleting..." : "Delete Conversation"}
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
        .loading-page .loading-spinner,
        .chat-loading .loading-spinner {
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
        .ai-btn-primary {
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
        .ai-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .ai-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .ai-btn-secondary {
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
        .ai-btn-secondary:hover {
          background: #D1C9D0;
        }
        .ai-btn-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .ai-btn-danger {
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
        .ai-btn-danger:hover {
          background: #B71C1C;
        }
        .ai-btn-danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .ai-btn-link {
          background: none;
          border: none;
          color: #893C87;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-align: left;
        }
        .ai-btn-link:hover {
          text-decoration: underline;
        }

        /* ===== Tabs ===== */
        .ai-tabs {
          display: flex;
          gap: 4px;
          background: #FFFFFF;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #E1D9E0;
          margin-bottom: 24px;
          width: fit-content;
        }
        .ai-tab {
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #6B646B;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .ai-tab:hover {
          background: #F3EAF2;
          color: #4A444A;
        }
        .ai-tab.active {
          background: #893C87;
          color: #FFFFFF;
        }
        .ai-tab.active:hover {
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
          min-width: 180px;
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
          vertical-align: top;
        }
        .data-table tr:last-child td {
          border-bottom: none;
        }
        .data-table tbody tr:hover {
          background: #FBF9FA;
        }

        .knowledge-title-cell {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          max-width: 320px;
        }
        .knowledge-thumb {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .knowledge-preview {
          font-size: 12px;
          color: #8A7E88;
          margin: 4px 0 0;
        }
        .keywords-cell {
          font-size: 13px;
          color: #6B646B;
        }
        .timestamp-cell {
          font-size: 12px;
          color: #8A7E88;
          white-space: nowrap;
        }
        .category-tag {
          display: inline-block;
          padding: 2px 10px;
          background: #F3EAF2;
          color: #893C87;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .session-id {
          font-family: monospace;
          font-size: 13px;
          color: #241F24;
        }
        .last-message-preview {
          font-size: 12px;
          color: #8A7E88;
          margin: 4px 0 0;
          max-width: 240px;
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

        .status-pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .status-pill.status-active {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .status-pill.status-closed {
          background: #FDE8E8;
          color: #C62828;
        }
        .status-pill.status-resolved {
          background: #E3F2FD;
          color: #1565C0;
        }
        .status-pill.status-archived {
          background: #F3EAF2;
          color: #6B646B;
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
        .action-btn.view:hover {
          background: #E3F2FD;
        }
        .action-btn.delete:hover {
          background: #FDE8E8;
        }

        /* ===== Modal ===== */
        .ai-modal-overlay {
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
        .ai-modal {
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
        .ai-modal-lg {
          max-width: 900px;
        }
        .ai-modal-sm {
          max-width: 480px;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .ai-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 24px;
          border-bottom: 1px solid #E1D9E0;
          position: sticky;
          top: 0;
          background: #FFFFFF;
          border-radius: 16px 16px 0 0;
          z-index: 1;
        }
        .ai-modal-head h2 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .chat-meta-line {
          font-size: 12px;
          color: #8A7E88;
          margin: 4px 0 0;
          font-family: monospace;
        }
        .ai-modal-close {
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
          flex-shrink: 0;
        }
        .ai-modal-close:hover {
          color: #241F24;
        }
        .ai-modal-body {
          padding: 24px;
          text-align: center;
        }
        .ai-modal-body p {
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
        .ai-modal-form {
          padding: 24px;
        }
        .ai-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #E1D9E0;
          position: sticky;
          bottom: 0;
          background: #FFFFFF;
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

        /* ===== Empty States ===== */
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
        .empty-state-full {
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
          margin: 0;
        }

        /* ===== Chat thread ===== */
        .ai-modal-chat {
          max-width: 720px;
        }
        .chat-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
        }
        .chat-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #E1D9E0;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chat-status-actions {
          display: flex;
          gap: 14px;
        }
        .chat-thread {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #FBF9FA;
          flex: 1;
        }
        .chat-bubble-row {
          display: flex;
        }
        .chat-bubble-row.from-user {
          justify-content: flex-start;
        }
        .chat-bubble-row.from-ai {
          justify-content: flex-end;
        }
        .chat-bubble {
          max-width: 78%;
          padding: 12px 16px;
          border-radius: 14px;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
        }
        .chat-bubble-row.from-ai .chat-bubble {
          background: #F3EAF2;
          border-color: #E7D3E6;
        }
        .chat-bubble-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 4px;
        }
        .chat-sender {
          font-size: 12px;
          font-weight: 700;
          color: #893C87;
        }
        .chat-time {
          font-size: 11px;
          color: #8A7E88;
          white-space: nowrap;
        }
        .chat-bubble-text {
          font-size: 14px;
          color: #241F24;
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.5;
        }
        .chat-bubble-image {
          width: 100%;
          max-width: 260px;
          border-radius: 8px;
          margin-bottom: 8px;
          display: block;
        }
        .matched-knowledge-tag {
          display: inline-block;
          margin-top: 8px;
          padding: 2px 10px;
          background: #E8F5E9;
          color: #2E7D32;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
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
          .ai-modal {
            max-width: 100%;
            margin: 10px;
            border-radius: 12px;
          }
          .ai-modal-actions {
            flex-direction: column;
          }
          .ai-modal-actions button {
            width: 100%;
          }
          .filter-container {
            flex-direction: column;
          }
          .filter-group {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-group select {
            width: 100%;
            min-width: unset;
          }
          .chat-bubble {
            max-width: 90%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-main,
          .ai-modal-overlay,
          .ai-modal {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

export default AiAssistant;