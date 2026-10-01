import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, CheckCircle2, ChevronDown, Filter, Heart,
  RefreshCw, Search, Users, X,
} from "lucide-react";
import { getPatientsByOwnerBranchesApi } from "../../services/patientService";

/* ── Constants ─────────────────────────────── */
const PAGE_SIZE = 15;

const STATUS_CLS = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const genderLabel = (gender, t) => {
  if (gender === "male") return t("admin.genderMale", { defaultValue: "Male" });
  if (gender === "female") return t("admin.genderFemale", { defaultValue: "Female" });
  if (gender === "other") return t("admin.genderOther", { defaultValue: "Other" });
  return "—";
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
const MyPatientsPage = () => {
  const { t } = useTranslation();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search & filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  /* ── Fetch ── */
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getPatientsByOwnerBranchesApi();
      setPatients(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t("clinicOwner.errorLoadingPatients", { defaultValue: "Failed to load patients" }));
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  useEffect(() => { setPage(1); }, [search, statusFilter, genderFilter]);

  /* ── Derived data ── */
  const filtered = useMemo(() => {
    let list = patients;
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (genderFilter) list = list.filter((p) => p.gender === genderFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.patient_code?.toLowerCase().includes(q) ||
        p.branch_names?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [patients, statusFilter, genderFilter, search]);

  const stats = useMemo(() => {
    const active = patients.filter((p) => p.status === "active").length;
    const male = patients.filter((p) => p.gender === "male").length;
    const female = patients.filter((p) => p.gender === "female").length;
    return { total: patients.length, active, male, female };
  }, [patients]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= safePage - 1 && i <= safePage + 1)) pageNumbers.push(i);
    else if (pageNumbers[pageNumbers.length - 1] !== "...") pageNumbers.push("...");
  }

  const hasFilter = statusFilter || genderFilter;
  const clearFilters = () => { setStatusFilter(""); setGenderFilter(""); };
  const handleSearchSubmit = (e) => { e.preventDefault(); setSearch(searchInput.trim()); };

  return (
    <div className="space-y-6">

      {/* ── Hero ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-rose-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-rose-400" />
              <h1 className="text-xl sm:text-2xl font-bold">{t("clinicOwner.myPatients", { defaultValue: "My Patients" })}</h1>
            </div>
            <p className="mt-1 text-sm text-slate-300">{t("clinicOwner.myPatientsSubtitle", { defaultValue: "Patients registered across all your branches" })}</p>
          </div>
          <button onClick={fetchPatients} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/10 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh", { defaultValue: "Refresh" })}
          </button>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("clinicOwner.totalPatients", { defaultValue: "Total" }), value: stats.total, icon: Users },
            { label: t("admin.statusActive", { defaultValue: "Active" }), value: stats.active, icon: CheckCircle2 },
            { label: t("admin.genderMale", { defaultValue: "Male" }), value: stats.male, icon: Heart },
            { label: t("admin.genderFemale", { defaultValue: "Female" }), value: stats.female, icon: Heart },
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
              placeholder={t("clinicOwner.searchPatients", { defaultValue: "Search name, phone, email, code, branch..." })}
              className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-9 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-rose-500/40 dark:bg-slate-900" />
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
                ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                : "border-border-main text-text-main hover:bg-bg-app"
            }`}>
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">{t("admin.filters", { defaultValue: "Filters" })}</span>
            {hasFilter && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{[statusFilter, genderFilter].filter(Boolean).length}</span>}
            <ChevronDown className={`h-3 w-3 transition ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px]">
                <label className="mb-1 block text-xs font-medium text-text-dim">{t("common.status", { defaultValue: "Status" })}</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:bg-slate-900">
                  <option value="">{t("admin.allStatuses", { defaultValue: "All statuses" })}</option>
                  <option value="active">{t("admin.statusActive", { defaultValue: "Active" })}</option>
                  <option value="inactive">{t("admin.statusInactive", { defaultValue: "Inactive" })}</option>
                </select>
              </div>
              <div className="min-w-[140px]">
                <label className="mb-1 block text-xs font-medium text-text-dim">{t("admin.gender", { defaultValue: "Gender" })}</label>
                <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full rounded-lg border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:bg-slate-900">
                  <option value="">{t("admin.allGenders", { defaultValue: "All genders" })}</option>
                  <option value="male">{t("admin.genderMale", { defaultValue: "Male" })}</option>
                  <option value="female">{t("admin.genderFemale", { defaultValue: "Female" })}</option>
                  <option value="other">{t("admin.genderOther", { defaultValue: "Other" })}</option>
                </select>
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
                  t("admin.patientCode", { defaultValue: "Code" }),
                  t("admin.fullName", { defaultValue: "Patient" }),
                  t("admin.phone", { defaultValue: "Phone" }),
                  t("admin.gender", { defaultValue: "Gender" }),
                  t("branch.managementTitle", { defaultValue: "Branches" }),
                  t("common.status", { defaultValue: "Status" }),
                ].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.07em] text-text-dim">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} i={i} />)
              ) : paged.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-text-dim">
                  {search || hasFilter
                    ? t("admin.noPatientsFound", { defaultValue: "No patients match your search" })
                    : t("clinicOwner.noPatients", { defaultValue: "No patients yet" })}
                </td></tr>
              ) : paged.map((p) => (
                <tr key={p.id} className="group hover:bg-bg-app dark:hover:bg-slate-900/40 transition">
                  <td className="px-4 py-3 text-xs font-mono text-text-dim">{p.patient_code}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-text-main">{p.full_name}</p>
                    {p.email && <p className="text-xs text-text-dim">{p.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-dim">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-sm text-text-dim">{genderLabel(p.gender, t)}</td>
                  <td className="px-4 py-3">
                    {p.branch_names ? (
                      <span className="inline-flex max-w-[180px] truncate rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                        {p.branch_names}
                      </span>
                    ) : <span className="text-text-dim">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[p.status] || STATUS_CLS.inactive}`}>
                      {p.status}
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
          <div className="rounded-2xl border border-border-main bg-bg-surface p-12 text-center dark:bg-slate-800">
            <p className="text-4xl mb-3">🧑‍⚕️</p>
            <p className="text-sm text-text-dim">
              {search || hasFilter
                ? t("admin.noPatientsFound", { defaultValue: "No patients match your search" })
                : t("clinicOwner.noPatients", { defaultValue: "No patients yet" })}
            </p>
          </div>
        ) : paged.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-main">{p.full_name}</p>
                <p className="mt-0.5 text-xs text-text-dim font-mono">{p.patient_code}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[p.status] || STATUS_CLS.inactive}`}>
                {p.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-bg-app p-3 dark:bg-slate-900">
              <div>
                <p className="text-xs text-text-dim">{t("admin.phone", { defaultValue: "Phone" })}</p>
                <p className="mt-0.5 text-sm font-medium text-text-main">{p.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-text-dim">{t("admin.gender", { defaultValue: "Gender" })}</p>
                <p className="mt-0.5 text-sm font-medium text-text-main">{genderLabel(p.gender, t)}</p>
              </div>
            </div>

            {(p.email || p.branch_names) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.email && (
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs text-text-dim dark:bg-slate-700">
                    {p.email}
                  </span>
                )}
                {p.branch_names && (
                  <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                    {p.branch_names}
                  </span>
                )}
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
                    ? "bg-rose-500 text-white shadow shadow-rose-500/25"
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

export default MyPatientsPage;
