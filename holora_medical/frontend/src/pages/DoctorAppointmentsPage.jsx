import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, Calendar, CalendarDays, CheckCircle, ChevronDown,
  Clock, Filter, Loader2, Monitor, RefreshCw, Search,
  Sparkles, TrendingUp, UserCheck, Users, Video, X, XCircle,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import ConfirmModal from "../components/ConfirmModal";

/* ─────────── Design Tokens ─────────────────────────────── */
const STATUS = {
  scheduled:   { label: "Scheduled",   color: "amber",   icon: Clock },
  confirmed:   { label: "Confirmed",   color: "emerald", icon: CheckCircle },
  checked_in:  { label: "Checked In",  color: "sky",     icon: UserCheck },
  in_progress: { label: "In Progress", color: "blue",    icon: TrendingUp },
  completed:   { label: "Completed",   color: "purple",  icon: CheckCircle },
  cancelled:   { label: "Cancelled",   color: "red",     icon: XCircle },
  no_show:     { label: "No Show",     color: "slate",   icon: X },
};

const PILL = {
  amber:   "bg-amber-100/80 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/25 dark:text-amber-300 dark:ring-amber-700/40",
  emerald: "bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-700/40",
  sky:     "bg-sky-100/80 text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-900/25 dark:text-sky-300 dark:ring-sky-700/40",
  blue:    "bg-blue-100/80 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-900/25 dark:text-blue-300 dark:ring-blue-700/40",
  purple:  "bg-purple-100/80 text-purple-700 ring-1 ring-purple-200/60 dark:bg-purple-900/25 dark:text-purple-300 dark:ring-purple-700/40",
  red:     "bg-red-100/80 text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/25 dark:text-red-300 dark:ring-red-700/40",
  slate:   "bg-slate-100/80 text-slate-600 ring-1 ring-slate-200/60 dark:bg-slate-800/40 dark:text-slate-400 dark:ring-slate-600/40",
};

const GLASS = "backdrop-blur-xl bg-white/60 dark:bg-slate-900/50 border border-white/30 dark:border-slate-700/40 shadow-lg shadow-black/[0.03]";
const GLASS_CARD = `rounded-2xl ${GLASS}`;

/* ─────────── Helpers ───────────────────────────────────── */
const fmtDate = (d, lng) => d ? new Date(d).toLocaleDateString(lng === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (t) => { if (!t) return "—"; const s = String(t); return s.length >= 5 ? s.slice(0, 5) : s; };
const isToday = (d) => { if (!d) return false; return new Date().toDateString() === new Date(d).toDateString(); };
const isTomorrow = (d) => { if (!d) return false; const t = new Date(); t.setDate(t.getDate() + 1); return t.toDateString() === new Date(d).toDateString(); };

const dayLabel = (d, t) => {
  if (isToday(d)) return t("doctor.appointments.today", { defaultValue: "Today" });
  if (isTomorrow(d)) return t("doctor.appointments.tomorrow", { defaultValue: "Tomorrow" });
  return null;
};

/* ─────────── Skeleton ──────────────────────────────────── */
const Pulse = ({ className }) => <div className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/50 ${className}`} />;

const SkeletonBento = () => (
  <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
    {[...Array(5)].map((_, i) => (
      <div key={i} className={`${GLASS_CARD} p-4`}>
        <Pulse className="h-3 w-16 mb-3" />
        <Pulse className="h-7 w-12 mb-1" />
      </div>
    ))}
  </div>
);

/* ─────────── Sub-components ────────────────────────────── */
const StatusPill = ({ status, label }) => {
  const s = STATUS[status] || STATUS.scheduled;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${PILL[s.color] || ""}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};

const TypeBadge = ({ type }) => (
  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
    type === "online"
      ? "bg-cyan-100/70 text-cyan-700 ring-1 ring-cyan-200/50 dark:bg-cyan-900/20 dark:text-cyan-300 dark:ring-cyan-700/30"
      : "bg-slate-100/70 text-slate-600 ring-1 ring-slate-200/50 dark:bg-slate-800/40 dark:text-slate-400 dark:ring-slate-600/30"
  }`}>
    {type === "online" ? <Video className="h-2.5 w-2.5" /> : <Monitor className="h-2.5 w-2.5" />}
    {type}
  </span>
);

