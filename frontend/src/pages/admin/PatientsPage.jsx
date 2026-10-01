import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, CheckCircle2, Heart, Pencil, Plus, RefreshCw,
  Search, Trash2, UserRound, Users, X,
} from "lucide-react";
import {
  getAllPatientsApi,
  deletePatientApi,
} from "../../services/patientService";

/* ── Constants ─────────────────────────────────── */
const PAGE_SIZE = 12;

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const GENDER_STYLES = {
  male: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  female: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  other: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

/* ── Skeleton helpers ─────────────────────────── */
const SW = [75, 55, 40, 90, 60, 70, 50, 85];
const SkeletonRow = ({ i }) => (
  <tr className="animate-pulse">
    {Array.from({ length: 8 }).map((_, c) => (
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

const StatusBadge = ({ status, t }) => {
  const label = status === "active" ? t("admin.statusActive")
    : status === "inactive" ? t("admin.statusInactive")
    : status;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
      {label}
    </span>
  );
};

const GenderBadge = ({ gender, t }) => {
  if (!gender) return <span className="text-text-dim">—</span>;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${GENDER_STYLES[gender] || "bg-slate-100 text-slate-600 dark:bg-slate-700"}`}>
      {t(`admin.gender${gender.charAt(0).toUpperCase()}${gender.slice(1)}`)}
    </span>
  );
};

/* ── Main Component ───────────────────────────── */
const PatientsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // patient id or null

  /* ── Fetch ─── */
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllPatientsApi();
      setPatients(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  /* ── Derived ─── */
  const filteredPatients = useMemo(() => {
    const s = searchTerm.toLowerCase();
    if (!s) return patients;
    return patients.filter((p) =>
      p.full_name?.toLowerCase().includes(s) ||
      p.email?.toLowerCase().includes(s) ||
      p.phone?.includes(s) ||
      p.patient_code?.toLowerCase().includes(s) ||
      p.branch_names?.toLowerCase().includes(s)
    );
  }, [patients, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filteredPatients.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const active = patients.filter((p) => p.status === "active").length;
    const branchSet = new Set();
    patients.forEach((p) => (p.branches || []).forEach((b) => branchSet.add(b.id)));
    return { total: patients.length, active, branches: branchSet.size };
  }, [patients]);

  useEffect(() => { setPage(1); }, [searchTerm]);

  /* ── Delete ─── */
  const deleteTarget = patients.find((p) => p.id === showDeleteConfirm);
  const handleConfirmDelete = async () => {
    try {
      await deletePatientApi(showDeleteConfirm);
      setPatients((prev) => prev.filter((p) => p.id !== showDeleteConfirm));
      setSuccess(t("admin.patientDeletedSuccess", { defaultValue: "Patient deleted successfully" }));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete patient");
      setShowDeleteConfirm(null);
    }
  };

  /* ── Pagination helpers ── */
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= safePage - 1 && i <= safePage + 1)) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== "...") {
      pageNumbers.push("...");
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Hero ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-rose-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-rose-400" />
              <h1 className="text-xl sm:text-2xl font-bold">{t("admin.patientsManagement")}</h1>
            </div>
            <p className="mt-1 text-sm text-slate-300">{t("admin.managePatientsAndRecords")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchPatients} disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/10 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh")}
            </button>
            <button onClick={() => navigate("/admin/patients/new")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold shadow-lg shadow-rose-500/25 transition hover:bg-rose-600">
              <Plus className="h-4 w-4" />{t("admin.addNewPatient")}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            { label: t("admin.totalPatients", { defaultValue: "Total" }), value: stats.total, icon: Users },
            { label: t("admin.statusActive"), value: stats.active, icon: Heart },
            { label: t("admin.branches"), value: stats.branches, icon: UserRound },
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

      {/* ── Alerts ─── */}
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

      {/* ── Search ─── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
        <input type="text" placeholder={t("admin.searchByName")} value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-9 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-rose-500/40 dark:bg-slate-900" />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Desktop Table ──────────────────────── */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
                {[t("admin.patient"), t("admin.phone"), t("admin.branches"), t("admin.gender"), t("admin.bloodGroup"), t("admin.status"), t("common.actions")]
                  .map((h, i) => (
                    <th key={i} className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.07em] text-text-dim ${i >= 6 ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} i={i} />)
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-text-dim">{t("admin.noPatientsFound")}</td>
                </tr>
              ) : paged.map((patient) => (
                <tr key={patient.id} className="group hover:bg-bg-app dark:hover:bg-slate-900/40">
                  {/* Patient name + code + email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-main">{patient.full_name}</p>
                        <p className="truncate text-xs text-text-dim">{patient.patient_code}{patient.email ? ` · ${patient.email}` : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-dim">{patient.phone || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    {patient.branch_names ? (
                      <span className="inline-flex max-w-[180px] truncate rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                        {patient.branch_names}
                      </span>
                    ) : <span className="text-text-dim">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm"><GenderBadge gender={patient.gender} t={t} /></td>
                  <td className="px-4 py-3 text-sm">
                    {patient.blood_group ? (
                      <span className="inline-flex rounded-full border border-border-main bg-bg-app px-2.5 py-1 text-xs font-semibold text-text-main dark:bg-slate-900">{patient.blood_group}</span>
                    ) : <span className="text-text-dim">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={patient.status} t={t} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => navigate(`/admin/patients/${patient.id}/edit`)}
                        className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-rose-300 hover:text-rose-600 dark:hover:bg-slate-700">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(patient.id)}
                        className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-red-300 hover:text-red-600 dark:hover:bg-slate-700">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Cards ──────────────────────── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} i={i} />)
        ) : paged.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-dim">{t("admin.noPatientsFound")}</p>
        ) : paged.map((patient) => (
          <div key={patient.id} className="rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text-main">{patient.full_name}</p>
                    <p className="text-xs text-text-dim">{patient.patient_code}</p>
                  </div>
                  <StatusBadge status={patient.status} t={t} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {patient.branch_names && (
                    <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                      {patient.branch_names}
                    </span>
                  )}
                  <GenderBadge gender={patient.gender} t={t} />
                  {patient.blood_group && (
                    <span className="inline-flex rounded-full border border-border-main bg-bg-app px-2.5 py-1 text-xs font-semibold text-text-main dark:bg-slate-900">
                      {patient.blood_group}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs text-text-dim">
                  {patient.phone && <p>📞 {patient.phone}</p>}
                  {patient.email && <p>✉️ {patient.email}</p>}
                </div>

                <div className="mt-3 flex gap-2">
                  <button onClick={() => navigate(`/admin/patients/${patient.id}/edit`)}
                    className="flex-1 rounded-lg border border-border-main py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app">
                    {t("common.edit")}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(patient.id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-900/20">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ─── */}
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

      {/* ── Delete Modal ─── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 sm:pb-0 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-text-main">{t("admin.confirmDelete")}</h3>
            {deleteTarget && (
              <p className="mt-2 text-sm text-text-dim">
                {t("admin.deletePatientConfirmation")}
                <span className="mt-1 block font-semibold text-text-main">
                  {deleteTarget.full_name} ({deleteTarget.patient_code})
                </span>
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">
                {t("common.cancel")}
              </button>
              <button onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;