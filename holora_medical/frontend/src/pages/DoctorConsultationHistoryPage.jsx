import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, CalendarDays, CheckCircle, ChevronDown, Clock,
  Filter, Loader2, MessageSquare, RefreshCw, Search,
  Sparkles, Stethoscope, TrendingUp, User, Users, X,
} from "lucide-react";
import { consultationService } from "../services/consultationService";

/* ─────────── Design Tokens (shared system) ──────────────── */
const C_STATUS = {
  pending:     { label: "Pending",     color: "amber",   icon: Clock },
  in_progress: { label: "In Progress", color: "sky",     icon: TrendingUp },
  completed:   { label: "Completed",   color: "emerald", icon: CheckCircle },
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

/* ─────────── Helpers ────────────────────────────────────── */
const fmtDateTime = (v, lng) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString(lng === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const isToday = (d) => { if (!d) return false; return new Date().toDateString() === new Date(d).toDateString(); };

/* ─────────── Sub-components ─────────────────────────────── */
const Pulse = ({ className }) => <div className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/50 ${className}`} />;

const StatusPill = ({ status, t }) => {
  const s = C_STATUS[status] || C_STATUS.pending;
  const Icon = s.icon;
  const label = t(`doctor.consultationsPage.status.${status === "in_progress" ? "inProgress" : status}`, { defaultValue: s.label });
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${PILL[s.color] || ""}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════
   DoctorConsultationHistoryPage
   Bento Grid · Glassmorphism · Progressive Disclosure
   ══════════════════════════════════════════════════════════ */
const DoctorConsultationHistoryPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lng = i18n.language;

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const statusLabels = useMemo(() => ({
    pending:     t("doctor.consultationsPage.status.pending",    { defaultValue: "Pending" }),
    in_progress: t("doctor.consultationsPage.status.inProgress", { defaultValue: "In Progress" }),
    completed:   t("doctor.consultationsPage.status.completed",  { defaultValue: "Completed" }),
  }), [t]);

  const fetchHistory = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError("");
      const res = await consultationService.getDoctorRequests();
      setConsultations(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("doctor.consultationsPage.errors.loadHistory", { defaultValue: "Failed to load consultations" }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  /* ── Derived data ── */
  const stats = useMemo(() => ({
    total:      consultations.length,
    pending:    consultations.filter((c) => c.status === "pending").length,
    inProgress: consultations.filter((c) => c.status === "in_progress").length,
    completed:  consultations.filter((c) => c.status === "completed").length,
  }), [consultations]);

  const filtered = useMemo(() => {
    let list = consultations;
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((c) =>
        (c.chief_complaint || "").toLowerCase().includes(q) ||
        (c.patient_name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [consultations, statusFilter, searchTerm]);

  // Nearest pending consultation for Progressive Disclosure hero
  const nextPending = useMemo(() => consultations.find((c) => c.status === "pending"), [consultations]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 animate-pulse">
          <Pulse className="h-3 w-20 mb-4 !bg-slate-700" />
          <Pulse className="h-8 w-64 mb-3 !bg-slate-700" />
          <Pulse className="h-4 w-80 !bg-slate-700" />
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className={`${GLASS_CARD} p-5`}><Pulse className="h-3 w-16 mb-3" /><Pulse className="h-8 w-12" /></div>)}
        </div>
        <div className={`${GLASS_CARD} p-5`}><Pulse className="h-10 w-full" /></div>
        {[1,2,3].map(i => <div key={i} className={`${GLASS_CARD} p-4`}><Pulse className="h-16 w-full" /></div>)}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">

      {/* ── HERO: Glassmorphism header ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900/40 p-6 text-white shadow-2xl sm:p-8">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE4YzEgMSAxIDMgMCA0bC0yIDJjLTEgMS0zIDEtNCAwbC0yLTJjLTEtMS0xLTMgMC00bDItMmMxLTEgMy0xIDQgMGwyIDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> {t("doctor.zone", { defaultValue: "Doctor Zone" })}
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              {t("doctor.consultationsPage.title", { defaultValue: "Consultation Requests" })}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              {t("doctor.consultationsPage.heroDescription", { defaultValue: "Review and respond to patient consultation requests." })}
            </p>
          </div>

          {/* Progressive Disclosure — next pending consultation preview */}
          {nextPending && (
            <div onClick={() => navigate(`/doctor/consultations/${nextPending.id}`)}
              className="shrink-0 cursor-pointer rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md transition hover:bg-white/[0.10] lg:max-w-xs">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                <Clock className="h-3 w-3" />
                {t("doctor.consultationsPage.nextPending", { defaultValue: "Next Pending" })}
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-bold text-white">{nextPending.chief_complaint || "—"}</p>
              <p className="mt-1 text-xs text-slate-400">
                {nextPending.patient_name || t("doctor.consultationsPage.unassignedPatient", { defaultValue: "Unknown" })}
                <span className="mx-1.5 text-white/20">·</span>
                {fmtDateTime(nextPending.created_at, lng)}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── BENTO KPI GRID ── */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {[
          { key: "pending",    label: t("doctor.consultationsPage.pendingLabel",    { defaultValue: "Pending" }),     value: stats.pending,    icon: CalendarDays, gradient: "from-amber-500/10 to-orange-500/5" },
          { key: "inProgress", label: t("doctor.consultationsPage.inProgressLabel", { defaultValue: "In Progress" }), value: stats.inProgress, icon: MessageSquare, gradient: "from-sky-500/10 to-blue-500/5" },
          { key: "completed",  label: t("doctor.consultationsPage.completedLabel",  { defaultValue: "Completed" }),   value: stats.completed,  icon: Stethoscope,   gradient: "from-emerald-500/10 to-teal-500/5" },
        ].map((kpi) => (
          <div key={kpi.key} className={`${GLASS_CARD} relative overflow-hidden p-5`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} pointer-events-none`} />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-dim">{kpi.label}</p>
                <p className="mt-1 text-3xl font-extrabold text-text-main">{kpi.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 dark:bg-slate-800/50">
                <kpi.icon className="h-5 w-5 text-text-dim" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── TOOLBAR: search + filter + refresh ── */}
      <section className={`${GLASS_CARD} px-5 py-3`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("doctor.consultationsPage.searchPlaceholder", { defaultValue: "Search by complaint or patient..." })}
              className="w-full rounded-xl border border-border-main/60 bg-bg-app/80 py-2.5 pl-10 pr-3 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-cyan-400/40 dark:bg-slate-800/80" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-xl border border-border-main/60 bg-bg-app/80 py-2.5 pl-9 pr-8 text-sm font-medium text-text-main outline-none transition focus:ring-2 focus:ring-cyan-400/40 dark:bg-slate-800/80">
              <option value="">{t("doctor.consultationsPage.filterAll", { defaultValue: "All Status" })}</option>
              {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim" />
          </div>

          {/* Refresh */}
          <button onClick={() => fetchHistory(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border-main/60 px-4 py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Active filter chips */}
        {(statusFilter || searchTerm) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {statusFilter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100/80 px-3 py-1 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-200/60 dark:bg-cyan-900/25 dark:text-cyan-300 dark:ring-cyan-700/40">
                {statusLabels[statusFilter]}
                <button onClick={() => setStatusFilter("")}><X className="h-3 w-3" /></button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-3 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200/60 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-600/40">
                &quot;{searchTerm}&quot;
                <button onClick={() => setSearchTerm("")}><X className="h-3 w-3" /></button>
              </span>
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

      {/* ── DESKTOP TABLE ── */}
      <section className={`${GLASS_CARD} hidden md:block overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-main/40">
                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-text-dim">{t("doctor.consultationsPage.columns.reason", { defaultValue: "Complaint" })}</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-text-dim">{t("doctor.consultationsPage.columns.patient", { defaultValue: "Patient" })}</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-text-dim">{t("doctor.consultationsPage.columns.createdAt", { defaultValue: "Date" })}</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-text-dim">{t("doctor.consultationsPage.columns.status", { defaultValue: "Status" })}</th>
                <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-text-dim">{t("doctor.consultationsPage.columns.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-14 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-text-dim/40" />
                    <p className="mt-3 text-sm text-text-dim">{t("doctor.consultationsPage.empty", { defaultValue: "No consultations found." })}</p>
                  </td>
                </tr>
              ) : filtered.map((item) => (
                <tr key={item.id}
                  onClick={() => navigate(`/doctor/consultations/${item.id}`)}
                  className="cursor-pointer border-t border-border-main/30 transition hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10">
                  <td className="px-5 py-4">
                    <p className="max-w-xs truncate text-sm font-semibold text-text-main" title={item.chief_complaint}>
                      {item.chief_complaint || "—"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100/60 dark:bg-cyan-900/20">
                        <User className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="text-sm text-text-main">{item.patient_name || t("doctor.consultationsPage.unassignedPatient", { defaultValue: "Unknown" })}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-text-dim">
                      {fmtDateTime(item.created_at, lng)}
                      {isToday(item.created_at) && (
                        <span className="ml-2 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{t("doctor.consultationsPage.today", { defaultValue: "TODAY" })}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={item.status} t={t} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/doctor/consultations/${item.id}`); }}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-cyan-500/20 transition hover:bg-cyan-600">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {t("doctor.consultationsPage.viewAction", { defaultValue: "View" })}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── MOBILE CARDS ── */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className={`${GLASS_CARD} py-14 text-center`}>
            <MessageSquare className="mx-auto h-8 w-8 text-text-dim/40" />
            <p className="mt-3 text-sm text-text-dim">{t("doctor.consultationsPage.empty", { defaultValue: "No consultations found." })}</p>
          </div>
        ) : filtered.map((item) => (
          <article key={item.id}
            onClick={() => navigate(`/doctor/consultations/${item.id}`)}
            className={`${GLASS_CARD} cursor-pointer p-4 transition hover:shadow-xl hover:shadow-black/[0.05]`}>
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-bold text-text-main" title={item.chief_complaint}>
                {item.chief_complaint || "—"}
              </p>
              <StatusPill status={item.status} t={t} />
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-text-dim">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.patient_name || t("doctor.consultationsPage.unassignedPatient", { defaultValue: "Unknown" })}</span>
            </div>
            <p className="mt-1 text-xs text-text-dim">{fmtDateTime(item.created_at, lng)}</p>
            <div className="mt-3 border-t border-border-main/40 pt-3">
              <button onClick={(e) => { e.stopPropagation(); navigate(`/doctor/consultations/${item.id}`); }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-cyan-500/20 transition hover:bg-cyan-600">
                <MessageSquare className="h-3.5 w-3.5" />
                {t("doctor.consultationsPage.viewAction", { defaultValue: "View" })}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default DoctorConsultationHistoryPage;
