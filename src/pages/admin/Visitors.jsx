// src/pages/admin/Visitors.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Header";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  FiUsers,
  FiEye,
  FiActivity,
  FiTrendingUp,
  FiTrendingDown,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiChrome,
  FiGlobe,
} from "react-icons/fi";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const PIE_COLORS = [
  "#893C87",
  "#B96AAE",
  "#6F2F6D",
  "#4A90D9",
  "#2E7D32",
  "#D69E2E",
  "#C62828",
  "#8A7E88",
];

const RANGE_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

const formatNumber = (n) => {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
};

const formatDateTime = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return v;
  }
};

const formatDayShort = (v) => {
  if (!v) return "";
  try {
    return new Date(v).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return v;
  }
};

const formatHour = (h) => {
  const n = Number(h);
  if (Number.isNaN(n)) return h;
  if (n === 0) return "12am";
  if (n < 12) return `${n}am`;
  if (n === 12) return "12pm";
  return `${n - 12}pm`;
};

const deviceIcon = (label) => {
  const l = (label || "").toLowerCase();
  if (l === "mobile") return <FiSmartphone size={14} />;
  if (l === "tablet") return <FiTablet size={14} />;
  if (l === "bot") return <FiActivity size={14} />;
  return <FiMonitor size={14} />;
};

