import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, Calendar, CalendarCheck, CheckCircle2, ChevronDown,
  Clock, Filter, RefreshCw, Search, X,
} from "lucide-react";
import { scheduleService } from "../../services/appointmentService";

/* ── Constants ─────────────────────────────── */
const PAGE_SIZE = 15;

const STATUS_CLS = {
  active:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fmtTime = (v) => (v ? `${v}`.slice(0, 5) : "—");

const calcSlots = (start, end, duration) => {
  const [sh, sm] = fmtTime(start).split(":").map(Number);
  const [eh, em] = fmtTime(end).split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, Math.floor(mins / (duration || 30)));
};

/* ── Skeleton ─────────────────────────────── */
const SW = [75, 55, 40, 90, 60, 70, 50, 85];
const SkeletonRow = ({ i }) => (
  <tr className="animate-pulse">
    {Array.from({ length: 7 }).map((_, c) => (
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
const SchedulesAdminPage = () => {
  const { t } = useTranslation();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  /* ── Fetch ── */
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await scheduleService.getDoctorSchedules(null, startDate, endDate);
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.errorFetchingSchedules", { defaultValue: "Failed to load schedules" }));
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  useEffect(() => { setPage(1); }, [search, statusFilter, startDate, endDate]);

  /* ── Derived data ── */
  const filtered = useMemo(() => {
    let list = schedules;

    if (statusFilter) {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.doctor_name?.toLowerCase().includes(q) ||
        s.doctor_code?.toLowerCase().includes(q) ||
        s.branch_names?.toLowerCase().includes(q) ||
        s.specialty_name?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [schedules, statusFilter, search]);

  const stats = useMemo(() => {
    const active = schedules.filter((s) => s.status === "active").length;
    const doctorSet = new Set(schedules.map((s) => s.doctor_id));
    const totalSlots = schedules.reduce((sum, s) => sum + calcSlots(s.start_time, s.end_time, s.slot_duration), 0);
    return { total: schedules.length, active, doctors: doctorSet.size, slots: totalSlots };
  }, [schedules]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= safePage - 1 && i <= safePage + 1)) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== "...") {
      pageNumbers.push("...");
    }
  }

  const hasFilter = statusFilter || startDate || endDate;
  const clearFilters = () => { setStatusFilter(""); setStartDate(""); setEndDate(""); };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">

      {/* ── Hero ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-orange-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-orange-400" />
              <h1 className="text-xl sm:text-2xl font-bold">{t("admin.schedulesManagement", { defaultValue: "Doctor Schedules" })}</h1>
            </div>
            <p className="mt-1 text-sm text-slate-300">{t("admin.schedulesDesc", { defaultValue: "View work schedules registered by doctors across all branches" })}</p>
          </div>
          <button onClick={fetchSchedules} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/10 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh")}
          </button>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("admin.totalSchedules", { defaultValue: "Total shifts" }), value: stats.total, icon: Calendar },
            { label: t("admin.statusActive"), value: stats.active, icon: CheckCircle2 },
            { label: t("admin.doctors", { defaultValue: "Doctors" }), value: stats.doctors, icon: CalendarCheck },
            { label: t("admin.totalSlots", { defaultValue: "Total slots" }), value: stats.slots, icon: Clock },
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
              placeholder={t("admin.searchSchedules", { defaultValue: "Search doctor, specialty, branch..." })}
              className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-9 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-orange-500/40 dark:bg-slate-900" />
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
                ? "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                : "border-border-main text-text-main hover:bg-bg-app"
            }`}>
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{t("admin.filters", { defaultValue: "Filters" })}</span>
            {hasFilter && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">{[statusFilter, startDate, endDate].filter(Boolean).length}</span>}
            <ChevronDown className={`h-3 w-3 transition ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px]">
                <label className="mb-1 block text-xs font-medium text-text-dim">{t("admin.status")}</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:bg-slate-900">
                  <option value="">{t("admin.allStatuses", { defaultValue: "All statuses" })}</option>
                  <option value="active">{t("admin.statusActive")}</option>
                  <option value="inactive">{t("admin.statusInactive", { defaultValue: "Inactive" })}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-dim">{t("admin.fromDate", { defaultValue: "From" })}</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:bg-slate-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-dim">{t("admin.toDate", { defaultValue: "To" })}</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:bg-slate-900" />
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
                  t("admin.doctor", { defaultValue: "Doctor" }),
                  t("admin.branch", { defaultValue: "Branch" }),
                  t("admin.workDate", { defaultValue: "Work date" }),
                  t("admin.timeRange", { defaultValue: "Time range" }),
                  t("admin.slotDuration", { defaultValue: "Slot" }),
                  t("admin.slots", { defaultValue: "Slots" }),
                  t("admin.status"),
                ].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.07em] text-text-dim">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} i={i} />)
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-text-dim">{t("admin.noSchedulesFound", { defaultValue: "No schedules found" })}</td></tr>
              ) : paged.map((s) => (
                <tr key={s.id} className="group hover:bg-bg-app dark:hover:bg-slate-900/40 transition">
                  {/* Doctor */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-text-main">{s.doctor_name || `Doctor #${s.doctor_id}`}</p>
                    {s.specialty_name && <p className="text-xs text-text-dim">{s.specialty_name}</p>}
                  </td>
                  {/* Branch */}
                  <td className="px-4 py-3 text-sm">
                    {s.branch_names ? (
                      <span className="inline-flex max-w-[180px] truncate rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                        {s.branch_names}
                      </span>
                    ) : <span className="text-text-dim">—</span>}
                  </td>
                  {/* Work date */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-main">{fmtDate(s.work_date)}</p>
                  </td>
                  {/* Time range */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-text-main">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</p>
                  </td>
                  {/* Slot duration */}
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                      {s.slot_duration}m
                    </span>
                  </td>
                  {/* Slots count */}
                  <td className="px-4 py-3 text-sm font-medium text-text-main">
                    {calcSlots(s.start_time, s.end_time, s.slot_duration)}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[s.status] || STATUS_CLS.inactive}`}>
                      {s.status}
                    </span>
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
          <p className="py-12 text-center text-sm text-text-dim">{t("admin.noSchedulesFound", { defaultValue: "No schedules found" })}</p>
        ) : paged.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-main">{s.doctor_name || `Doctor #${s.doctor_id}`}</p>
                {s.specialty_name && <p className="text-xs text-text-dim">{s.specialty_name}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[s.status] || STATUS_CLS.inactive}`}>
                {s.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {s.branch_names && (
                <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                  {s.branch_names}
                </span>
              )}
              <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                {s.slot_duration}m slots
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-bg-app p-3 text-center dark:bg-slate-900">
              <div>
                <p className="text-xs text-text-dim">{t("admin.date", { defaultValue: "Date" })}</p>
                <p className="mt-0.5 text-sm font-semibold text-text-main">{fmtDate(s.work_date)}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">{t("admin.time", { defaultValue: "Time" })}</p>
                <p className="mt-0.5 text-sm font-semibold text-text-main">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">{t("admin.slots", { defaultValue: "Slots" })}</p>
                <p className="mt-0.5 text-sm font-bold text-orange-600 dark:text-orange-400">{calcSlots(s.start_time, s.end_time, s.slot_duration)}</p>
              </div>
            </div>
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
                    ? "bg-orange-500 text-white shadow shadow-orange-500/25"
                    : "text-text-dim hover:bg-bg-app dark:hover:bg-slate-800"
                }`}>
                {n}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SchedulesAdminPage;
