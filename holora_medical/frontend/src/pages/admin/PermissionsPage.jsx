import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, CheckCircle2, Filter, Key, Pencil,
  Plus, RefreshCw, Search, Shield, Trash2, X,
} from "lucide-react";
import * as permissionService from "../../services/permissionService";

/* ── Module color map ─────────────────────────────── */
const MODULE_COLORS = {
  user:         { bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-300",    dot: "bg-blue-500" },
  rbac:         { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500" },
  patient:      { bg: "bg-teal-100 dark:bg-teal-900/30",    text: "text-teal-700 dark:text-teal-300",    dot: "bg-teal-500" },
  doctor:       { bg: "bg-cyan-100 dark:bg-cyan-900/30",    text: "text-cyan-700 dark:text-cyan-300",    dot: "bg-cyan-500" },
  branch:       { bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-300",  dot: "bg-amber-500" },
  appointment:  { bg: "bg-rose-100 dark:bg-rose-900/30",    text: "text-rose-700 dark:text-rose-300",    dot: "bg-rose-500" },
  consultation: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", dot: "bg-indigo-500" },
  schedule:     { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  specialty:    { bg: "bg-lime-100 dark:bg-lime-900/30",    text: "text-lime-700 dark:text-lime-300",    dot: "bg-lime-500" },
  ai:           { bg: "bg-fuchsia-100 dark:bg-fuchsia-900/30", text: "text-fuchsia-700 dark:text-fuchsia-300", dot: "bg-fuchsia-500" },
  subscription: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  dashboard:    { bg: "bg-sky-100 dark:bg-sky-900/30",      text: "text-sky-700 dark:text-sky-300",      dot: "bg-sky-500" },
  default:      { bg: "bg-slate-100 dark:bg-slate-700",     text: "text-slate-600 dark:text-slate-300",  dot: "bg-slate-400" },
};

const getModuleColor = (mod) => MODULE_COLORS[mod] || MODULE_COLORS.default;

const ModuleBadge = ({ module_name }) => {
  const c = getModuleColor(module_name);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {module_name || "other"}
    </span>
  );
};

const StatusBadge = ({ status, t }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
    status === "active"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
  }`}>
    {status === "active" ? t("admin.statusActive") : t("admin.statusInactive")}
  </span>
);

/* ── Skeleton ─────────────────────────────────────── */
const SKELETON_WIDTHS = [75, 55, 40, 90, 60, 70, 50, 85];
const SkeletonRow = ({ i }) => (
  <tr className="animate-pulse">
    {[0, 1, 2, 3, 4, 5].map((c) => (
      <td key={c} className="px-4 py-3.5">
        <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SKELETON_WIDTHS[(i + c) % SKELETON_WIDTHS.length]}%` }} />
      </td>
    ))}
  </tr>
);

