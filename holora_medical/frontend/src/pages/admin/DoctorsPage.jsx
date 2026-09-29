import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, CheckCircle2, Pencil, Plus, RefreshCw,
  Search, Stethoscope, Trash2, UserRound, Users, X,
} from "lucide-react";
import {
  getAllDoctorsApi,
  deleteDoctorApi,
} from "../../services/doctorService";

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  on_leave: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
};

/* ── Skeleton helpers ─────────────────────────────── */
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
    : status === "on_leave" ? "On leave"
    : status;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
      {label}
    </span>
  );
};

const PAGE_SIZE = 12;

const DoctorsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [page, setPage] = useState(1);

  const fetchDoctors = async () => {
    try {
      setLoading(true); setError("");
      const res = await getAllDoctorsApi();
      setDoctors((res.data || []).filter((d) => d.status !== "deleted"));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch doctors");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      setError("");
      await deleteDoctorApi(showDeleteConfirm);
      setDoctors((prev) => prev.filter((d) => d.id !== showDeleteConfirm));
      setSuccess(t("admin.deleteDoctorSuccess") || "Doctor deleted successfully");
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete doctor");
      setShowDeleteConfirm(null);
    }
  };

  /* ── Filter + Paginate ──────────────────────────── */
  const filteredDoctors = doctors.filter((d) => {
    const q = searchTerm.toLowerCase();
    return d.full_name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q) || d.phone?.includes(q) || d.doctor_code?.toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedDoctors = filteredDoctors.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchTerm]);

  /* ── Stats ──────────────────────────────────────── */
  const totalCount = doctors.length;
  const activeCount = doctors.filter((d) => d.status === "active").length;
  const specialtyCount = [...new Set(doctors.filter((d) => d.specialty_name).map((d) => d.specialty_name))].length;

  const deleteTarget = showDeleteConfirm ? doctors.find((d) => d.id === showDeleteConfirm) : null;

  return (
    <div className="space-y-5">
      {/* ── Hero Header ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-cyan-400" />
              <h1 className="text-xl sm:text-2xl font-bold">{t("admin.doctorsManagement")}</h1>
            </div>
            <p className="text-sm text-slate-300">{t("admin.manageDoctorAndProfiles")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchDoctors} disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh")}
            </button>
            <button onClick={() => navigate("/admin/doctors/new")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-600">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">{t("admin.addNewDoctor")}</span><span className="sm:hidden">{t("common.add")}</span>
            </button>
          </div>
        </div>
        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            { label: t("admin.totalDoctors") || "Total", value: totalCount, color: "text-white" },
            { label: t("admin.statusActive"), value: activeCount, color: "text-emerald-400" },
            { label: t("admin.specialty") || "Specialties", value: specialtyCount, color: "text-cyan-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 px-3 py-2.5 text-center backdrop-blur">
              <p className={`text-lg sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Messages ────────────────────────────────── */}
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

      {/* ── Search ──────────────────────────────────── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
        <input type="text" placeholder={t("admin.searchByName")} value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-9 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-cyan-500/40 dark:bg-slate-900" />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Desktop Table ───────────────────────────── */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
                {[t("admin.doctorCode"), t("admin.fullName"), t("admin.specialty"), t("admin.branches"), t("admin.phone"), t("admin.qualifications"), t("admin.consultationFee"), t("admin.status"), ""].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim ${i === 8 ? "w-24" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} i={i} />)
              ) : pagedDoctors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <UserRound className="mx-auto h-10 w-10 text-text-dim/30" />
                    <p className="mt-2 text-sm text-text-dim">{t("admin.noDoctorsFound")}</p>
                  </td>
                </tr>
              ) : pagedDoctors.map((doctor) => (
                <tr key={doctor.id} className="group transition hover:bg-bg-app dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-sm">
                    <code className="rounded-lg bg-bg-app px-2 py-1 text-xs font-mono text-text-dim dark:bg-slate-900">{doctor.doctor_code}</code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                        <UserRound className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-main truncate">{doctor.full_name}</p>
                        <p className="text-xs text-text-dim truncate">{doctor.email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {doctor.specialty_name ? (
                      <span className="inline-flex rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                        {doctor.specialty_name}
                      </span>
                    ) : <span className="text-text-dim">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-dim max-w-[160px] truncate">{doctor.branch_names || "—"}</td>
                  <td className="px-4 py-3 text-sm text-text-dim">{doctor.phone || "—"}</td>
                  <td className="px-4 py-3 text-sm text-text-dim">{doctor.qualification || "—"}</td>
                  <td className="px-4 py-3 text-sm text-text-main">
                    {doctor.consultation_fee ? `$${doctor.consultation_fee}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={doctor.status} t={t} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => navigate(`/admin/doctors/${doctor.id}/edit`)}
                        className="rounded-lg p-1.5 text-text-dim transition hover:bg-bg-app hover:text-cyan-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(doctor.id)}
                        className="rounded-lg p-1.5 text-text-dim transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
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

      {/* ── Mobile Cards ────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} i={i} />)
        ) : pagedDoctors.length === 0 ? (
          <div className="rounded-2xl border border-border-main bg-bg-surface py-12 text-center dark:bg-slate-800">
            <UserRound className="mx-auto h-10 w-10 text-text-dim/30" />
            <p className="mt-2 text-sm text-text-dim">{t("admin.noDoctorsFound")}</p>
          </div>
        ) : pagedDoctors.map((doctor) => (
          <div key={doctor.id} className="rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
                <UserRound className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-text-main truncate">{doctor.full_name}</h3>
                    <code className="text-xs font-mono text-text-dim">{doctor.doctor_code}</code>
                  </div>
                  <StatusBadge status={doctor.status} t={t} />
                </div>

                {/* Meta */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {doctor.specialty_name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                      <Stethoscope className="h-3 w-3" />{doctor.specialty_name}
                    </span>
                  )}
                  {doctor.branch_names && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-text-dim dark:bg-slate-700">
                      {doctor.branch_names}
                    </span>
                  )}
                </div>

                {/* Detail row */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-dim">
                  {doctor.phone && <span>{doctor.phone}</span>}
                  {doctor.email && <span>{doctor.email}</span>}
                  {doctor.consultation_fee && <span className="font-medium text-text-main">${doctor.consultation_fee}</span>}
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 border-t border-border-main pt-3">
                  <button onClick={() => navigate(`/admin/doctors/${doctor.id}/edit`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-main px-3 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app">
                    <Pencil className="h-3 w-3" />{t("common.edit")}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(doctor.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-main px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10">
                    <Trash2 className="h-3 w-3" />{t("common.delete")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ──────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border-main bg-bg-surface px-4 py-3 dark:bg-slate-800">
          <p className="text-xs text-text-dim">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredDoctors.length)} / {filteredDoctors.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage === 1}
              className="rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-40">«</button>
            <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1}
              className="rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-40">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
              .map((p, i) => p === "..." ? (
                <span key={`dot-${i}`} className="px-1 text-text-dim">…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${p === safePage ? "bg-cyan-500 text-white" : "border border-border-main text-text-main hover:bg-bg-app"}`}>{p}</button>
              ))}
            <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages}
              className="rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-40">›</button>
            <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
              className="rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-40">»</button>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-base font-bold text-text-main">{t("admin.confirmDelete")}</h3>
            <p className="mt-1 text-sm text-text-dim">
              {t("admin.deleteDoctorConfirmation")}{" "}
              <span className="font-semibold text-text-main">{deleteTarget.full_name}</span>
              {deleteTarget.doctor_code && (
                <code className="ml-1 rounded bg-bg-app px-1.5 py-0.5 text-xs dark:bg-slate-800">{deleteTarget.doctor_code}</code>
              )}
            </p>
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

export default DoctorsPage;
