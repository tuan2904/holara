import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, Calendar, CalendarCheck, CheckCircle2, ChevronDown,
  Clock, Filter, Loader2, RefreshCw, Search, Video, X, XCircle,
} from "lucide-react";
import { appointmentService } from "../../services/appointmentService";

/* ── Constants ──────────────────────────────── */
const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: "",            labelKey: "admin.allStatuses",         fallback: "All statuses" },
  { value: "scheduled",   labelKey: "admin.statusScheduled",    fallback: "Scheduled" },
  { value: "confirmed",   labelKey: "admin.statusConfirmed",    fallback: "Confirmed" },
  { value: "checked_in",  labelKey: "admin.statusCheckedIn",    fallback: "Checked in" },
  { value: "in_progress", labelKey: "admin.statusInProgress",   fallback: "In progress" },
  { value: "completed",   labelKey: "admin.statusCompleted",    fallback: "Completed" },
  { value: "cancelled",   labelKey: "admin.statusCancelled",    fallback: "Cancelled" },
  { value: "no_show",     labelKey: "admin.statusNoShow",       fallback: "No show" },
];

const STATUS_CLS = {
  scheduled:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  checked_in:  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  no_show:     "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

const statusLabel = (status, t) => {
  const opt = STATUS_OPTIONS.find((o) => o.value === status);
  return opt ? t(opt.labelKey, { defaultValue: opt.fallback }) : status;
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const fmtTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/* ── Skeleton ──────────────────────────────── */
const SW = [75, 55, 40, 90, 60, 70, 50, 85];
const SkeletonRow = ({ i }) => (
  <tr className="animate-pulse">
    {Array.from({ length: 6 }).map((_, c) => (
      <td key={c} className="px-4 py-3.5">
        <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[(i + c) % SW.length]}%` }} />
      </td>
    ))}
  </tr>
);
const SkeletonCard = ({ i }) => (
  <div className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
    <div className="flex items-start gap-3">
      <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[i % SW.length]}%` }} />
        <div className="h-3 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  </div>
);

/* ── Main Component ──────────────────────── */
const AppointmentsAdminPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [confirmState, setConfirmState] = useState(null);   // { id, newStatus, cancelReason }
  const [cancelModal, setCancelModal] = useState(null);      // { id, newStatus }
  const [cancelReasonInput, setCancelReasonInput] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  /* ── Fetch ── */
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await appointmentService.getAllAppointmentsAdmin({
        status: statusFilter, start_date: startDate, end_date: endDate, search,
      });
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || t("admin.errorFetchingAppointments", { defaultValue: "Failed to load appointments" }));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [statusFilter, startDate, endDate, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  useEffect(() => { setPage(1); }, [statusFilter, startDate, endDate, search]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const scheduled = appointments.filter((a) => a.status === "scheduled").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    return { total: appointments.length, scheduled, confirmed, completed };
  }, [appointments]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = appointments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= safePage - 1 && i <= safePage + 1)) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== "...") {
      pageNumbers.push("...");
    }
  }

  /* ── Status update ── */
  const handleUpdateStatus = (id, newStatus) => {
    if (newStatus === "cancelled") {
      setCancelModal({ id, newStatus });
      setCancelReasonInput("");
      return;
    }
    setConfirmState({ id, newStatus, cancelReason: "" });
  };

  const confirmUpdateStatus = async () => {
    if (!confirmState) return;
    try {
      setError("");
      await appointmentService.updateStatus(confirmState.id, confirmState.newStatus, confirmState.cancelReason);
      setSuccess(t("admin.appointmentStatusUpdated", { defaultValue: "Appointment status updated" }));
      fetchAppointments();
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.errorUpdatingStatus", { defaultValue: "Failed to update status" }));
    } finally {
      setConfirmState(null);
    }
  };

  const confirmCancelWithReason = () => {
    const reason = cancelReasonInput.trim();
    setCancelModal(null);
    setCancelReasonInput("");
    setConfirmState({ id: cancelModal.id, newStatus: cancelModal.newStatus, cancelReason: reason });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const hasFilter = statusFilter || startDate || endDate;
  const clearFilters = () => { setStatusFilter(""); setStartDate(""); setEndDate(""); };

  /* ── Render action buttons for a row ── */
  const renderActions = (app, mobile = false) => {
    const btnBase = mobile
      ? "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition"
      : "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition";

    if (app.status === "scheduled") {
      return (
        <>
          <button onClick={() => handleUpdateStatus(app.id, "confirmed")}
            className={`${btnBase} bg-emerald-500 text-white hover:bg-emerald-600`}>
            <CheckCircle2 className="h-3 w-3" />{t("admin.approve", { defaultValue: "Approve" })}
          </button>
          <button onClick={() => handleUpdateStatus(app.id, "cancelled")}
            className={`${btnBase} bg-red-500 text-white hover:bg-red-600`}>
            <XCircle className="h-3 w-3" />{t("admin.reject", { defaultValue: "Reject" })}
          </button>
        </>
      );
    }
    if (app.status === "confirmed") {
      return (
        <>
          <button onClick={() => navigate(`/admin/appointments/${app.id}/room`)}
            className={`${btnBase} bg-indigo-600 text-white hover:bg-indigo-700`}>
            <Video className="h-3 w-3" />{t("admin.enterRoom", { defaultValue: "Enter room" })}
          </button>
          <button onClick={() => handleUpdateStatus(app.id, "completed")}
            className={`${btnBase} border border-border-main text-text-dim hover:bg-bg-app`}>
            <CheckCircle2 className="h-3 w-3" />{t("admin.complete", { defaultValue: "Complete" })}
          </button>
        </>
      );
    }
    return <span className="text-xs text-text-dim">—</span>;
  };

  return (
    <div className="space-y-6">

      {/* ── Hero ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-indigo-400" />
              <h1 className="text-xl sm:text-2xl font-bold">{t("admin.appointmentsManagement", { defaultValue: "Appointments" })}</h1>
            </div>
            <p className="mt-1 text-sm text-slate-300">{t("admin.manageAppointmentsDesc", { defaultValue: "Review and manage all appointment bookings across branches" })}</p>
          </div>
          <button onClick={fetchAppointments} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/10 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh")}
          </button>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("admin.total", { defaultValue: "Total" }), value: stats.total, icon: Calendar },
            { label: t("admin.statusScheduled", { defaultValue: "Scheduled" }), value: stats.scheduled, icon: Clock },
            { label: t("admin.statusConfirmed", { defaultValue: "Confirmed" }), value: stats.confirmed, icon: CalendarCheck },
            { label: t("admin.statusCompleted", { defaultValue: "Completed" }), value: stats.completed, icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-white/5 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2 text-slate-400">
                <Icon className="h-4 w-4" /><span className="text-xs font-medium">{label}</span>
              </div>
              <p className="mt-1 text-lg font-bold">{loading ? "—" : value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Alerts ── */}
      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Search + Filter Toggle ── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("admin.searchAppointments", { defaultValue: "Search patient, code, doctor..." })}
              className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-9 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-indigo-500/40 dark:bg-slate-900" />
            {(search || searchInput) && (
              <button type="button" onClick={() => { setSearch(""); setSearchInput(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              hasFilter
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                : "border-border-main text-text-main hover:bg-bg-app"
            }`}>
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{t("admin.filters", { defaultValue: "Filters" })}</span>
            {hasFilter && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">{[statusFilter, startDate, endDate].filter(Boolean).length}</span>}
            <ChevronDown className={`h-3 w-3 transition ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="rounded-xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[160px]">
                <label className="mb-1 block text-xs font-medium text-text-dim">{t("admin.status")}</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-900">
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.labelKey, { defaultValue: o.fallback })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-dim">{t("admin.fromDate", { defaultValue: "From" })}</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-dim">{t("admin.toDate", { defaultValue: "To" })}</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-900" />
              </div>
              {hasFilter && (
                <button onClick={clearFilters}
                  className="rounded-lg border border-border-main px-3 py-2 text-xs font-medium text-text-dim transition hover:bg-bg-app">
                  {t("admin.clearFilters", { defaultValue: "Clear filters" })}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop Table ──────────────────── */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-main">
            <thead className="bg-bg-app dark:bg-slate-900/60">
              <tr>
                {[
                  t("admin.codeDate", { defaultValue: "Code / Date" }),
                  t("admin.patient"),
                  t("admin.doctorBranch", { defaultValue: "Doctor / Branch" }),
                  t("admin.reasonType", { defaultValue: "Reason / Type" }),
                  t("admin.status"),
                  t("common.actions"),
                ].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.07em] text-text-dim ${i >= 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} i={i} />)
              ) : paged.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-text-dim">{t("admin.noAppointmentsFound", { defaultValue: "No appointments found" })}</td></tr>
              ) : paged.map((app) => (
                <tr key={app.id} className="group hover:bg-bg-app dark:hover:bg-slate-900/40 transition">
                  {/* Code + Date */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{app.appointment_code}</p>
                    <p className="mt-0.5 text-xs font-medium text-text-main">{fmtDate(app.appointment_date)}</p>
                    <p className="text-xs text-text-dim">{fmtTime(app.start_time)} – {fmtTime(app.end_time)}</p>
                  </td>
                  {/* Patient */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-text-main">{app.patient_name || "—"}</p>
                    {app.patient_phone && <p className="text-xs text-text-dim">{app.patient_phone}</p>}
                  </td>
                  {/* Doctor / Branch */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-main">{app.doctor_name || "—"}</p>
                    {app.branch_name && (
                      <span className="mt-0.5 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                        {app.branch_name}
                      </span>
                    )}
                  </td>
                  {/* Reason / Type */}
                  <td className="px-4 py-3">
                    <p className="max-w-[180px] truncate text-sm text-text-dim" title={app.reason}>{app.reason || "—"}</p>
                    <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      {app.appointment_type}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[app.status] || "bg-slate-100 text-slate-600"}`}>
                      {statusLabel(app.status, t)}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 transition group-hover:opacity-100">
                      {renderActions(app)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Cards ──────────────────── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} i={i} />)
        ) : paged.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-dim">{t("admin.noAppointmentsFound", { defaultValue: "No appointments found" })}</p>
        ) : paged.map((app) => (
          <div key={app.id} className="rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{app.appointment_code}</p>
                <p className="mt-0.5 text-xs text-text-dim">
                  {fmtDate(app.appointment_date)} · {fmtTime(app.start_time)} – {fmtTime(app.end_time)}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[app.status] || "bg-slate-100 text-slate-600"}`}>
                {statusLabel(app.status, t)}
              </span>
            </div>

            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-text-dim">{t("admin.patient")}:</span>
                <span className="font-semibold text-text-main">{app.patient_name || "—"}</span>
                {app.patient_phone && <span className="text-xs text-text-dim">({app.patient_phone})</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-dim">{t("admin.doctor", { defaultValue: "Doctor" })}:</span>
                <span className="text-text-main">{app.doctor_name || "—"}</span>
              </div>
              {app.branch_name && (
                <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                  {app.branch_name}
                </span>
              )}
              {app.reason && <p className="truncate text-xs text-text-dim">{app.reason}</p>}
              <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                {app.appointment_type}
              </span>
            </div>

            {/* Mobile actions */}
            {(app.status === "scheduled" || app.status === "confirmed") && (
              <div className="mt-3 flex gap-2">
                {renderActions(app, true)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          {pageNumbers.map((n, i) =>
            n === "..." ? (
              <span key={`e${i}`} className="px-2 text-text-dim">…</span>
            ) : (
              <button key={n} onClick={() => setPage(n)}
                className={`min-w-[36px] rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  n === safePage
                    ? "bg-indigo-500 text-white shadow shadow-indigo-500/25"
                    : "text-text-dim hover:bg-bg-app dark:hover:bg-slate-800"
                }`}>
                {n}
              </button>
            )
          )}
        </div>
      )}

      {/* ── Confirm Status Modal ── */}
      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-text-main">
              {t("admin.confirmStatusChange", { defaultValue: "Confirm status change" })}
            </h3>
            <p className="mt-2 text-sm text-text-dim">
              {t("admin.changeStatusTo", { defaultValue: "Change status to" })}{" "}
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[confirmState.newStatus] || ""}`}>
                {statusLabel(confirmState.newStatus, t)}
              </span>
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmState(null)}
                className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">
                {t("common.cancel")}
              </button>
              <button onClick={confirmUpdateStatus}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition ${
                  confirmState.newStatus === "cancelled" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}>
                {t("common.confirm", { defaultValue: "Confirm" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Reason Modal ── */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-text-main">{t("admin.cancelReason", { defaultValue: "Cancellation reason" })}</h3>
            <p className="mt-1 text-sm text-text-dim">{t("admin.cancelReasonDesc", { defaultValue: "Provide a reason to notify the patient." })}</p>
            <textarea value={cancelReasonInput} onChange={(e) => setCancelReasonInput(e.target.value)}
              placeholder={t("admin.cancelReasonPlaceholder", { defaultValue: "e.g. Doctor unavailable, schedule conflict..." })}
              rows={3}
              className="mt-3 w-full resize-none rounded-xl border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-slate-800" />
            <div className="mt-4 flex gap-3">
              <button onClick={() => { setCancelModal(null); setCancelReasonInput(""); }}
                className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">
                {t("common.cancel")}
              </button>
              <button onClick={confirmCancelWithReason}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">
                {t("admin.confirmCancel", { defaultValue: "Confirm cancel" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsAdminPage;