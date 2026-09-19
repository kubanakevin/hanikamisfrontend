// src/pages/Departments.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Preloader from "../components/Preloader";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const truncate = (text, max = 140) => {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
};

function DepartmentsPublic() {
  const [status, setStatus] = useState("loading");
  const [showPreloader, setShowPreloader] = useState(true);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/client/departments`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;

        if (json.success) {
          setDepartments(json.data || []);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Departments load error:", err);
        if (!cancelled) setStatus("error");
      } finally {
        setTimeout(() => setShowPreloader(false), 800);
      }
    }

    load();

    fetch(`${API_BASE}/api/client/visits/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ page_url: "/departments" }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  if (showPreloader || status === "loading") {
    return <Preloader />;
  }

  if (status === "error") {
    return (
      <>
        <NavBar />
        <div className="deps-error">
          <h2>Couldn't load departments</h2>
          <p>Please refresh the page to try again.</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const totalPrograms = departments.reduce(
    (s, d) => s + (d.program_count || 0),
    0
  );

  return (
    <>
      <NavBar />
      <main className="deps-page">
        <section className="deps-header">
          <h1>Our Departments</h1>
          <p>
            Explore our academic departments, the programs they offer, and the
            faculty who lead them.
          </p>
        </section>

        {/* Small stats strip */}
        <section className="deps-stats">
          <div className="deps-stats-inner">
            <div className="deps-stat">
              <span className="deps-stat-number">{departments.length}</span>
              <span className="deps-stat-label">Departments</span>
            </div>
            <div className="deps-stat">
              <span className="deps-stat-number">{totalPrograms}</span>
              <span className="deps-stat-label">Active programs</span>
            </div>
          </div>
        </section>

        <section className="deps-content">
          {departments.length === 0 ? (
            <div className="deps-empty">
              <span className="deps-empty-icon">🏛️</span>
              <h3>No departments yet</h3>
              <p>Departments will appear here once they're added.</p>
            </div>
          ) : (
            <div className="deps-grid">
              {departments.map((d) => (
                <Link
                  key={d.id}
                  to={`/departments/${d.slug}`}
                  className="dept-card"
                >
                  <div className="dept-card-top">
                    <div className="dept-card-initial">
                      {d.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="dept-card-count">
                      {d.program_count}{" "}
                      {d.program_count === 1 ? "program" : "programs"}
                    </span>
                  </div>
                  <h3 className="dept-card-title">{d.name}</h3>
                  {d.head_of_department && (
                    <p className="dept-card-head">
                      <span className="dept-card-head-icon">👤</span>
                      {d.head_of_department}
                    </p>
                  )}
                  {d.description && (
                    <p className="dept-card-desc">
                      {truncate(d.description, 130)}
                    </p>
                  )}
                  <span className="dept-card-cta">
                    View department <span className="arrow">→</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />

      <style>{`
        .deps-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #241F24;
          background: #FBF9FA;
          min-height: 100vh;
        }

        .deps-header {
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          padding: 80px 24px 60px;
          text-align: center;
        }
        .deps-header h1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(32px, 4vw, 48px);
          margin: 0 0 12px;
        }
        .deps-header p {
          font-size: 16px;
          color: #EBD9E9;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .deps-stats {
          max-width: 1080px;
          margin: 40px auto 0;
          padding: 0 24px;
        }
        .deps-stats-inner {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 22px 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          text-align: center;
        }
        .deps-stat { display: flex; flex-direction: column; gap: 4px; }
        .deps-stat-number {
          font-family: 'Fraunces', serif;
          font-size: 32px;
          font-weight: 700;
          color: #893C87;
          line-height: 1;
        }
        .deps-stat-label {
          font-size: 13px;
          color: #6B646B;
          font-weight: 500;
        }

        .deps-content {
          max-width: 1240px;
          margin: 0 auto;
          padding: 44px 24px 80px;
        }

        .deps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .dept-card {
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 26px 26px 24px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .dept-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(41, 20, 40, 0.10);
          border-color: #E7D3E6;
        }

        .dept-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .dept-card-initial {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, #893C87, #6F2F6D);
          color: #FFFFFF;
          font-family: 'Fraunces', serif;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 6px 16px rgba(137, 60, 135, 0.22);
        }
        .dept-card-count {
          font-size: 11.5px;
          font-weight: 700;
          color: #893C87;
          background: #F3EAF2;
          padding: 5px 12px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          white-space: nowrap;
        }

        .dept-card-title {
          font-family: 'Fraunces', serif;
          font-size: 20px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 8px;
          line-height: 1.3;
        }

        .dept-card-head {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #4A444A;
          margin: 0 0 10px;
          font-weight: 500;
        }
        .dept-card-head-icon { font-size: 13px; opacity: 0.85; }

        .dept-card-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #6B646B;
          margin: 0 0 18px;
          flex: 1;
        }

        .dept-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #893C87;
          padding-top: 14px;
          border-top: 1px solid #E1D9E0;
        }
        .dept-card-cta .arrow { transition: transform 0.2s ease; }
        .dept-card:hover .dept-card-cta .arrow { transform: translateX(4px); }

        .deps-empty {
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 60px 24px;
          text-align: center;
          max-width: 480px;
          margin: 0 auto;
        }
        .deps-empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 12px;
        }
        .deps-empty h3 {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          color: #241F24;
          margin: 0 0 8px;
        }
        .deps-empty p { color: #6B646B; margin: 0; }

        .deps-error {
          text-align: center;
          padding: 80px 24px;
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .deps-error h2 {
          color: #893C87;
          font-size: 28px;
          margin-bottom: 8px;
        }
        .deps-error p { color: #6B646B; margin-bottom: 20px; }
        .retry-btn {
          padding: 12px 32px;
          background: #893C87;
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .retry-btn:hover { background: #6F2F6D; }

        @media (max-width: 640px) {
          .deps-header { padding: 64px 20px 44px; }
          .deps-header h1 { font-size: 30px; }
          .deps-header p { font-size: 15px; }
          .deps-stats { margin-top: 28px; padding: 0 16px; }
          .deps-stats-inner { padding: 18px 14px; }
          .deps-stat-number { font-size: 26px; }
          .deps-content { padding: 32px 16px 60px; }
          .deps-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .dept-card { padding: 22px 20px; }
          .dept-card-initial { width: 48px; height: 48px; font-size: 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .dept-card,
          .dept-card-cta .arrow { transition: none !important; }
        }
      `}</style>
    </>
  );
}

export default DepartmentsPublic;