/* ══════════════════════════════════════════════════════════
   DoctorAppointmentsPage
   Bento Grid · Glassmorphism · Healthcare SaaS Dashboard
   ══════════════════════════════════════════════════════════ */
const DoctorAppointmentsPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("timeline");
  const [confirmState, setConfirmState] = useState(null);
  const [cancelModal, setCancelModal] = useState({ open: false, id: null, reason: "" });

  /* i18n status labels */
  const sLabel = useMemo(() => Object.fromEntries(
    Object.entries(STATUS).map(([k, v]) => [
      k,
      t(`doctor.appointmentsPage.status.${k === "checked_in" ? "checkedIn" : k === "in_progress" ? "inProgress" : k === "no_show" ? "noShow" : k}`, { defaultValue: v.label }),
    ])
  ), [t]);

  /* ── Fetch ── */
  const fetchAppointments = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await appointmentService.getMyAppointments();
      setAppointments(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("doctor.appointmentsPage.errors.loadFailed", { defaultValue: "Failed to load appointments" }));
      setAppointments([]);
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  /* ── Actions ── */
  const handleUpdateStatus = (id, newStatus) => {
    if (newStatus === "cancelled") { setCancelModal({ open: true, id, reason: "" }); return; }
    setConfirmState({ id, newStatus, cancelReason: "", nextLabel: sLabel[newStatus] || newStatus });
  };

  const handleConfirmCancel = async () => {
    try { await appointmentService.updateStatus(cancelModal.id, "cancelled", cancelModal.reason); fetchAppointments(); }
    catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setCancelModal({ open: false, id: null, reason: "" }); }
  };

  const confirmUpdateStatus = async () => {
    if (!confirmState) return;
    try { await appointmentService.updateStatus(confirmState.id, confirmState.newStatus, confirmState.cancelReason); fetchAppointments(); }
    catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setConfirmState(null); }
  };

  /* ── Derived data ── */
  const filtered = useMemo(() => {
    let list = appointments;
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) =>
        (a.patient_name || "").toLowerCase().includes(q) ||
        (a.appointment_code || "").toLowerCase().includes(q) ||
        (a.reason || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [appointments, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      today:     appointments.filter((a) => a.appointment_date?.slice(0, 10) === today && !["cancelled", "no_show"].includes(a.status)).length,
      pending:   appointments.filter((a) => a.status === "scheduled").length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      completed: appointments.filter((a) => a.status === "completed").length,
      online:    appointments.filter((a) => a.appointment_type === "online" && ["scheduled", "confirmed"].includes(a.status)).length,
    };
  }, [appointments]);

  /* Group by date for timeline */
  const groupedByDate = useMemo(() => {
    const map = {};
    [...filtered].sort((a, b) => {
      const da = a.appointment_date || ""; const db = b.appointment_date || "";
      if (da !== db) return da > db ? -1 : 1;
      return (a.start_time || "") > (b.start_time || "") ? 1 : -1;
    }).forEach((a) => {
      const key = a.appointment_date?.slice(0, 10) || "unknown";
      (map[key] ??= []).push(a);
    });
    return Object.entries(map);
  }, [filtered]);

  /* Next upcoming appointment (Progressive Disclosure) */
  const nextAppointment = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return appointments
      .filter((a) => ["scheduled", "confirmed"].includes(a.status) && (a.appointment_date || "") >= todayStr)
      .sort((a, b) => (a.appointment_date + a.start_time) > (b.appointment_date + b.start_time) ? 1 : -1)[0] || null;
  }, [appointments]);

  /* ── Action buttons ── */
  const renderActions = (app) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <button onClick={() => navigate(`/doctor/appointments/${app.id}`)}
        className="rounded-lg border border-cyan-200/60 bg-cyan-50/60 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-800/40 dark:bg-cyan-900/15 dark:text-cyan-300 dark:hover:bg-cyan-900/30">
        {t("doctor.appointmentsPage.viewDetails", { defaultValue: "Details" })}
      </button>
      {app.appointment_type === "online" && ["scheduled", "confirmed"].includes(app.status) && (
        <button onClick={() => navigate(`/doctor/appointments/${app.id}/room`)}
          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-cyan-500/20 transition hover:shadow-md">
          <Video className="h-3 w-3" /> {t("doctor.appointmentsPage.enterRoom", { defaultValue: "Enter Room" })}
        </button>
      )}
      {app.status === "scheduled" && (
        <>
          <button onClick={() => handleUpdateStatus(app.id, "confirmed")}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600">
            <CheckCircle className="h-3 w-3" /> {t("doctor.appointmentsPage.confirmAction", { defaultValue: "Confirm" })}
          </button>
          <button onClick={() => handleUpdateStatus(app.id, "cancelled")}
            className="rounded-lg border border-red-200/60 bg-red-50/60 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
            {t("doctor.appointmentsPage.cancelAction", { defaultValue: "Cancel" })}
          </button>
        </>
      )}
      {app.status === "confirmed" && (
        <>
          <button onClick={() => handleUpdateStatus(app.id, "completed")}
            className="inline-flex items-center gap-1 rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-purple-500/20 transition hover:bg-purple-600">
            <CheckCircle className="h-3 w-3" /> {t("doctor.appointmentsPage.completeAction", { defaultValue: "Complete" })}
          </button>
          <button onClick={() => handleUpdateStatus(app.id, "cancelled")}
            className="rounded-lg border border-red-200/60 bg-red-50/60 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
            {t("doctor.appointmentsPage.cancelAction", { defaultValue: "Cancel" })}
          </button>
        </>
      )}
      {["completed", "cancelled", "no_show"].includes(app.status) && (
        <span className="text-[11px] font-medium italic text-text-dim">{t("doctor.appointmentsPage.closedLabel", { defaultValue: "Closed" })}</span>
      )}
    </div>
  );

  /* ══════ JSX ════════════════════════════════════════════ */
  return (
    <div className="mx-auto max-w-7xl space-y-5">

      {/* ── HERO: Glassmorphism Header ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900/40 p-6 text-white shadow-2xl sm:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE4YzEgMSAxIDMgMCA0bC0yIDJjLTEgMS0zIDEtNCAwbC0yLTJjLTEtMS0xLTMgMC00bDItMmMxLTEgMy0xIDQgMGwyIDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" /> {t("doctor.zone", { defaultValue: "Doctor Zone" })}
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {t("doctor.appointmentsPage.title", { defaultValue: "My Appointments" })}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
            {t("doctor.appointmentsPage.heroDescription", { defaultValue: "View and manage all your patient appointments." })}
          </p>
        </div>

        {/* Next appointment preview — Progressive Disclosure */}
        {!loading && nextAppointment && (
          <div className="relative mt-5 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md sm:mt-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                {t("doctor.appointments.nextUp", { defaultValue: "Next Appointment" })}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white">
                {nextAppointment.patient_name} — {fmtTime(nextAppointment.start_time)}
              </p>
              <p className="text-xs text-slate-400">
                {dayLabel(nextAppointment.appointment_date, t) || fmtDate(nextAppointment.appointment_date, i18n.language)}
                {nextAppointment.appointment_type === "online" && " · 🎥 Online"}
              </p>
            </div>
            <button onClick={() => navigate(`/doctor/appointments/${nextAppointment.id}`)}
              className="shrink-0 rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/30">
              {t("doctor.appointmentsPage.viewDetails", { defaultValue: "Details" })} →
            </button>
          </div>
        )}
      </section>

      {/* ── BENTO KPI GRID ── */}
      {loading ? <SkeletonBento /> : (
        <section className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          {[
            { label: t("doctor.appointments.kpi.today",     { defaultValue: "Today" }),     value: stats.today,     icon: CalendarDays, gradient: "from-cyan-500/10 to-teal-500/10 dark:from-cyan-900/20 dark:to-teal-900/20" },
            { label: t("doctor.appointmentsPage.stats.pending",   { defaultValue: "Pending" }),   value: stats.pending,   icon: Clock,        gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-900/20 dark:to-orange-900/20" },
            { label: t("doctor.appointmentsPage.stats.confirmed", { defaultValue: "Confirmed" }), value: stats.confirmed, icon: CheckCircle,  gradient: "from-emerald-500/10 to-green-500/10 dark:from-emerald-900/20 dark:to-green-900/20" },
            { label: t("doctor.appointmentsPage.stats.completed", { defaultValue: "Completed" }), value: stats.completed, icon: CheckCircle,  gradient: "from-purple-500/10 to-violet-500/10 dark:from-purple-900/20 dark:to-violet-900/20" },
            { label: t("doctor.appointments.kpi.online",    { defaultValue: "Online" }),    value: stats.online,    icon: Video,        gradient: "from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20" },
          ].map((kpi) => (
            <div key={kpi.label} className={`${GLASS_CARD} group relative overflow-hidden p-4 transition hover:shadow-md`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-60`} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-text-dim">{kpi.label}</p>
                  <p className="mt-1.5 text-2xl font-extrabold text-text-main">{kpi.value}</p>
                </div>
                <kpi.icon className="h-5 w-5 text-text-dim/40" />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── TOOLBAR: Search + Filter + View Toggle ── */}
      <section className={`${GLASS_CARD} p-4`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("doctor.appointments.search", { defaultValue: "Search patient, code..." })}
              className="w-full rounded-xl border border-border-main bg-bg-app/70 py-2.5 pl-10 pr-4 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-cyan-500/40 dark:bg-slate-800/70" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim pointer-events-none" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-border-main bg-bg-app/70 py-2.5 pl-9 pr-8 text-sm font-medium text-text-main outline-none transition focus:ring-2 focus:ring-cyan-500/40 dark:bg-slate-800/70">
              <option value="">{t("doctor.appointmentsPage.filters.all", { defaultValue: "All Status" })}</option>
              {Object.entries(sLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim pointer-events-none" />
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl border border-border-main overflow-hidden">
            {[
              { key: "timeline", icon: CalendarDays, label: t("doctor.appointments.viewTimeline", { defaultValue: "Timeline" }) },
              { key: "table",    icon: Users,        label: t("doctor.appointments.viewTable",    { defaultValue: "Table" }) },
            ].map((v) => (
              <button key={v.key} onClick={() => setViewMode(v.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition ${
                  viewMode === v.key
                    ? "bg-cyan-500 text-white shadow-inner"
                    : "bg-bg-app/50 text-text-dim hover:text-text-main dark:bg-slate-800/50"
                }`}>
                <v.icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button onClick={fetchAppointments}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3 py-2.5 text-xs font-semibold text-text-dim transition hover:text-text-main hover:bg-bg-app/70">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("common.refresh", { defaultValue: "Refresh" })}</span>
          </button>
        </div>

        {/* Active filters */}
        {(statusFilter || searchQuery) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-text-dim">{t("doctor.appointments.activeFilters", { defaultValue: "Active:" })}</span>
            {statusFilter && (
              <button onClick={() => setStatusFilter("")}
                className="inline-flex items-center gap-1 rounded-full bg-cyan-100/60 px-2.5 py-1 font-medium text-cyan-700 dark:bg-cyan-900/25 dark:text-cyan-300">
                {sLabel[statusFilter]} <X className="h-3 w-3" />
              </button>
            )}
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1 rounded-full bg-cyan-100/60 px-2.5 py-1 font-medium text-cyan-700 dark:bg-cyan-900/25 dark:text-cyan-300">
                &quot;{searchQuery}&quot; <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-5 py-4 text-sm text-red-700 backdrop-blur dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* Result count */}
      {!loading && (
        <p className="text-xs font-medium text-text-dim px-1">
          {t("doctor.appointments.showing", { defaultValue: "Showing {{count}} of {{total}}", count: filtered.length, total: appointments.length })}
        </p>
      )}

      {/* ══════ TIMELINE VIEW ══════════════════════════════ */}
      {viewMode === "timeline" && (
        <section className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`${GLASS_CARD} p-5`}>
                  <Pulse className="h-4 w-24 mb-4" />
                  <div className="space-y-3">
                    {[1, 2].map((j) => (
                      <div key={j} className="flex gap-4"><Pulse className="h-14 w-14 rounded-xl" /><div className="flex-1 space-y-2"><Pulse className="h-4 w-40" /><Pulse className="h-3 w-60" /></div></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={`${GLASS_CARD} py-16 text-center`}>
              <Calendar className="mx-auto h-12 w-12 text-text-dim/40" />
              <p className="mt-4 text-sm font-medium text-text-dim">
                {statusFilter || searchQuery
                  ? t("doctor.appointmentsPage.emptyFiltered", { defaultValue: "No appointments match this filter." })
                  : t("doctor.appointmentsPage.emptyAll", { defaultValue: "No appointments yet." })}
              </p>
            </div>
          ) : groupedByDate.map(([date, apps]) => {
            const dLabel = dayLabel(date, t);
            const dateObj = new Date(date);
            const weekday = dateObj.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", { weekday: "long" });

            return (
              <div key={date}>
                {/* Date header */}
                <div className="mb-3 flex items-center gap-3 px-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
                    isToday(date)
                      ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/25"
                      : "bg-bg-surface border border-border-main text-text-main dark:bg-slate-800"
                  }`}>
                    {dateObj.getDate()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-main">
                      {dLabel && <span className="mr-2 text-cyan-600 dark:text-cyan-400">{dLabel}</span>}
                      {weekday}
                    </p>
                    <p className="text-[11px] text-text-dim">
                      {fmtDate(date, i18n.language)} · {apps.length} {t("doctor.appointments.apptUnit", { defaultValue: "appointment(s)" })}
                    </p>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 sm:pl-[52px]">
                  {apps.map((app) => (
                    <article key={app.id}
                      className={`group ${GLASS_CARD} p-4 transition-all hover:shadow-md hover:border-cyan-200/40 dark:hover:border-cyan-700/30 cursor-pointer`}
                      onClick={() => navigate(`/doctor/appointments/${app.id}`)}>
                      <div className="flex items-start gap-4">
                        {/* Time block */}
                        <div className="hidden shrink-0 flex-col items-center sm:flex">
                          <span className="text-lg font-bold text-text-main leading-none">{fmtTime(app.start_time)}</span>
                          <span className="mt-0.5 text-[10px] text-text-dim">{fmtTime(app.end_time)}</span>
                        </div>

                        {/* Timeline dot */}
                        <div className="hidden sm:flex flex-col items-center">
                          <div className={`h-2.5 w-2.5 rounded-full ${
                            isToday(app.appointment_date) && ["scheduled", "confirmed"].includes(app.status)
                              ? "bg-cyan-500 ring-4 ring-cyan-500/20" : "bg-border-main"
                          }`} />
                          <div className="w-px flex-1 bg-border-main/50 mt-1" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-text-main truncate">{app.patient_name || "—"}</span>
                            <StatusPill status={app.status} label={sLabel[app.status] || app.status} />
                            <TypeBadge type={app.appointment_type} />
                            {app.recurring_id && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                <Sparkles className="h-3 w-3" /> Recurring
                              </span>
                            )}
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-dim">
                            <span className="inline-flex items-center gap-1 sm:hidden">
                              <Clock className="h-3 w-3" /> {fmtTime(app.start_time)} – {fmtTime(app.end_time)}
                            </span>
                            <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">{app.appointment_code}</span>
                            {app.patient_phone && <span>📞 {app.patient_phone}</span>}
                            {app.reason && <span className="truncate max-w-[200px]" title={app.reason}>💬 {app.reason}</span>}
                          </div>

                          {/* Actions */}
                          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                            {renderActions(app)}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ══════ TABLE VIEW ═════════════════════════════════ */}
      {viewMode === "table" && (
        <section className={`${GLASS_CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-main/60 text-left text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                  <th className="px-5 py-4">{t("doctor.appointmentsPage.columns.codeDate", { defaultValue: "Code / Date" })}</th>
                  <th className="px-5 py-4">{t("doctor.appointmentsPage.columns.patient", { defaultValue: "Patient" })}</th>
                  <th className="px-5 py-4 hidden md:table-cell">{t("doctor.appointmentsPage.columns.reasonType", { defaultValue: "Reason / Type" })}</th>
                  <th className="px-5 py-4">{t("doctor.appointmentsPage.columns.status", { defaultValue: "Status" })}</th>
                  <th className="px-5 py-4 text-right">{t("doctor.appointmentsPage.columns.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-cyan-500" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5" className="py-12 text-center text-sm text-text-dim">
                    {t("doctor.appointmentsPage.emptyAll", { defaultValue: "No appointments yet." })}
                  </td></tr>
                ) : filtered.map((app) => (
                  <tr key={app.id}
                    className="border-t border-border-main/40 text-sm transition hover:bg-cyan-50/30 dark:hover:bg-cyan-900/5 cursor-pointer"
                    onClick={() => navigate(`/doctor/appointments/${app.id}`)}>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{app.appointment_code}</p>
                      <p className="mt-0.5 text-xs text-text-dim">{fmtDate(app.appointment_date, i18n.language)}</p>
                      <p className="text-xs text-text-dim">{fmtTime(app.start_time)} – {fmtTime(app.end_time)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-text-main">{app.patient_name || "—"}</p>
                      <p className="text-xs text-text-dim">{app.patient_phone || ""}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="max-w-[240px] truncate text-text-main" title={app.reason}>{app.reason || "—"}</p>
                      <div className="mt-1"><TypeBadge type={app.appointment_type} /></div>
                    </td>
                    <td className="px-5 py-4"><StatusPill status={app.status} label={sLabel[app.status] || app.status} /></td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {renderActions(app)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Cancel Reason Modal (Glassmorphism) ── */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <div className={`w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl ${GLASS} p-6`}>
            <h3 className="text-base font-bold text-text-main">
              {t("doctor.appointmentsPage.cancelPrompt", { defaultValue: "Cancellation Reason" })}
            </h3>
            <p className="mt-1 text-sm text-text-dim">
              {t("doctor.appointmentsPage.cancelPromptDesc", { defaultValue: "Enter a reason so the patient will be notified." })}
            </p>
            <textarea autoFocus rows={3}
              value={cancelModal.reason}
              onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder={t("doctor.appointmentsPage.cancelPlaceholder", { defaultValue: "e.g. Doctor has an urgent schedule change..." })}
              className="mt-4 w-full resize-none rounded-xl border border-border-main bg-bg-app/80 px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-red-400/50 dark:bg-slate-800/80"
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setCancelModal({ open: false, id: null, reason: "" })}
                className="flex-1 rounded-xl border border-border-main px-4 py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">
                {t("common.cancel", { defaultValue: "Cancel" })}
              </button>
              <button onClick={handleConfirmCancel}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-red-500/20 transition hover:bg-red-600">
                {t("doctor.appointmentsPage.confirmCancel", { defaultValue: "Confirm Cancel" })}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmState)}
        title={t("doctor.appointmentsPage.confirmUpdate", { defaultValue: "Update status to {{status}}?", status: confirmState?.nextLabel || "" })}
        description={t("doctor.appointmentsPage.listDescription", { defaultValue: "All your upcoming and past appointments" })}
        badgeLabel={t("doctor.zone", { defaultValue: "Doctor Zone" })}
        tone={confirmState?.newStatus === "cancelled" ? "danger" : "info"}
        confirmLabel={confirmState?.newStatus === "cancelled" ? t("doctor.appointmentsPage.cancelAction", { defaultValue: "Cancel" }) : t("common.update", { defaultValue: "Update" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        closeLabel={t("common.close", { defaultValue: "Close" })}
        onConfirm={confirmUpdateStatus}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
};

export default DoctorAppointmentsPage;
