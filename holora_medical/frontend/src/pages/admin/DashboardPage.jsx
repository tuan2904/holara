import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { dashboardService } from "../../services/dashboardService";
import { Home } from "lucide-react";

// ─── Color / label maps ───────────────────────────────────────────────────────
const APPT_COLOR = {
  scheduled:   "#60a5fa",
  confirmed:   "#34d399",
  checked_in:  "#a78bfa",
  in_progress: "#fbbf24",
  completed:   "#4ade80",
  cancelled:   "#f87171",
  no_show:     "#94a3b8",
};
const CONS_COLOR = {
  pending:     "#60a5fa",
  in_progress: "#fbbf24",
  completed:   "#4ade80",
  cancelled:   "#f87171",
};
const STATUS_VI = {
  scheduled:   "Đã đặt",
  confirmed:   "Xác nhận",
  checked_in:  "Đã check-in",
  in_progress: "Đang xử lý",
  completed:   "Hoàn thành",
  cancelled:   "Đã hủy",
  no_show:     "Vắng mặt",
  pending:     "Chờ xử lý",
};

// ─── Helper: last 6 calendar months ──────────────────────────────────────────
function getLast6Months() {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
    result.push({ key, label });
  }
  return result;
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
const BarChart = ({ data, color = "#6366f1" }) => {
  const { theme } = useTheme();
  const gridColor = theme === 'dark' ? '#334155' : '#f1f5f9';
  const labelColor = theme === 'dark' ? '#94a3b8' : '#94a3b8';

  if (!data.length)
    return <Empty />;

  const n      = data.length;
  const barW   = 36;
  const barGap = 12;
  const lPad   = 8;
  const rPad   = 8;
  const tPad   = 22;   // room for value label above bar
  const lblH   = 22;   // room for month label below bar
  const chartH = 130;
  const svgW   = lPad + n * barW + (n - 1) * barGap + rPad;
  const svgH   = tPad + chartH + lblH;
  const max    = Math.max(...data.map((d) => d.value), 1);

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ width: "100%", display: "block", overflow: "visible" }}
    >
      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = tPad + chartH * (1 - frac);
        return (
          <line key={frac} x1={0} y1={y} x2={svgW} y2={y}
            stroke={gridColor} strokeWidth={1} />
        );
      })}

      {data.map((d, i) => {
        const bh = Math.max(3, Math.round((d.value / max) * chartH));
        const x  = lPad + i * (barW + barGap);
        const y  = tPad + chartH - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={5} fill={color} />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                fontSize={10} fill={color} fontWeight="700">
                {d.value}
              </text>
            )}
            <text x={x + barW / 2} y={tPad + chartH + 16} textAnchor="middle"
              fontSize={10} fill={labelColor}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────
const polarXY = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const slicePath = (cx, cy, R, ri, a0, a1) => {
  const s  = polarXY(cx, cy, R,  a0);
  const e  = polarXY(cx, cy, R,  a1);
  const si = polarXY(cx, cy, ri, a0);
  const ei = polarXY(cx, cy, ri, a1);
  const lg = a1 - a0 > 180 ? 1 : 0;
  return [
    `M ${s.x.toFixed(2)} ${s.y.toFixed(2)}`,
    `A ${R} ${R} 0 ${lg} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`,
    `L ${ei.x.toFixed(2)} ${ei.y.toFixed(2)}`,
    `A ${ri} ${ri} 0 ${lg} 0 ${si.x.toFixed(2)} ${si.y.toFixed(2)}`,
    "Z",
  ].join(" ");
};

const DonutChart = ({ segments, colorMap }) => {
  const { theme } = useTheme();
  const totalColor = theme === 'dark' ? '#f1f5f9' : '#1e293b';
  const subColor = theme === 'dark' ? '#94a3b8' : '#94a3b8';
  const legendTextColor = theme === 'dark' ? '#cbd5e1' : '#475569';
  const countColor = theme === 'dark' ? '#f1f5f9' : '#1e293b';

  const total = segments.reduce((s, d) => s + Number(d.count), 0);
  if (!total) return <Empty />;

  const cx = 78, cy = 78, R = 66, ri = 40;
  const slices = segments.reduce((acc, seg) => {
    const previous = acc.length ? acc[acc.length - 1].a1 + 0.4 : 0;
    const pct = Number(seg.count) / total;
    const a0 = previous;
    const a1 = previous + pct * 360 - 0.4;
    acc.push({ ...seg, a0, a1 });
    return acc;
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg viewBox="0 0 156 156" style={{ width: 156, height: 156, flexShrink: 0 }}>
        {slices.map((seg, i) => {
          return (
            <path key={i} d={slicePath(cx, cy, R, ri, seg.a0, seg.a1)}
              fill={colorMap[seg.status] || "#cbd5e1"} />
          );
        })}
        <text x={cx} y={cy - 8} textAnchor="middle"
          fontSize={22} fontWeight="800" fill={totalColor}>{total}</text>
        <text x={cx} y={cx + 12} textAnchor="middle"
          fontSize={11} fill={subColor}>tổng cộng</text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, minWidth: 120 }}>
        {segments.map((seg) => (
          <div key={seg.status}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
              background: colorMap[seg.status] || "#cbd5e1",
            }} />
            <span style={{ color: legendTextColor, flex: 1, whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis" }}>
              {STATUS_VI[seg.status] || seg.status}
            </span>
            <span style={{ fontWeight: 700, color: countColor }}>{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Horizontal Bars ──────────────────────────────────────────────────────────
const HBar = ({ items, color = "#6366f1", nameKey = "name" }) => {
  const { theme } = useTheme();
  const labelColor = theme === 'dark' ? '#cbd5e1' : '#475569';
  const countColor = theme === 'dark' ? '#f1f5f9' : '#1e293b';
  const trackBg = theme === 'dark' ? '#334155' : '#f1f5f9';

  if (!items.length) return <Empty />;
  const max = Math.max(...items.map((d) => Number(d.count)), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((item) => {
        const pct  = Math.max(3, (Number(item.count) / max) * 100);
        const name = item[nameKey]
          ? item[nameKey]
          : STATUS_VI[item.status] || item.status;
        return (
          <div key={name}>
            <div style={{ display: "flex", justifyContent: "space-between",
              fontSize: 13, marginBottom: 5 }}>
              <span style={{ color: labelColor, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "74%" }}>
                {name}
              </span>
              <span style={{ fontWeight: 700, color: countColor }}>{item.count}</span>
            </div>
            <div style={{ background: trackBg, borderRadius: 999, height: 8, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, background: color, height: "100%",
                borderRadius: 999, transition: "width .5s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Shared primitives ────────────────────────────────────────────────────────
const Empty = () => (
  <div style={{ color: "#94a3b8", fontSize: 13,
    padding: "40px 0", textAlign: "center" }}>
    Không có dữ liệu
  </div>
);

const Card = ({ title, icon, children }) => (
  <div className="bg-bg-surface p-4 sm:p-6 rounded-2xl border border-border-main shadow-sm flex flex-col gap-4 sm:gap-5">
    <div className="font-bold text-sm sm:text-base text-text-main flex items-center gap-2">
      {icon} {title}
    </div>
    {children}
  </div>
);

const StatCard = ({ title, value, icon, accent, loading }) => (
  <div className="bg-bg-surface p-3 sm:p-5 rounded-2xl border border-border-main shadow-sm flex items-center gap-3 sm:gap-4">
    <div style={{
      width: 38, height: 38, borderRadius: 12, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: accent + "1a", fontSize: 18,
    }} className="sm:w-[46px] sm:h-[46px]">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[10px] sm:text-xs text-text-dim mb-0.5 sm:mb-1 truncate">{title}</div>
      <div className="text-lg sm:text-2xl font-extrabold text-text-main leading-none">
        {loading ? "—" : Number(value).toLocaleString("vi-VN")}
      </div>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user, role } = useAuth();
  const [stats,     setStats]     = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingS,  setLoadingS]  = useState(true);
  const [loadingA,  setLoadingA]  = useState(true);

  const loadAll = useCallback(async () => {
    setLoadingS(true);
    setLoadingA(true);
    try {
      const s = await dashboardService.getStats();
      setStats(s);
    } catch (e) { console.error("Stats error:", e); }
    finally { setLoadingS(false); }

    try {
      const a = await dashboardService.getAnalytics();
      setAnalytics(a);
    } catch (e) { console.error("Analytics error:", e); }
    finally { setLoadingA(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Fill missing months with 0 so the bar chart always shows 6 bars
  const months6 = getLast6Months();
  const apptMonthData = months6.map(({ key, label }) => {
    const found = analytics?.appointmentsByMonth?.find((d) => d.month === key);
    return { label, value: found ? Number(found.count) : 0 };
  });

  const KPI = [
    { title: "Người dùng",  value: stats?.users         || 0, icon: "👤", accent: "#6366f1" },
    { title: "Bệnh nhân",   value: stats?.patients      || 0, icon: "🏥", accent: "#14b8a6" },
    { title: "Bác sĩ",      value: stats?.doctors       || 0, icon: "👨‍⚕️", accent: "#3b82f6" },
    { title: "Lịch hẹn",    value: stats?.appointments  || 0, icon: "📅", accent: "#f59e0b" },
    { title: "Tư vấn",      value: stats?.consultations || 0, icon: "💬", accent: "#ec4899" },
  ];

  const grid2 = "grid grid-cols-1 lg:grid-cols-2 gap-4";

  return (
    <div className="flex flex-col gap-4 sm:gap-5">

      {/* Welcome banner */}
      <div className="bg-bg-surface p-4 sm:p-6 sm:px-7 rounded-2xl border border-border-main shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base sm:text-xl font-bold text-[#E06666]">
              Xin chào, {user?.full_name || "Admin"} 👋
            </div>
            <div className="mt-1 text-xs sm:text-sm text-text-dim">
              Bảng điều khiển tổng quan —{" "}
              <span className="font-semibold uppercase">{role}</span>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-1.5 rounded-lg border border-border-main bg-bg-app px-3 py-2 text-xs font-medium text-text-dim hover:text-[#E06666] hover:border-[#E06666]/40 transition shrink-0">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Homepage</span>
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {KPI.map((c) => (
          <StatCard key={c.title} {...c} loading={loadingS} />
        ))}
      </div>

      {/* Row 1: appointments by month | appointment status */}
      <div className={grid2}>
        <Card title="Lịch hẹn 6 tháng gần nhất" icon="📅">
          {loadingA
            ? <div style={{ color: "#94a3b8", fontSize: 13, padding: "40px 0", textAlign: "center" }}>Đang tải...</div>
            : <BarChart data={apptMonthData} color="#6366f1" />}
        </Card>

        <Card title="Phân bố trạng thái lịch hẹn" icon="🍩">
          {loadingA
            ? <div style={{ color: "#94a3b8", fontSize: 13, padding: "40px 0", textAlign: "center" }}>Đang tải...</div>
            : <DonutChart
                segments={analytics?.appointmentsByStatus || []}
                colorMap={APPT_COLOR}
              />}
        </Card>
      </div>

      {/* Row 2: top specialties | consultation status */}
      <div className={grid2}>
        <Card title="Top chuyên khoa (theo số bác sĩ)" icon="🏥">
          {loadingA
            ? <div style={{ color: "#94a3b8", fontSize: 13, padding: "40px 0", textAlign: "center" }}>Đang tải...</div>
            : <HBar
                items={(analytics?.topSpecialties || []).map((s) => ({
                  name: s.name, count: Number(s.count),
                }))}
                color="#14b8a6"
                nameKey="name"
              />}
        </Card>

        <Card title="Phân bố trạng thái tư vấn" icon="💬">
          {loadingA
            ? <div style={{ color: "#94a3b8", fontSize: 13, padding: "40px 0", textAlign: "center" }}>Đang tải...</div>
            : <HBar
                items={(analytics?.consultationsByStatus || []).map((d) => ({
                  status: d.status, count: Number(d.count),
                }))}
                color="#ec4899"
              />}
        </Card>
      </div>

    </div>
  );
};

export default DashboardPage;
