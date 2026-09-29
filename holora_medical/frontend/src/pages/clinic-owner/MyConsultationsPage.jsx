import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, CheckCircle2, ChevronDown, Clock, Filter,
  MessageSquare, RefreshCw, Search, Send, Stethoscope, X,
  Image as ImageIcon, User, FileText, Building2,
} from "lucide-react";
import { resolveApiUrl } from "../../services/api";
import { consultationService } from "../../services/consultationService";
import branchService from "../../services/branchService";
import { getDoctorsByOwnerBranchesApi } from "../../services/doctorService";

/* ── Constants ─────────────────────────────── */
const PAGE_SIZE = 15;

const STATUS_MAP = {
  pending:     { label: "Pending",     cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  in_progress: { label: "In progress", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  completed:   { label: "Completed",   cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

const PRIORITY_MAP = {
  high:   { label: "High",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  normal: { label: "Normal", cls: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
};

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

/* ── Skeleton ──────────────────────────────── */
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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="h-4 w-2/5 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-3 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[i % SW.length]}%` }} />
    </div>
  </div>
);

/* ── Main Component ──────────────────────── */
const MyConsultationsPage = () => {
  const { t } = useTranslation();

  const [consultations, setConsultations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  // Detail modal
  const [selectedId, setSelectedId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailTab, setDetailTab] = useState("info");

  // Response form
  const [replyText, setReplyText] = useState("");
  const [markComplete, setMarkComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const chatEndRef = useRef(null);

  /* ── Load branches & doctors for filters ── */
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [branchRes, doctorRes] = await Promise.all([
          branchService.getMyBranches(),
          getDoctorsByOwnerBranchesApi(),
        ]);
        setBranches(Array.isArray(branchRes?.data) ? branchRes.data : []);
        setDoctors(Array.isArray(doctorRes) ? doctorRes : []);
      } catch {
        // silent
      }
    };
    loadFilters();
  }, []);

  /* ── Fetch List ── */
  const fetchConsultations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await consultationService.getOwnerConsultations({
        status: statusFilter, priority: priorityFilter,
        start_date: startDate, end_date: endDate,
        search, branch_id: branchFilter, doctor_id: doctorFilter,
      });
      setConsultations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || t("owner.errorFetchingConsultations", { defaultValue: "Failed to load consultations" }));
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, startDate, endDate, search, branchFilter, doctorFilter, t]);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  useEffect(() => { setPage(1); }, [statusFilter, priorityFilter, startDate, endDate, search, branchFilter, doctorFilter]);

  /* ── Detail ── */
  const handleOpenDetail = async (id) => {
    setSelectedId(id);
    setDetailData(null);
    setDetailError("");
    setLoadingDetail(true);
    setDetailTab("info");
    setReplyText("");
    setMarkComplete(false);
    try {
      const res = await consultationService.getConsultationDetails(id);
      setDetailData(res.data);
    } catch {
      setDetailError(t("owner.errorLoadingDetail", { defaultValue: "Could not load consultation details" }));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
    setDetailData(null);
    setDetailError("");
    setReplyText("");
    setMarkComplete(false);
  };

  useEffect(() => {
    if (detailTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [detailData?.responses?.length, detailTab]);

  /* ── Submit Response ── */
  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      setSubmitting(true);
      await consultationService.addResponse(selectedId, {
        content: replyText,
        complete: markComplete,
      });
      setReplyText("");
      setSuccess(t("owner.responseSent", { defaultValue: "Response sent successfully" }));
      if (markComplete) {
        handleCloseDetail();
        fetchConsultations();
      } else {
        const res = await consultationService.getConsultationDetails(selectedId);
        setDetailData(res.data);
      }
    } catch {
      setError(t("owner.errorSendingResponse", { defaultValue: "Failed to send response" }));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Reopen ── */
  const handleReopen = async () => {
    if (!selectedId) return;
    try {
      setSubmitting(true);
      await consultationService.reopenConsultation(selectedId);
      const res = await consultationService.getConsultationDetails(selectedId);
      setDetailData(res.data);
      setSuccess(t("owner.consultationReopened", { defaultValue: "Consultation reopened" }));
      fetchConsultations();
    } catch {
      setError(t("owner.errorReopening", { defaultValue: "Failed to reopen consultation" }));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Stats ── */
  const stats = useMemo(() => {
    const pending = consultations.filter((c) => c.status === "pending").length;
    const inProgress = consultations.filter((c) => c.status === "in_progress").length;
    const completed = consultations.filter((c) => c.status === "completed").length;
    return { total: consultations.length, pending, inProgress, completed };
  }, [consultations]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(consultations.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = consultations.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= safePage - 1 && i <= safePage + 1)) pageNumbers.push(i);
    else if (pageNumbers[pageNumbers.length - 1] !== "...") pageNumbers.push("...");
  }

  const hasFilter = statusFilter || priorityFilter || branchFilter || doctorFilter || startDate || endDate;
  const filterCount = [statusFilter, priorityFilter, branchFilter, doctorFilter, startDate, endDate].filter(Boolean).length;
  const clearFilters = () => {
    setStatusFilter(""); setPriorityFilter(""); setBranchFilter(""); setDoctorFilter(""); setStartDate(""); setEndDate("");
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); setSearch(searchInput.trim()); };

  const statusBadge = (status) => {
    const m = STATUS_MAP[status] || STATUS_MAP.pending;
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>{m.label}</span>;
  };
  const priorityBadge = (priority) => {
    const m = PRIORITY_MAP[priority] || PRIORITY_MAP.normal;
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>{m.label}</span>;
  };

  return (
    <div className="space-y-6">

      {/* ── Hero ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-emerald-400" />
              <h1 className="text-xl sm:text-2xl font-bold">
                {t("owner.consultationsManagement", { defaultValue: "Consultations" })}
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              {t("owner.consultationsDesc", { defaultValue: "Monitor all patient consultations across your branches" })}
            </p>
          </div>
          <button onClick={fetchConsultations} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/10 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh", { defaultValue: "Refresh" })}
          </button>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("owner.totalConsultations", { defaultValue: "Total" }), value: stats.total, icon: FileText },
            { label: t("owner.pending", { defaultValue: "Pending" }), value: stats.pending, icon: Clock },
            { label: t("owner.inProgress", { defaultValue: "In progress" }), value: stats.inProgress, icon: MessageSquare },
            { label: t("owner.completed", { defaultValue: "Completed" }), value: stats.completed, icon: CheckCircle2 },
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
          <button onClick={() => setError("")} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── Search + Filters ── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("owner.searchConsultations", { defaultValue: "Search patient, doctor, complaint..." })}
              className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-9 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-emerald-500/40 dark:bg-slate-900" />
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
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "border-border-main text-text-main hover:bg-bg-app"
            }`}>
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{t("owner.filters", { defaultValue: "Filters" })}</span>
            {hasFilter && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {filterCount}
              </span>
            )}
            <ChevronDown className={`h-3 w-3 transition ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Branch */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-text-dim">
                  <Building2 className="h-3 w-3" />
                  {t("owner.branch", { defaultValue: "Branch" })}
                </label>
                <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-slate-900">
                  <option value="">{t("owner.allBranches", { defaultValue: "All branches" })}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              {/* Doctor */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-text-dim">
                  <Stethoscope className="h-3 w-3" />
                  {t("owner.doctor", { defaultValue: "Doctor" })}
                </label>
                <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-slate-900">
                  <option value="">{t("owner.allDoctors", { defaultValue: "All doctors" })}</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>
              </div>
              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-dim">
                  {t("owner.status", { defaultValue: "Status" })}
                </label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-slate-900">
                  <option value="">{t("owner.allStatuses", { defaultValue: "All statuses" })}</option>
                  <option value="pending">{t("owner.statusPending", { defaultValue: "Pending" })}</option>
                  <option value="in_progress">{t("owner.statusInProgress", { defaultValue: "In progress" })}</option>
                  <option value="completed">{t("owner.statusCompleted", { defaultValue: "Completed" })}</option>
                </select>
              </div>
              {/* Priority */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-dim">
                  {t("owner.priority", { defaultValue: "Priority" })}
                </label>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-slate-900">
                  <option value="">{t("owner.allPriorities", { defaultValue: "All priorities" })}</option>
                  <option value="high">{t("owner.priorityHigh", { defaultValue: "High" })}</option>
                  <option value="normal">{t("owner.priorityNormal", { defaultValue: "Normal" })}</option>
                </select>
              </div>
              {/* From date */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-dim">
                  {t("owner.fromDate", { defaultValue: "From date" })}
                </label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-slate-900" />
              </div>
              {/* To date */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-dim">
                  {t("owner.toDate", { defaultValue: "To date" })}
                </label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-slate-900" />
              </div>
            </div>
            {hasFilter && (
              <div className="mt-3">
                <button onClick={clearFilters}
                  className="rounded-lg border border-border-main px-3 py-2 text-xs font-medium text-text-dim transition hover:bg-bg-app">
                  {t("owner.clearFilters", { defaultValue: "Clear filters" })}
                </button>
              </div>
            )}
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
                  t("owner.patient", { defaultValue: "Patient" }),
                  t("owner.doctorLabel", { defaultValue: "Doctor" }),
                  t("owner.branchLabel", { defaultValue: "Branch" }),
                  t("owner.chiefComplaint", { defaultValue: "Chief complaint" }),
                  t("owner.createdAt", { defaultValue: "Created" }),
                  t("owner.priority", { defaultValue: "Priority" }),
                  t("owner.statusLabel", { defaultValue: "Status" }),
                ].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.07em] text-text-dim">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} i={i} />)
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-text-dim">{t("owner.noConsultationsFound", { defaultValue: "No consultations found" })}</td></tr>
              ) : paged.map((c) => (
                <tr key={c.id} onClick={() => handleOpenDetail(c.id)}
                  className="group cursor-pointer hover:bg-bg-app dark:hover:bg-slate-900/40 transition">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-text-main">{c.patient_name}</p>
                    <p className="text-xs text-text-dim">{c.gender} • {fmtDate(c.date_of_birth)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {c.doctor_name ? (
                      <>
                        <p className="text-sm text-text-main">{c.doctor_name}</p>
                        {c.doctor_code && <p className="text-xs text-text-dim">{c.doctor_code}</p>}
                      </>
                    ) : (
                      <span className="text-xs italic text-text-dim">{t("owner.unassigned", { defaultValue: "Unassigned" })}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.branch_names ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        {c.branch_names}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[240px] truncate text-sm text-text-main" title={c.chief_complaint}>{c.chief_complaint}</p>
                    {c.response_count > 0 && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-text-dim">
                        <MessageSquare className="h-3 w-3" />{c.response_count}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-dim">{fmtDateTime(c.created_at)}</td>
                  <td className="px-4 py-3">{priorityBadge(c.priority)}</td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
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
          <p className="py-12 text-center text-sm text-text-dim">{t("owner.noConsultationsFound", { defaultValue: "No consultations found" })}</p>
        ) : paged.map((c) => (
          <div key={c.id} onClick={() => handleOpenDetail(c.id)}
            className="cursor-pointer rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm transition active:scale-[0.99] dark:bg-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-main">{c.patient_name}</p>
                <p className="mt-0.5 text-xs text-text-dim">{c.gender} • {fmtDate(c.date_of_birth)}</p>
              </div>
              {statusBadge(c.status)}
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-text-dim">{c.chief_complaint}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {priorityBadge(c.priority)}
              {c.doctor_name ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <User className="h-3 w-3" />{c.doctor_name}
                </span>
              ) : (
                <span className="text-xs italic text-text-dim">{t("owner.unassigned", { defaultValue: "Unassigned" })}</span>
              )}
              {c.branch_names && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                  <Building2 className="h-3 w-3" />{c.branch_names}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-text-dim">
              {c.response_count > 0 && (
                <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{c.response_count}</span>
              )}
              <span>{fmtDate(c.created_at)}</span>
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
                    ? "bg-emerald-500 text-white shadow shadow-emerald-500/25"
                    : "text-text-dim hover:bg-bg-app dark:hover:bg-slate-800"
                }`}>
                {n}
              </button>
            )
          )}
        </div>
      )}

      {/* ── Detail Modal ──────────────────── */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseDetail(); }}>
          <div className="flex h-[95vh] sm:h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border-main bg-bg-surface shadow-2xl dark:bg-slate-800">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-main bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                <h3 className="font-bold">{t("owner.consultationDetail", { defaultValue: "Consultation Detail" })}</h3>
              </div>
              <button onClick={handleCloseDetail} className="rounded-lg p-1 transition hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="flex border-b border-border-main md:hidden">
              {[
                { key: "info", label: t("owner.information", { defaultValue: "Info" }), icon: FileText },
                { key: "chat", label: t("owner.chatHistory", { defaultValue: "Chat" }), icon: MessageSquare },
              ].map(({ key, label, icon: TabIcon }) => (
                <button key={key} onClick={() => setDetailTab(key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition ${
                    detailTab === key
                      ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "text-text-dim"
                  }`}>
                  <TabIcon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>

            {loadingDetail ? (
              <div className="flex flex-1 items-center justify-center text-text-dim">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />{t("common.loading", { defaultValue: "Loading..." })}
              </div>
            ) : detailError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">{detailError}</p>
                <button onClick={handleCloseDetail} className="rounded-lg border border-border-main px-4 py-2 text-sm text-text-main hover:bg-bg-app transition">
                  {t("common.close", { defaultValue: "Close" })}
                </button>
              </div>
            ) : detailData ? (
              <div className="flex flex-1 flex-col overflow-hidden md:flex-row">

                {/* LEFT: Patient Info Panel */}
                <div className={`w-full overflow-y-auto border-r border-border-main bg-bg-app p-4 sm:p-5 dark:bg-slate-900/40 md:w-[340px] md:block ${detailTab !== "info" ? "hidden" : ""}`}>

                  {/* Patient Card */}
                  <div className="rounded-xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main">{detailData.patient_name}</p>
                        <p className="text-xs text-text-dim">{detailData.gender} • {fmtDate(detailData.date_of_birth)}</p>
                      </div>
                    </div>
                    {detailData.doctor_name && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-900/20">
                        <Stethoscope className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">{detailData.doctor_name}</span>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      {statusBadge(detailData.status)}
                      {priorityBadge(detailData.priority)}
                    </div>
                  </div>

                  {/* Chief Complaint */}
                  <div className="mt-3 rounded-xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                      {t("owner.chiefComplaint", { defaultValue: "Chief complaint" })}
                    </p>
                    <p className="mt-1 text-sm text-text-main">{detailData.chief_complaint}</p>
                    {detailData.symptoms && (
                      <>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-text-dim">
                          {t("owner.symptoms", { defaultValue: "Symptoms" })}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-text-main">{detailData.symptoms}</p>
                      </>
                    )}
                  </div>

                  {/* Medical History */}
                  {(detailData.medical_history || detailData.allergies) && (
                    <div className="mt-3 rounded-xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
                      {detailData.medical_history && (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                            {t("owner.medicalHistory", { defaultValue: "Medical history" })}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-text-main">{detailData.medical_history}</p>
                        </>
                      )}
                      {detailData.allergies && (
                        <>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-text-dim">
                            {t("owner.allergies", { defaultValue: "Allergies" })}
                          </p>
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{detailData.allergies}</p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Attached Images */}
                  <div className="mt-3 rounded-xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
                    <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {t("owner.attachedImages", { defaultValue: "Attached images" })} ({detailData.images?.length || 0})
                    </p>
                    {detailData.images?.length > 0 ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {detailData.images.map((img, idx) => (
                          <a key={idx} href={resolveApiUrl(img.image_url)} target="_blank" rel="noreferrer"
                            className="block overflow-hidden rounded-lg border border-border-main hover:opacity-80 transition">
                            <img src={resolveApiUrl(img.image_url)} alt={`symptom-${idx + 1}`}
                              className="h-24 w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs italic text-text-dim">{t("owner.noImages", { defaultValue: "No images attached" })}</p>
                    )}
                  </div>
                </div>

                {/* RIGHT: Chat Panel */}
                <div className={`flex flex-1 flex-col md:flex ${detailTab !== "chat" ? "hidden md:flex" : ""}`}>

                  {/* Desktop Header */}
                  <div className="hidden items-center justify-between border-b border-border-main px-6 py-3 md:flex">
                    <h4 className="text-sm font-bold text-text-main">{t("owner.chatHistory", { defaultValue: "Chat & Responses" })}</h4>
                    <span className="text-xs text-text-dim">{detailData.responses?.length || 0} {t("owner.messages", { defaultValue: "messages" })}</span>
                  </div>

                  {/* Messages */}
                  <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-bg-app p-4 dark:bg-slate-900/30">
                    {!detailData.responses?.length ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-text-dim">
                        <MessageSquare className="h-8 w-8 opacity-30" />
                        <p className="text-sm">{t("owner.noResponses", { defaultValue: "No responses yet" })}</p>
                      </div>
                    ) : (
                      detailData.responses.map((msg) => {
                        const isPatient = msg.responder_role === "patient";
                        const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
                        const messageText = typeof msg.content === "string" ? msg.content.trim() : "";
                        return (
                          <div key={msg.id} className={`flex w-full ${isPatient ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm ${
                              isPatient
                                ? "rounded-tl-none border border-border-main bg-bg-surface dark:bg-slate-800"
                                : "rounded-tr-none bg-emerald-600 text-white"
                            }`}>
                              <div className={`text-[11px] font-semibold mb-1 ${isPatient ? "text-text-dim" : "text-emerald-100"}`}>
                                {msg.responder_name} • {fmtDateTime(msg.created_at)}
                              </div>
                              {messageText && <div className="whitespace-pre-wrap text-sm leading-relaxed">{messageText}</div>}
                              {attachments.length > 0 && (
                                <div className={`mt-2 grid gap-2 ${attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                                  {attachments.map((attachment) => (
                                    <a key={attachment.id} href={resolveApiUrl(attachment.image_url)} target="_blank" rel="noreferrer"
                                      className="group overflow-hidden rounded-xl border border-white/20 bg-black/10">
                                      <img src={resolveApiUrl(attachment.image_url)} alt={attachment.file_name || "attachment"}
                                        className="h-44 w-full object-cover transition duration-200 group-hover:scale-[1.02]" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Response Form */}
                  {detailData.status !== "completed" ? (
                    <form onSubmit={handleSubmitResponse} className="border-t border-border-main bg-bg-surface p-3 sm:p-4 dark:bg-slate-800">
                      <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t("owner.typeResponse", { defaultValue: "Type your response..." })}
                        className="w-full resize-none rounded-xl border border-border-main bg-bg-app p-3 text-sm text-text-main placeholder:text-text-dim focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 dark:bg-slate-900"
                        rows="3" required />
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <label className="flex items-center cursor-pointer select-none">
                          <input type="checkbox" checked={markComplete} onChange={(e) => setMarkComplete(e.target.checked)}
                            className="mr-2 h-4 w-4 cursor-pointer rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                          <span className="text-xs sm:text-sm font-medium text-text-dim">
                            {t("owner.markComplete", { defaultValue: "Mark as completed" })}
                          </span>
                        </label>
                        <button type="submit" disabled={submitting || !replyText.trim()}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50">
                          <Send className="h-4 w-4" />
                          {submitting
                            ? t("common.sending", { defaultValue: "Sending..." })
                            : markComplete
                              ? t("owner.sendAndClose", { defaultValue: "Send & Close" })
                              : t("owner.send", { defaultValue: "Send" })}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between border-t border-border-main bg-bg-app px-4 py-3 dark:bg-slate-900/30">
                      <p className="text-sm font-medium italic text-text-dim">
                        <CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-500" />
                        {t("owner.consultationCompleted", { defaultValue: "This consultation has been completed" })}
                      </p>
                      <button onClick={handleReopen} disabled={submitting}
                        className="rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-dim transition hover:bg-bg-surface disabled:opacity-50">
                        {t("owner.reopen", { defaultValue: "Reopen" })}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center p-10">
                <p className="text-sm text-red-600 dark:text-red-400">{t("owner.unexpectedError", { defaultValue: "An unexpected error occurred" })}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyConsultationsPage;
