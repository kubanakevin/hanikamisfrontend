// src/pages/admin/ContactInfo.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const emptyInfo = {
  address: "",
  phone_primary: "",
  phone_secondary: "",
  email_primary: "",
  email_secondary: "",
  office_hours: "",
  map_embed_url: "",
  latitude: "",
  longitude: "",
  facebook_url: "",
  twitter_url: "",
  instagram_url: "",
  linkedin_url: "",
  youtube_url: "",
  whatsapp_number: "",
};

function ContactInfo() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [form, setForm] = useState(emptyInfo);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          await loadInfo();
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

  const loadInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/contact/info`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setForm({
          address: d.address || "",
          phone_primary: d.phone_primary || "",
          phone_secondary: d.phone_secondary || "",
          email_primary: d.email_primary || "",
          email_secondary: d.email_secondary || "",
          office_hours: d.office_hours || "",
          map_embed_url: d.map_embed_url || "",
          latitude: d.latitude ?? "",
          longitude: d.longitude ?? "",
          facebook_url: d.facebook_url || "",
          twitter_url: d.twitter_url || "",
          instagram_url: d.instagram_url || "",
          linkedin_url: d.linkedin_url || "",
          youtube_url: d.youtube_url || "",
          whatsapp_number: d.whatsapp_number || "",
        });
      }
    } catch (err) {
      console.error("Load contact info error:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    setFormSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/contact/info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess("Contact info saved successfully.");
        await loadInfo();
        setTimeout(() => setFormSuccess(""), 2500);
      } else {
        setFormError(data.error || "Failed to save");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
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
      <AdminHeader
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className={`admin-main ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1>Contact Info</h1>
              <p className="page-subtitle">
                Manage address, phones, emails, office hours, map, and socials
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="contact-form-card">
            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">{formSuccess}</div>}

            {/* Basic Info */}
            <section className="form-section">
              <h2>Basic Information</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="ci-address">Address</label>
                  <textarea
                    id="ci-address"
                    name="address"
                    rows="2"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street, City, Country"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-phone1">Primary Phone</label>
                  <input
                    id="ci-phone1"
                    name="phone_primary"
                    type="text"
                    value={form.phone_primary}
                    onChange={handleChange}
                    placeholder="+250 ..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-phone2">Secondary Phone</label>
                  <input
                    id="ci-phone2"
                    name="phone_secondary"
                    type="text"
                    value={form.phone_secondary}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-email1">Primary Email</label>
                  <input
                    id="ci-email1"
                    name="email_primary"
                    type="email"
                    value={form.email_primary}
                    onChange={handleChange}
                    placeholder="info@school.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-email2">Secondary Email</label>
                  <input
                    id="ci-email2"
                    name="email_secondary"
                    type="email"
                    value={form.email_secondary}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="ci-hours">Office Hours</label>
                  <textarea
                    id="ci-hours"
                    name="office_hours"
                    rows="2"
                    value={form.office_hours}
                    onChange={handleChange}
                    placeholder="Mon–Fri: 8:00 AM – 5:00 PM"
                  />
                </div>
              </div>
            </section>

            {/* Map */}
            <section className="form-section">
              <h2>Map Location</h2>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="ci-map">
                    Map Embed URL (optional — overrides lat/long below)
                  </label>
                  <input
                    id="ci-map"
                    name="map_embed_url"
                    type="text"
                    value={form.map_embed_url}
                    onChange={handleChange}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-lat">Latitude</label>
                  <input
                    id="ci-lat"
                    name="latitude"
                    type="text"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="-1.9441"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-lng">Longitude</label>
                  <input
                    id="ci-lng"
                    name="longitude"
                    type="text"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="30.0619"
                  />
                </div>
              </div>
            </section>

            {/* Socials */}
            <section className="form-section">
              <h2>Social & Contact Links</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="ci-fb">Facebook URL</label>
                  <input
                    id="ci-fb"
                    name="facebook_url"
                    type="text"
                    value={form.facebook_url}
                    onChange={handleChange}
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-tw">Twitter / X URL</label>
                  <input
                    id="ci-tw"
                    name="twitter_url"
                    type="text"
                    value={form.twitter_url}
                    onChange={handleChange}
                    placeholder="https://twitter.com/..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-ig">Instagram URL</label>
                  <input
                    id="ci-ig"
                    name="instagram_url"
                    type="text"
                    value={form.instagram_url}
                    onChange={handleChange}
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-li">LinkedIn URL</label>
                  <input
                    id="ci-li"
                    name="linkedin_url"
                    type="text"
                    value={form.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-yt">YouTube URL</label>
                  <input
                    id="ci-yt"
                    name="youtube_url"
                    type="text"
                    value={form.youtube_url}
                    onChange={handleChange}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ci-wa">WhatsApp Number</label>
                  <input
                    id="ci-wa"
                    name="whatsapp_number"
                    type="text"
                    value={form.whatsapp_number}
                    onChange={handleChange}
                    placeholder="+250 ..."
                  />
                </div>
              </div>
            </section>

            <div className="form-actions">
              <button
                type="button"
                className="gallery-btn-secondary"
                onClick={loadInfo}
                disabled={saving}
              >
                Reset
              </button>
              <button
                type="submit"
                className="gallery-btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>

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

        .admin-layout {
          min-height: 100vh;
          background: #F8F5F7;
        }

        /* Main content: offset by header (64px) + sidebar (250px) */
        .admin-main {
          padding: 24px;
          margin-top: 64px;
          margin-left: 250px;
          transition: margin-left 0.28s ease;
          min-height: calc(100vh - 64px);
        }
        .admin-main.sidebar-closed { margin-left: 0; }

        .page-container { max-width: 1100px; margin: 0 auto; }

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

        .contact-form-card {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 16px;
          padding: 28px;
        }
        .form-section {
          padding: 8px 0 20px;
          border-bottom: 1px solid #E1D9E0;
          margin-bottom: 20px;
        }
        .form-section:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 8px;
        }
        .form-section h2 {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          color: #241F24;
          margin: 0 0 16px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .form-group input,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #E1D9E0;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          background: #FFFFFF;
          color: #241F24;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          resize: vertical;
        }
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.1);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #E1D9E0;
        }

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
        .gallery-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(137, 60, 135, 0.3);
        }
        .gallery-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

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
        .gallery-btn-secondary:hover:not(:disabled) { background: #D1C9D0; }
        .gallery-btn-secondary:disabled { opacity: 0.7; cursor: not-allowed; }

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
          /* On mobile/tablet the sidebar overlays, so no margin needed */
          .admin-main { margin-left: 0 !important; }
        }

        @media (max-width: 768px) {
          .admin-main { padding: 16px; }
          .form-grid { grid-template-columns: 1fr; }
          .form-actions { flex-direction: column; }
          .form-actions button { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-main { transition: none; }
        }
      `}</style>
    </div>
  );
}

export default ContactInfo;