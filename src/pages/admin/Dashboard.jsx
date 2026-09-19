// src/pages/admin/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  FiBook,
  FiHome,
  FiFileText,
  FiCalendar,
  FiImage,
  FiMessageSquare,
  FiBell,
  FiCpu,
  FiActivity,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiGlobe,
} from "react-icons/fi";

const API_BASE = import.meta.env.VITE_BACKEND_LINK || "http://localhost:5000";

const PIE_COLORS = [
  "#893C87",
  "#B96AAE",
  "#6F2F6D",
  "#D69E2E",
  "#4A90D9",
  "#2E7D32",
  "#C62828",
  "#8A7E88",
];

const RANGE_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

const formatNumber = (n) => {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
};

const formatDateTime = (value) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const formatDayShort = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

function StatCard({ icon, label, value, trend, accent = "purple", link }) {
  return (
    <Link to={link || "#"} className={`stat-card accent-${accent}`}>
      <div className="stat-card-top">
        <div className="stat-card-icon">{icon}</div>
        {trend !== undefined && (
          <span
            className={`stat-card-trend ${
              trend >= 0 ? "positive" : "negative"
            }`}
          >
            <FiTrendingUp size={12} />
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <div className="stat-card-value">{formatNumber(value)}</div>
      <div className="stat-card-label">{label}</div>
    </Link>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  // --- Init ---
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
        });
        const authData = await res.json();
        if (!authData.success) {
          navigate("/login");
          return;
        }
        setUser(authData.user);
        await Promise.all([fetchOverview(30), fetchHealth()]);
      } catch (err) {
        console.error("Dashboard init error:", err);
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

  const fetchOverview = useCallback(async (days) => {
    setFetching(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/dashboard/overview?days=${days}`,
        { credentials: "include" }
      );
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || "Failed to load dashboard");
    } catch (err) {
      console.error("Overview fetch error:", err);
      setError("Network error while loading dashboard.");
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/dashboard/health`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) setHealth(json.data);
    } catch {
      setHealth(null);
    }
  };

  const handleRangeChange = (value) => {
    setRange(value);
    fetchOverview(value);
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

  const counts = data?.counts || {};
  const viewsTrend = data?.viewsTrend || [];
  const programsByDepartment = data?.programsByDepartment || [];
  const usersByRole = data?.usersByRole || [];
  const topPages = data?.topPages || [];
  const devices = data?.devices || [];
  const activity = data?.activity || [];
  const upcomingEvents = data?.upcomingEvents || [];
  const recentMessages = data?.recentMessages || [];

  const firstName = (user.full_name || "").split(" ")[0] || "Admin";

  // Day-over-day delta of visits today vs. yesterday (best-effort)
  // Not currently surfaced as a stat-card trend, but kept for future use.
  const _unused = null;

  return (
    <div className="admin-layout">
      <AdminHeader
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main
        className={`admin-main ${
          sidebarOpen ? "sidebar-open" : "sidebar-closed"
        }`}
      >
        <div className="page-container">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1>Welcome back, {firstName} 👋</h1>
              <p className="page-subtitle">
                Here's what's happening across your site today.
              </p>
            </div>
            <div className="header-actions">
              <div className="range-tabs">
                {RANGE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={`range-tab ${
                      range === r.value ? "active" : ""
                    }`}
                    onClick={() => handleRangeChange(r.value)}
                    disabled={fetching}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <span
                className={`system-pill ${
                  health?.db === "up" ? "system-up" : "system-down"
                }`}
              >
                <span className="system-dot" />
                {health?.db === "up" ? "Systems operational" : "Checking…"}
              </span>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          {/* Visitors — prominent row */}
          <section className="stats-grid">
            <StatCard
              icon={<FiEye size={20} />}
              label={`Total visits (${range}d)`}
              value={counts.visitors_total || 0}
              accent="purple"
              link="/admin/visitors"
            />
            <StatCard
              icon={<FiUsers size={20} />}
              label="Unique visitors"
              value={counts.visitors_unique || 0}
              accent="blue"
              link="/admin/visitors"
            />
            <StatCard
              icon={<FiActivity size={20} />}
              label="Visits today"
              value={counts.visitors_today || 0}
              accent="green"
              link="/admin/visitors"
            />
            <StatCard
              icon={<FiMessageSquare size={20} />}
              label="Unread messages"
              value={counts.messages_unread || 0}
              accent="orange"
              link="/admin/messages"
            />
          </section>

          {/* Content stat cards */}
          <section className="stats-grid">
            <StatCard
              icon={<FiBook size={20} />}
              label="Active programs"
              value={counts.programs || 0}
              accent="purple"
              link="/admin/programs"
            />
            <StatCard
              icon={<FiHome size={20} />}
              label="Departments"
              value={counts.departments || 0}
              accent="blue"
              link="/admin/departments"
            />
            <StatCard
              icon={<FiUsers size={20} />}
              label="Active users"
              value={counts.users || 0}
              accent="green"
              link="/admin/users"
            />
            <StatCard
              icon={<FiFileText size={20} />}
              label="Published news"
              value={counts.news || 0}
              accent="orange"
              link="/admin/news"
            />
          </section>

          <section className="stats-grid">
            <StatCard
              icon={<FiCalendar size={20} />}
              label="Upcoming events"
              value={counts.events || 0}
              accent="purple"
              link="/admin/events"
            />
            <StatCard
              icon={<FiImage size={20} />}
              label="Gallery images"
              value={counts.gallery_images || 0}
              accent="blue"
              link="/admin/gallery"
            />
            <StatCard
              icon={<FiBell size={20} />}
              label="Active announcements"
              value={counts.announcements || 0}
              accent="green"
              link="/admin/announcements"
            />
            <StatCard
              icon={<FiCpu size={20} />}
              label="AI conversations"
              value={counts.ai_conversations || 0}
              accent="orange"
              link="/admin/ai-assistant"
            />
          </section>

          {/* Traffic trend */}
          <section className="charts-row">
            <div className="chart-card chart-card-wide">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiActivity size={16} /> Traffic trend
                  </h3>
                  <p className="chart-sub">
                    Visits & unique visitors · last {range} days
                  </p>
                </div>
              </div>
              <div className="chart-body">
                {viewsTrend.length === 0 ? (
                  <div className="chart-empty">No traffic data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart
                      data={viewsTrend}
                      margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#893C87" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="#893C87" stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id="uniqueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4A90D9" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#4A90D9" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#F0E6EF"
                        vertical={false}
                      />
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
                          background: "#FFFFFF",
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
                        fill="url(#viewsGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="unique_visitors"
                        name="Unique"
                        stroke="#4A90D9"
                        strokeWidth={2}
                        fill="url(#uniqueGrad)"
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
                    <FiUsers size={16} /> Users by role
                  </h3>
                  <p className="chart-sub">Active accounts</p>
                </div>
              </div>
              <div className="chart-body">
                {usersByRole.length === 0 ? (
                  <div className="chart-empty">No user data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={usersByRole}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={3}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {usersByRole.map((entry, i) => (
                          <Cell
                            key={entry.label}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#FFFFFF",
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

          {/* Top pages + devices */}
          <section className="charts-row">
            <div className="chart-card chart-card-wide">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiGlobe size={16} /> Top pages
                  </h3>
                  <p className="chart-sub">Most visited pages · last {range} days</p>
                </div>
                <Link to="/admin/visitors" className="chart-link">
                  Full report
                </Link>
              </div>
              <div className="chart-body">
                {topPages.length === 0 ? (
                  <div className="chart-empty">No page data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={topPages}
                      layout="vertical"
                      margin={{ top: 6, right: 30, bottom: 6, left: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#F0E6EF"
                        horizontal={false}
                      />
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
                          background: "#FFFFFF",
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
                    <FiActivity size={16} /> Devices
                  </h3>
                  <p className="chart-sub">Visitor device types</p>
                </div>
              </div>
              <div className="chart-body">
                {devices.length === 0 ? (
                  <div className="chart-empty">No device data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={devices}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={3}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {devices.map((d, i) => (
                          <Cell
                            key={d.label}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#FFFFFF",
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

          {/* Programs by department + upcoming events */}
          <section className="charts-row">
            <div className="chart-card chart-card-wide">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiBook size={16} /> Programs by department
                  </h3>
                  <p className="chart-sub">Active programs per department</p>
                </div>
              </div>
              <div className="chart-body">
                {programsByDepartment.length === 0 ? (
                  <div className="chart-empty">No program data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={programsByDepartment}
                      margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#B96AAE" />
                          <stop offset="100%" stopColor="#893C87" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#F0E6EF"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#8A7E88" }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        tickFormatter={(v) =>
                          v.length > 10 ? v.slice(0, 10) + "…" : v
                        }
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
                          background: "#FFFFFF",
                          border: "1px solid #E1D9E0",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        cursor={{ fill: "rgba(137, 60, 135, 0.06)" }}
                      />
                      <Bar
                        dataKey="value"
                        name="Programs"
                        fill="url(#barGrad)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={44}
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
                    <FiCalendar size={16} /> Upcoming events
                  </h3>
                  <p className="chart-sub">Next on the calendar</p>
                </div>
                <Link to="/admin/events" className="chart-link">
                  View all
                </Link>
              </div>
              <div className="chart-body">
                {upcomingEvents.length === 0 ? (
                  <div className="chart-empty">No upcoming events</div>
                ) : (
                  <ul className="events-mini-list">
                    {upcomingEvents.map((ev) => {
                      const d = new Date(ev.event_date);
                      const day = d.getDate().toString().padStart(2, "0");
                      const month = d
                        .toLocaleString("en-US", { month: "short" })
                        .toUpperCase();
                      return (
                        <li key={ev.id} className="event-mini-item">
                          <div className="event-mini-date">
                            <span className="event-mini-day">{day}</span>
                            <span className="event-mini-month">{month}</span>
                          </div>
                          <div className="event-mini-info">
                            <span className="event-mini-title">{ev.title}</span>
                            <span className="event-mini-meta">
                              {ev.start_time ? `${ev.start_time} · ` : ""}
                              {ev.location || ev.category || ""}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Activity + recent messages */}
          <section className="charts-row">
            <div className="chart-card chart-card-wide">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiActivity size={16} /> Recent activity
                  </h3>
                  <p className="chart-sub">Latest events across your site</p>
                </div>
              </div>
              <div className="chart-body">
                {activity.length === 0 ? (
                  <div className="chart-empty">No recent activity</div>
                ) : (
                  <ul className="activity-list">
                    {activity.map((a, i) => (
                      <li key={`${a.type}-${i}`} className="activity-item">
                        <span
                          className={`activity-dot activity-dot--${a.type}`}
                        />
                        <div className="activity-content">
                          <Link to={a.link} className="activity-title">
                            {a.title}
                          </Link>
                          <span className="activity-sub">{a.subtitle}</span>
                        </div>
                        <span className="activity-time">
                          {formatDateTime(a.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiMessageSquare size={16} /> Recent messages
                  </h3>
                  <p className="chart-sub">Latest contact submissions</p>
                </div>
                <Link to="/admin/messages" className="chart-link">
                  Open inbox
                </Link>
              </div>
              <div className="chart-body">
                {recentMessages.length === 0 ? (
                  <div className="chart-empty">No messages yet</div>
                ) : (
                  <ul className="messages-mini-list">
                    {recentMessages.map((m) => (
                      <li key={m.id} className="message-mini-item">
                        <span
                          className={`message-mini-dot ${
                            !m.is_read ? "unread" : ""
                          }`}
                        />
                        <div className="message-mini-info">
                          <span className="message-mini-name">
                            {m.full_name}
                          </span>
                          <span className="message-mini-subject">
                            {m.subject || "(no subject)"}
                          </span>
                        </div>
                        <span className="message-mini-time">
                          {formatDateTime(m.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Counters + health */}
          <section className="charts-row">
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiCpu size={16} /> AI Assistant
                  </h3>
                  <p className="chart-sub">Conversations & knowledge</p>
                </div>
                <Link to="/admin/ai-assistant" className="chart-link">
                  Open
                </Link>
              </div>
              <div className="chart-body">
                <div className="kpi-row">
                  <div className="kpi">
                    <span className="kpi-value">
                      {formatNumber(counts.ai_conversations || 0)}
                    </span>
                    <span className="kpi-label">Conversations</span>
                  </div>
                  <div className="kpi">
                    <span className="kpi-value">
                      {formatNumber(counts.ai_knowledge || 0)}
                    </span>
                    <span className="kpi-label">Knowledge entries</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiImage size={16} /> Content assets
                  </h3>
                  <p className="chart-sub">Gallery & hero banners</p>
                </div>
              </div>
              <div className="chart-body">
                <div className="kpi-row">
                  <div className="kpi">
                    <span className="kpi-value">
                      {formatNumber(counts.gallery_images || 0)}
                    </span>
                    <span className="kpi-label">Gallery images</span>
                  </div>
                  <div className="kpi">
                    <span className="kpi-value">
                      {formatNumber(counts.hero_banners || 0)}
                    </span>
                    <span className="kpi-label">Hero banners</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <h3 className="chart-title">
                    <FiCheckCircle size={16} /> System status
                  </h3>
                  <p className="chart-sub">Live indicators</p>
                </div>
              </div>
              <div className="chart-body">
                <ul className="health-list">
                  <li>
                    <span className="health-label">
                      <FiCheckCircle size={14} /> Database
                    </span>
                    <span
                      className={`health-badge ${
                        health?.db === "up" ? "ok" : "down"
                      }`}
                    >
                      {health?.db === "up" ? "Online" : "Down"}
                    </span>
                  </li>
                  <li>
                    <span className="health-label">
                      <FiCheckCircle size={14} /> Server
                    </span>
                    <span className="health-badge ok">Online</span>
                  </li>
                  <li>
                    <span className="health-label">
                      <FiClock size={14} /> Uptime
                    </span>
                    <span className="health-value">
                      {health?.uptime
                        ? `${Math.floor(health.uptime / 60)} min`
                        : "—"}
                    </span>
                  </li>
                </ul>
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
        .page-subtitle {
          font-size: 14px;
          color: #6B646B;
          margin: 4px 0 0;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .range-tabs {
          display: flex;
          gap: 3px;
          background: #FFFFFF;
          padding: 3px;
          border-radius: 9px;
          border: 1px solid #E1D9E0;
        }
        .range-tab {
          padding: 6px 12px;
          border: none;
          background: transparent;
          border-radius: 7px;
          font-size: 12.5px;
          font-weight: 700;
          color: #6B646B;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          min-width: 40px;
        }
        .range-tab:hover:not(:disabled) { background: #F3EAF2; color: #4A444A; }
        .range-tab.active { background: #893C87; color: #FFF; }
        .range-tab:disabled { opacity: 0.6; cursor: wait; }

        .system-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 600;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          color: #4A444A;
        }
        .system-up { color: #2E7D32; border-color: #CBE7CD; background: #F3FAF4; }
        .system-down { color: #C62828; border-color: #F5C7C7; background: #FDF4F4; }
        .system-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15);
        }

        /* ===== Stat cards ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .stat-card {
          display: block;
          background: #FFFFFF;
          border: 1px solid #E1D9E0;
          border-radius: 14px;
          padding: 18px 20px 20px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #893C87, #B96AAE);
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(41, 20, 40, 0.08);
          border-color: #E7D3E6;
        }
        .stat-card:hover::before { opacity: 1; }
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
          color: #FFFFFF;
        }
        .accent-purple .stat-card-icon { background: linear-gradient(135deg, #893C87, #6F2F6D); }
        .accent-blue   .stat-card-icon { background: linear-gradient(135deg, #4A90D9, #2E6FAF); }
        .accent-green  .stat-card-icon { background: linear-gradient(135deg, #2E7D32, #1E5A22); }
        .accent-orange .stat-card-icon { background: linear-gradient(135deg, #D69E2E, #B27A13); }

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
        .stat-card-label {
          font-size: 13px;
          color: #6B646B;
          font-weight: 500;
        }

        /* ===== Chart layout ===== */
        .charts-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .chart-card {
          background: #FFFFFF;
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
        .chart-sub {
          font-size: 12.5px;
          color: #8A7E88;
          margin: 0;
        }
        .chart-link {
          font-size: 12.5px;
          color: #893C87;
          text-decoration: none;
          font-weight: 600;
          align-self: flex-start;
        }
        .chart-link:hover { text-decoration: underline; }
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

        /* ===== Mini lists ===== */
        .events-mini-list,
        .messages-mini-list,
        .activity-list,
        .health-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .event-mini-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #F0E6EF;
        }
        .event-mini-item:last-child { border-bottom: none; }
        .event-mini-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 44px;
          padding: 6px 4px;
          background: #F3EAF2;
          border-radius: 8px;
        }
        .event-mini-day {
          font-family: 'Fraunces', serif;
          font-size: 15px;
          font-weight: 700;
          color: #893C87;
          line-height: 1;
        }
        .event-mini-month {
          font-size: 10px;
          font-weight: 700;
          color: #8A7E88;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }
        .event-mini-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .event-mini-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #241F24;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .event-mini-meta {
          font-size: 12px;
          color: #8A7E88;
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .message-mini-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid #F0E6EF;
        }
        .message-mini-item:last-child { border-bottom: none; }
        .message-mini-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #D1C9D0;
          flex-shrink: 0;
        }
        .message-mini-dot.unread {
          background: #893C87;
          box-shadow: 0 0 0 3px rgba(137, 60, 135, 0.15);
        }
        .message-mini-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .message-mini-name {
          font-size: 13px;
          font-weight: 600;
          color: #241F24;
        }
        .message-mini-subject {
          font-size: 12px;
          color: #8A7E88;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .message-mini-time {
          font-size: 11px;
          color: #B5ADB5;
          white-space: nowrap;
        }

        /* ===== Activity ===== */
        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #F0E6EF;
        }
        .activity-item:last-child { border-bottom: none; }
        .activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .activity-dot--message { background: #893C87; }
        .activity-dot--news    { background: #4A90D9; }
        .activity-dot--event   { background: #D69E2E; }
        .activity-dot--program { background: #2E7D32; }
        .activity-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .activity-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #241F24;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .activity-title:hover { color: #893C87; text-decoration: underline; }
        .activity-sub {
          font-size: 12px;
          color: #8A7E88;
          margin-top: 1px;
        }
        .activity-time {
          font-size: 11.5px;
          color: #B5ADB5;
          white-space: nowrap;
        }

        /* ===== KPI row ===== */
        .kpi-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 12px 0;
        }
        .kpi {
          display: flex;
          flex-direction: column;
          padding: 16px;
          background: #FBF9FA;
          border-radius: 10px;
          border: 1px solid #F0E6EF;
        }
        .kpi-value {
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 700;
          color: #893C87;
          line-height: 1;
        }
        .kpi-label {
          font-size: 12.5px;
          color: #6B646B;
          margin-top: 6px;
          font-weight: 500;
        }

        /* ===== Health ===== */
        .health-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #F0E6EF;
        }
        .health-list li:last-child { border-bottom: none; }
        .health-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: #4A444A;
          font-weight: 500;
        }
        .health-badge {
          font-size: 11.5px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .health-badge.ok { background: #E8F5E9; color: #2E7D32; }
        .health-badge.down { background: #FDE8E8; color: #C62828; }
        .health-value {
          font-size: 13px;
          color: #241F24;
          font-weight: 600;
        }

        /* ===== Form feedback ===== */
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
          .kpi-row { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .stat-card, .chart-card, .range-tab { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;