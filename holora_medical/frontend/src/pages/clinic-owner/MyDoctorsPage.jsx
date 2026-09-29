import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, CheckCircle2, ChevronDown, Edit2, Filter,
  Plus, RefreshCw, Search, Stethoscope, Trash2, UserCheck, Users, X,
} from "lucide-react";
import { getDoctorsByOwnerBranchesApi, deleteDoctorApi } from "../../services/doctorService";

/* ── Constants ─────────────────────────────── */
const PAGE_SIZE = 15;

const STATUS_CLS = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

/* ── Skeleton ──────────────────────────────── */
const SW = [75, 55, 40, 90, 60, 70, 50, 85];
const SkeletonRow = ({ i }) => (
  <tr className="animate-pulse">
    {Array.from({ length: 5 }).map((_, c) => (
      <td key={c} className="px-4 py-3.5">
        <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[(i + c) % SW.length]}%` }} />
      </td>
    ))}
  </tr>
);
const SkeletonCard = ({ i }) => (
  <div className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[i % SW.length]}%` }} />
        <div className="h-3 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  </div>
);

/* ── Main Component ──────────────────────── */
const MyDoctorsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  /* ── Fetch ── */
  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getDoctorsByOwnerBranchesApi();
      setDoctors(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.errorLoadingDoctors", { defaultValue: "Failed to load doctors" }));
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      setError("");
      await deleteDoctorApi(id);
      setSuccess(t("admin.doctorDeletedSuccess", { defaultValue: "Doctor deleted successfully" }));
      setShowDeleteConfirm(null);
      fetchDoctors();
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.errorDeletingDoctor", { defaultValue: "Failed to delete doctor" }));
      setShowDeleteConfirm(null);
    }
  };

  /* ── Derived data ── */
  const filtered = useMemo(() => {
    let list = doctors;
    if (statusFilter) list = list.filter((d) => d.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.full_name?.toLowerCase().includes(q) ||
        d.specialty_name?.toLowerCase().includes(q) ||
        d.branch_names?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.doctor_code?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [doctors, statusFilter, search]);

  const stats = useMemo(() => {
    const active = doctors.filter((d) => d.status === "active").length;
    const specialties = new Set(doctors.map((d) => d.specialty_name).filter(Boolean));
    return { total: doctors.length, active, specialties: specialties.size };
  }, [doctors]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= safePage - 1 && i <= safePage + 1)) pageNumbers.push(i);
    else if (pageNumbers[pageNumbers.length - 1] !== "...") pageNumbers.push("...");
  }

  const hasFilter = !!statusFilter;
  const handleSearchSubmit = (e) => { e.preventDefault(); setSearch(searchInput.trim()); };

  return (
    <div className="space-y-6">

      {/* ── Hero ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-cyan-400" />
              <h1 className="text-xl sm:text-2xl font-bold">{t("clinicOwner.myDoctors", { defaultValue: "My Doctors" })}</h1>
            </div>
            <p className="mt-1 text-sm text-slate-300">{t("clinicOwner.myDoctorsSubtitle", { defaultValue: "Doctors across all your branches" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchDoctors} disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/10 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh", { defaultValue: "Refresh" })}
            </button>
            <button onClick={() => navigate("/clinic-owner/doctors/new")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-600">
              <Plus className="h-4 w-4" />{t("admin.addNewDoctor", { defaultValue: "Add Doctor" })}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            { label: t("clinicOwner.totalDoctors", { defaultValue: "Total" }), value: stats.total, icon: Users },
            { label: t("admin.statusActive", { defaultValue: "Active" }), value: stats.active, icon: UserCheck },
            { label: t("admin.specialties", { defaultValue: "Specialties" }), value: stats.specialties, icon: Stethoscope },
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
              placeholder={t("admin.searchDoctors", { defaultValue: "Search name, specialty, branch..." })}
              className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-9 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-cyan-500/40 dark:bg-slate-900" />
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
                ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400"
                : "border-border-main text-text-main hover:bg-bg-app"
            }`}>
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{t("admin.filters", { defaultValue: "Filters" })}</span>
            {hasFilter && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">1</span>}
            <ChevronDown className={`h-3 w-3 transition ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px]">
                <label className="mb-1 block text-xs font-medium text-text-dim">{t("common.status", { defaultValue: "Status" })}</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-cyan-500/30 dark:bg-slate-900">
                  <option value="">{t("admin.allStatuses", { defaultValue: "All statuses" })}</option>
                  <option value="active">{t("admin.statusActive", { defaultValue: "Active" })}</option>
                  <option value="inactive">{t("admin.statusInactive", { defaultValue: "Inactive" })}</option>
                </select>
              </div>
              {hasFilter && (
                <button onClick={() => setStatusFilter("")}
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
                  t("admin.specialty", { defaultValue: "Specialty" }),
                  t("branch.managementTitle", { defaultValue: "Branches" }),
                  t("common.status", { defaultValue: "Status" }),
                  t("common.actions", { defaultValue: "Actions" }),
                ].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.07em] text-text-dim">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} i={i} />)
              ) : paged.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-sm text-text-dim">
                  {search || hasFilter
                    ? t("admin.noDoctorsFound", { defaultValue: "No doctors match your search" })
                    : t("clinicOwner.noDoctors", { defaultValue: "No doctors yet" })}
                </td></tr>
              ) : paged.map((d) => (
                <tr key={d.id} className="group hover:bg-bg-app dark:hover:bg-slate-900/40 transition">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-text-main">{d.full_name}</p>
                    {d.email && <p className="text-xs text-text-dim">{d.email}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {d.specialty_name ? (
                      <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300">
                        {d.specialty_name}
                      </span>
                    ) : <span className="text-text-dim">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {d.branch_names ? (
                      <span className="inline-flex max-w-[180px] truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-text-dim dark:bg-slate-700">
                        {d.branch_names}
                      </span>
                    ) : <span className="text-text-dim">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[d.status] || STATUS_CLS.inactive}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => navigate(`/clinic-owner/doctors/${d.id}/edit`)}
                        className="rounded-lg p-1.5 text-text-dim transition hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-400"
                        title={t("common.edit", { defaultValue: "Edit" })}>
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(d.id)}
                        className="rounded-lg p-1.5 text-text-dim transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title={t("common.delete", { defaultValue: "Delete" })}>
                        <Trash2 className="h-4 w-4" />
                      </button>
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
          <div className="rounded-2xl border border-border-main bg-bg-surface p-12 text-center dark:bg-slate-800">
            <p className="text-4xl mb-3">👨‍⚕️</p>
            <p className="text-sm text-text-dim">
              {search || hasFilter
                ? t("admin.noDoctorsFound", { defaultValue: "No doctors match your search" })
                : t("clinicOwner.noDoctors", { defaultValue: "No doctors yet" })}
            </p>
            {!search && !hasFilter && (
              <button onClick={() => navigate("/clinic-owner/doctors/new")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-cyan-600">
                <Plus className="h-4 w-4" />{t("admin.addNewDoctor", { defaultValue: "Add Doctor" })}
              </button>
            )}
          </div>
        ) : paged.map((d) => (
          <div key={d.id} className="rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-main">{d.full_name}</p>
                {d.email && <p className="mt-0.5 text-xs text-text-dim">{d.email}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[d.status] || STATUS_CLS.inactive}`}>
                {d.status}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {d.specialty_name && (
                <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300">
                  {d.specialty_name}
                </span>
              )}
              {d.branch_names && (
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-text-dim dark:bg-slate-700">
                  {d.branch_names}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-end gap-1 border-t border-border-main pt-3">
              <button onClick={() => navigate(`/clinic-owner/doctors/${d.id}/edit`)}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-cyan-600 transition hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20">
                <Edit2 className="h-3.5 w-3.5" />{t("common.edit", { defaultValue: "Edit" })}
              </button>
              <button onClick={() => setShowDeleteConfirm(d.id)}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="h-3.5 w-3.5" />{t("common.delete", { defaultValue: "Delete" })}
              </button>
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
                    ? "bg-cyan-500 text-white shadow shadow-cyan-500/25"
                    : "text-text-dim hover:bg-bg-app dark:hover:bg-slate-800"
                }`}>
                {n}
              </button>
            )
          )}
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(null); }}>
          <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-text-main">{t("admin.confirmDeleteDoctor", { defaultValue: "Delete Doctor?" })}</h3>
                <p className="text-xs text-text-dim">{t("admin.confirmDeleteDoctorText", { defaultValue: "This action cannot be undone." })}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-border-main px-4 py-2.5 text-sm font-medium text-text-main transition hover:bg-bg-app">
                {t("common.cancel", { defaultValue: "Cancel" })}
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-red-600">
                {t("common.delete", { defaultValue: "Delete" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDoctorsPage;