const SkeletonCard = ({ i }) => (
  <div className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%` }} />
      </div>
    </div>
  </div>
);

/* ── PAGE_SIZE ────────────────────────────────────── */
const PAGE_SIZE = 15;

const PermissionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => { fetchPermissions(); fetchModules(); }, []);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  const fetchPermissions = async () => {
    try {
      setLoading(true); setError("");
      const res = await permissionService.getAllPermissionsApi();
      setPermissions(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch permissions");
    } finally { setLoading(false); }
  };

  const fetchModules = async () => {
    try { const res = await permissionService.getModulesApi(); setModules(res.data || []); }
    catch (err) { console.error("Error fetching modules:", err); }
  };

  const handleDeletePermission = async (id) => {
    try {
      setError("");
      await permissionService.deletePermissionApi(id);
      setSuccess(t("admin.deletePermissionSuccess"));
      setShowDeleteConfirm(null);
      fetchPermissions();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete permission";
      setError(msg.includes("assigned") ? t("admin.cannotDeletePermissionWithRoles") : msg);
      setShowDeleteConfirm(null);
    }
  };

  /* ── Filter + Paginate ──────────────────────────── */
  const filteredPermissions = permissions.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
    const matchesModule = !selectedModule || p.module_name === selectedModule;
    return matchesSearch && matchesModule;
  });
  const totalPages = Math.max(1, Math.ceil(filteredPermissions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPermissions = filteredPermissions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [searchTerm, selectedModule]);

  /* ── Stats ──────────────────────────────────────── */
  const totalCount = permissions.length;
  const activeCount = permissions.filter((p) => p.status === "active").length;
  const moduleCount = [...new Set(permissions.filter((p) => p.module_name).map((p) => p.module_name))].length;

  const deleteTarget = showDeleteConfirm ? permissions.find((p) => p.id === showDeleteConfirm) : null;

  return (
    <div className="space-y-5">
      {/* ── Hero Header ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Key className="h-6 w-6 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-bold">{t("admin.permissionsManagement")}</h1>
            </div>
            <p className="text-sm text-slate-300">{t("admin.managePermissions")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchPermissions} disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh")}
            </button>
            <button onClick={() => navigate("/admin/permissions/new")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">{t("admin.addNewPermission")}</span><span className="sm:hidden">{t("common.add")}</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            { label: t("admin.totalPermissions"), value: totalCount, color: "text-white" },
            { label: t("admin.statusActive"), value: activeCount, color: "text-emerald-400" },
            { label: t("admin.allModules"), value: moduleCount, color: "text-amber-400" },
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

      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
          <input type="text" placeholder={t("admin.search")} value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-4 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-amber-500/40 dark:bg-slate-900" />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
          <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full sm:w-auto appearance-none rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-8 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-amber-500/40 dark:bg-slate-900">
            <option value="">{t("admin.allModules")}</option>
            {modules.map((m) => <option key={m} value={m}>{m || t("common.other")}</option>)}
          </select>
        </div>
      </div>

      {/* ── Desktop Table ───────────────────────────── */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
                {[t("admin.name"), t("admin.code"), t("admin.module"), t("admin.description"), t("admin.status"), ""].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim ${i === 5 ? "w-24" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} i={i} />)
              ) : pagedPermissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Key className="mx-auto h-10 w-10 text-text-dim/30" />
                    <p className="mt-2 text-sm text-text-dim">{t("admin.noPermissions")}</p>
                  </td>
                </tr>
              ) : pagedPermissions.map((p) => (
                <tr key={p.id} className="group transition hover:bg-bg-app dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-sm font-semibold text-text-main">{p.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <code className="rounded-lg bg-bg-app px-2 py-1 text-xs font-mono text-text-dim dark:bg-slate-900">{p.code}</code>
                  </td>
                  <td className="px-4 py-3 text-sm"><ModuleBadge module_name={p.module_name} /></td>
                  <td className="px-4 py-3 text-sm text-text-dim max-w-xs truncate">{p.description || "—"}</td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={p.status} t={t} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => navigate(`/admin/permissions/${p.id}/edit`)}
                        className="rounded-lg p-1.5 text-text-dim transition hover:bg-bg-app hover:text-amber-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(p.id)}
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
        ) : pagedPermissions.length === 0 ? (
          <div className="rounded-2xl border border-border-main bg-bg-surface py-12 text-center dark:bg-slate-800">
            <Key className="mx-auto h-10 w-10 text-text-dim/30" />
            <p className="mt-2 text-sm text-text-dim">{t("admin.noPermissions")}</p>
          </div>
        ) : pagedPermissions.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getModuleColor(p.module_name).bg}`}>
                <Key className={`h-5 w-5 ${getModuleColor(p.module_name).text}`} />
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-text-main truncate">{p.name}</h3>
                    <code className="text-xs font-mono text-text-dim">{p.code}</code>
                  </div>
                  <StatusBadge status={p.status} t={t} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ModuleBadge module_name={p.module_name} />
                </div>

                {p.description && (
                  <p className="mt-2 text-xs text-text-dim line-clamp-2">{p.description}</p>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 border-t border-border-main pt-3">
                  <button onClick={() => navigate(`/admin/permissions/${p.id}/edit`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-main px-3 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app">
                    <Pencil className="h-3 w-3" />{t("common.edit")}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(p.id)}
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
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredPermissions.length)} / {filteredPermissions.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage === 1}
              className="rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-40">
              «
            </button>
            <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1}
              className="rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-40">
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dot-${i}`} className="px-1 text-text-dim">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      p === safePage ? "bg-amber-500 text-white" : "border border-border-main text-text-main hover:bg-bg-app"
                    }`}>
                    {p}
                  </button>
                )
              )}
            <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages}
              className="rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-40">
              ›
            </button>
            <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
              className="rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-40">
              »
            </button>
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
            <h3 className="text-base font-bold text-text-main">{t("admin.confirmDeletePermission")}</h3>
            <p className="mt-1 text-sm text-text-dim">
              <span className="font-semibold text-text-main">{deleteTarget.name}</span>{" "}
              <code className="rounded bg-bg-app px-1.5 py-0.5 text-xs dark:bg-slate-800">{deleteTarget.code}</code>
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">
                {t("common.cancel")}
              </button>
              <button onClick={() => handleDeletePermission(deleteTarget.id)}
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

export default PermissionsPage;