function Visitors() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  // --- Auth check ---
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.success) {
          setUser(json.user);
          await fetchData(30);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchData = useCallback(async (days) => {
    setFetching(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/visitors/overview?days=${days}`,
        { credentials: "include" }
      );
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || "Failed to load analytics");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setFetching(false);
    }
  }, []);

  const handleRangeChange = (value) => {
    setRange(value);
    fetchData(value);
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

  const totals = data?.totals || {};
  const trend = data?.trend || [];
  const devices = data?.devices || [];
  const browsers = data?.browsers || [];
  const oses = data?.oses || [];
  const topPages = data?.topPages || [];
  const topReferrers = data?.topReferrers || [];
  const peakHours = data?.peakHours || [];
  const recent = data?.recent || [];

  const dayDelta =
    totals.today != null && totals.yesterday != null && totals.yesterday > 0
      ? Math.round(((totals.today - totals.yesterday) / totals.yesterday) * 100)
      : null;

  return (
    <div className="admin-layout">
      <AdminHeader
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className={`admin-main ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="page-container">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1>Website Visitors</h1>
              <p className="page-subtitle">
                Traffic, engagement, and audience insights
              </p>
            </div>
            <div className="header-actions">
              <div className="range-tabs">
                {RANGE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={`range-tab ${range === r.value ? "active" : ""}`}
                    onClick={() => handleRangeChange(r.value)}
                    disabled={fetching}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          {/* Stat cards */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-card-icon icon-purple">
                  <FiEye size={20} />
                </div>
                {dayDelta !== null && (
                  <span
                    className={`stat-card-trend ${
                      dayDelta >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {dayDelta >= 0 ? (
                      <FiTrendingUp size={12} />
                    ) : (
                      <FiTrendingDown size={12} />
                    )}
                    {dayDelta > 0 ? "+" : ""}
                    {dayDelta}%
                  </span>
                )}
              </div>
              <div className="stat-card-value">{formatNumber(totals.total_visits)}</div>
              <div className="stat-card-label">Total visits ({range}d)</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-card-icon icon-blue">
                  <FiUsers size={20} />
                </div>
              </div>
              <div className="stat-card-value">
                {formatNumber(totals.unique_visitors)}
              </div>
              <div className="stat-card-label">Unique visitors</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-card-icon icon-green">
                  <FiActivity size={20} />
                </div>
              </div>
              <div className="stat-card-value">{formatNumber(totals.today)}</div>
              <div className="stat-card-label">Visits today</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-card-icon icon-orange">
                  <FiGlobe size={20} />
                </div>
              </div>
              <div className="stat-card-value">
                {formatNumber(totals.unique_sessions)}
              </div>
              <div className="stat-card-label">Unique sessions</div>
            </div>
          </section>

          {/* Daily trend */}
          <section className="charts-row">
            <div className="chart-card chart-card-wide">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiActivity size={16} /> Traffic trend
                  </h3>
                  <p className="chart-sub">Visits & unique visitors per day</p>
                </div>
              </div>
              <div className="chart-body">
                {trend.length === 0 ? (
                  <div className="chart-empty">No traffic data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart
                      data={trend}
                      margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#893C87" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="#893C87" stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id="uGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4A90D9" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#4A90D9" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E6EF" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tickFormatter={formatDayShort}
                        tick={{ fontSize: 11, fill: "#8A7E88" }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#8A7E88" }}
                        tickLine={false}
                        axisLine={false}
                        width={32}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#FFF",
                          border: "1px solid #E1D9E0",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelFormatter={formatDayShort}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12, color: "#4A444A" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="visits"
                        name="Visits"
                        stroke="#893C87"
                        strokeWidth={2.4}
                        fill="url(#vGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="unique_visitors"
                        name="Unique"
                        stroke="#4A90D9"
                        strokeWidth={2}
                        fill="url(#uGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiMonitor size={16} /> Devices
                  </h3>
                  <p className="chart-sub">Visitor device types</p>
                </div>
              </div>
              <div className="chart-body">
                {devices.length === 0 ? (
                  <div className="chart-empty">No device data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={devices}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        stroke="#FFF"
                        strokeWidth={2}
                      >
                        {devices.map((d, i) => (
                          <Cell key={d.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#FFF",
                          border: "1px solid #E1D9E0",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12, color: "#4A444A" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>

          {/* Peak hours + Browsers */}
          <section className="charts-row">
            <div className="chart-card chart-card-wide">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiActivity size={16} /> Peak hours
                  </h3>
                  <p className="chart-sub">Visits grouped by hour of day</p>
                </div>
              </div>
              <div className="chart-body">
                {peakHours.length === 0 ? (
                  <div className="chart-empty">No hourly data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={peakHours}
                      margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#B96AAE" />
                          <stop offset="100%" stopColor="#893C87" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E6EF" vertical={false} />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={formatHour}
                        tick={{ fontSize: 11, fill: "#8A7E88" }}
                        tickLine={false}
                        axisLine={false}
                        interval={1}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#8A7E88" }}
                        tickLine={false}
                        axisLine={false}
                        width={32}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#FFF",
                          border: "1px solid #E1D9E0",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelFormatter={formatHour}
                      />
                      <Bar
                        dataKey="visits"
                        name="Visits"
                        fill="url(#hGrad)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiChrome size={16} /> Browsers
                  </h3>
                  <p className="chart-sub">Top browsers</p>
                </div>
              </div>
              <div className="chart-body">
                {browsers.length === 0 ? (
                  <div className="chart-empty">No browser data</div>
                ) : (
                  <ul className="mini-list">
                    {browsers.map((b, i) => (
                      <li key={b.label} className="mini-list-item">
                        <span
                          className="mini-list-dot"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="mini-list-label">{b.label}</span>
                        <span className="mini-list-value">
                          {formatNumber(b.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Top pages + Referrers */}
          <section className="charts-row">
            <div className="chart-card chart-card-wide">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiEye size={16} /> Top pages
                  </h3>
                  <p className="chart-sub">Most visited pages in the period</p>
                </div>
              </div>
              <div className="chart-body">
                {topPages.length === 0 ? (
                  <div className="chart-empty">No page data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={topPages}
                      layout="vertical"
                      margin={{ top: 6, right: 30, bottom: 6, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0E6EF" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "#8A7E88" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#4A444A" }}
                        tickLine={false}
                        axisLine={false}
                        width={140}
                        tickFormatter={(v) =>
                          v.length > 22 ? v.slice(0, 22) + "…" : v
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#FFF",
                          border: "1px solid #E1D9E0",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="value"
                        name="Visits"
                        fill="#893C87"
                        radius={[0, 6, 6, 0]}
                        maxBarSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiGlobe size={16} /> Top referrers
                  </h3>
                  <p className="chart-sub">Where visitors come from</p>
                </div>
              </div>
              <div className="chart-body">
                {topReferrers.length === 0 ? (
                  <div className="chart-empty">No referrer data</div>
                ) : (
                  <ul className="mini-list">
                    {topReferrers.map((r, i) => (
                      <li key={r.label} className="mini-list-item">
                        <span
                          className="mini-list-dot"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="mini-list-label" title={r.label}>
                          {r.label.length > 30
                            ? r.label.slice(0, 30) + "…"
                            : r.label}
                        </span>
                        <span className="mini-list-value">
                          {formatNumber(r.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* OS + Recent */}
          <section className="charts-row">
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiMonitor size={16} /> Operating systems
                  </h3>
                  <p className="chart-sub">Visitor platforms</p>
                </div>
              </div>
              <div className="chart-body">
                {oses.length === 0 ? (
                  <div className="chart-empty">No OS data</div>
                ) : (
                  <ul className="mini-list">
                    {oses.map((o, i) => (
                      <li key={o.label} className="mini-list-item">
                        <span
                          className="mini-list-dot"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="mini-list-label">{o.label}</span>
                        <span className="mini-list-value">
                          {formatNumber(o.value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="chart-card chart-card-wide">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiActivity size={16} /> Recent visits
                  </h3>
                  <p className="chart-sub">Latest 25 visits</p>
                </div>
              </div>
              <div className="chart-body">
                {recent.length === 0 ? (
                  <div className="chart-empty">No visits recorded yet</div>
                ) : (
                  <div className="recent-table-wrap">
                    <table className="recent-table">
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Page</th>
                          <th>Device</th>
                          <th>Browser</th>
                          <th>OS</th>
                          <th>IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map((r) => (
                          <tr key={r.id}>
                            <td className="recent-when">
                              {formatDateTime(r.visited_at)}
                            </td>
                            <td className="recent-page">
                              {r.page_url?.length > 32
                                ? r.page_url.slice(0, 32) + "…"
                                : r.page_url}
                            </td>
                            <td>
                              <span className="recent-device">
                                {deviceIcon(r.device_type)}
                                {r.device_type || "—"}
                              </span>
                            </td>
                            <td>{r.browser || "—"}</td>
                            <td>{r.operating_system || "—"}</td>
                            <td className="recent-ip">{r.ip_address || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

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

        /* ===== Header ===== */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .page-header h1 {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 600;
          color: #241F24;
          margin: 0;
        }
        .page-subtitle { font-size: 14px; color: #6B646B; margin: 4px 0 0; }

        .header-actions { display: flex; align-items: center; gap: 10px; }

        .range-tabs {
          display: flex;
          gap: 4px;
          background: #FFF;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #E1D9E0;
        }
        .range-tab {
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 600;
          color: #6B646B;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .range-tab:hover:not(:disabled) { background: #F3EAF2; color: #4A444A; }
        .range-tab.active { background: #893C87; color: #FFF; }
        .range-tab:disabled { opacity: 0.6; cursor: wait; }

        /* ===== Stat cards ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: #FFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 18px 20px 20px;
        }
        .stat-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .stat-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFF;
        }
        .icon-purple { background: linear-gradient(135deg, #893C87, #6F2F6D); }
        .icon-blue   { background: linear-gradient(135deg, #4A90D9, #2E6FAF); }
        .icon-green  { background: linear-gradient(135deg, #2E7D32, #1E5A22); }
        .icon-orange { background: linear-gradient(135deg, #D69E2E, #B27A13); }

        .stat-card-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 999px;
        }
        .stat-card-trend.positive { background: #E8F5E9; color: #2E7D32; }
        .stat-card-trend.negative { background: #FDE8E8; color: #C62828; }

        .stat-card-value {
          font-family: 'Fraunces', serif;
          font-size: 28px;
          font-weight: 700;
          color: #241F24;
          line-height: 1.1;
          margin-bottom: 4px;
        }
        .stat-card-label { font-size: 13px; color: #6B646B; font-weight: 500; }

        /* ===== Chart layout ===== */
        .charts-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .chart-card {
          background: #FFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 20px 22px 22px;
        }
        .chart-card-wide { grid-column: span 1; }
        .chart-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .chart-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Fraunces', serif;
          font-size: 17px;
          font-weight: 600;
          color: #241F24;
          margin: 0 0 2px;
        }
        .chart-sub { font-size: 12.5px; color: #8A7E88; margin: 0; }
        .chart-body { min-height: 220px; }
        .chart-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 220px;
          font-size: 13.5px;
          color: #8A7E88;
          background: #FBF9FA;
          border-radius: 10px;
          border: 1px dashed #E1D9E0;
        }

        /* ===== Mini list ===== */
        .mini-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .mini-list-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #F0E6EF;
        }
        .mini-list-item:last-child { border-bottom: none; }
        .mini-list-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .mini-list-label {
          flex: 1;
          font-size: 13.5px;
          color: #4A444A;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .mini-list-value {
          font-size: 13.5px;
          font-weight: 700;
          color: #241F24;
        }

        /* ===== Recent table ===== */
        .recent-table-wrap {
          max-height: 420px;
          overflow-y: auto;
          border-radius: 10px;
          border: 1px solid #F0E6EF;
        }
        .recent-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
        }
        .recent-table thead {
          background: #FBF9FA;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .recent-table th {
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #8A7E88;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #F0E6EF;
        }
        .recent-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #F0E6EF;
          color: #4A444A;
        }
        .recent-table tr:last-child td { border-bottom: none; }
        .recent-table tr:hover { background: #FBF9FA; }
        .recent-when { white-space: nowrap; color: #8A7E88; }
        .recent-page { font-family: monospace; font-size: 12px; }
        .recent-ip { font-family: monospace; font-size: 12px; color: #8A7E88; }
        .recent-device {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          text-transform: capitalize;
        }

        .form-error {
          padding: 10px 14px;
          background: #FDE8E8;
          color: #C62828;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* ===== Responsive ===== */
        @media (max-width: 1100px) {
          .charts-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 1023px) {
          .admin-main { margin-left: 0 !important; }
        }
        @media (max-width: 768px) {
          .admin-main { padding: 16px; }
          .stats-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
          .stat-card-value { font-size: 22px; }
          .page-header h1 { font-size: 22px; }
          .chart-card { padding: 16px 16px 18px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .stat-card, .chart-card, .range-tab { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

export default Visitors;