import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, CheckCircle2, ChevronRight, GripVertical,
  Heart, Pencil, Plus, RefreshCw, Search, Stethoscope,
  Trash2, Users, X,
} from "lucide-react";
import specialtyService from "../../services/specialtyService";

/* ── Skeleton helpers ─────────────────────────────── */
const SW = [75, 55, 40, 90, 60, 70, 50, 85];
const SkeletonRow = ({ i }) => (
  <tr className="animate-pulse">
    {[0, 1, 2, 3, 4, 5, 6].map((c) => (
      <td key={c} className="px-4 py-3.5">
        <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[(i + c) % SW.length]}%` }} />
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
        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[i % SW.length]}%` }} />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status, t }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
    status === "active"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
  }`}>
    {status === "active" ? t("common.active") : t("common.inactive")}
  </span>
);

const SpecialtiesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState([]);
  const [specialtyTree, setSpecialtyTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteSuggestion, setDeleteSuggestion] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [isDropping, setIsDropping] = useState(false);

  /* ── Auto-clear success ─────────────────────────── */
  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  const fetchSpecialties = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await specialtyService.getAllSpecialties();
      setSpecialties(res.data || []);
      setSpecialtyTree(res.tree || []);
    } catch (err) {
      setError(err.response?.data?.message || t("specialty.fetchError"));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchSpecialties(); }, [fetchSpecialties]);

  const handleEditSpecialty = (specialty) => navigate(`/admin/specialties/${specialty.id}/edit`);

  const handleDeleteSpecialty = async (id, doctorCount) => {
    try {
      setError(""); setSuccess("");
      const response = await specialtyService.deleteSpecialty(id);
      if (response) {
        setSuccess(t("specialty.deleteSuccess"));
        setShowDeleteConfirm(null); setDeleteSuggestion(null); setReassignTargetId("");
        fetchSpecialties();
      }
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.code === "SPECIALTY_HAS_DOCTORS") {
        const suggestions = responseData?.data?.suggested_leaf_specialties || [];
        setDeleteSuggestion({ doctorCount: responseData?.data?.doctor_count || doctorCount || 0, suggestions });
        setReassignTargetId(suggestions[0]?.id || "");
      } else {
        setError(responseData?.message || t("specialty.deleteError"));
        setDeleteSuggestion(null); setReassignTargetId("");
      }
    }
  };

  const handleReassignAndDelete = async () => {
    if (!showDeleteConfirm || !reassignTargetId) { setError("Please select a target specialty to transfer doctors"); return; }
    try {
      setError(""); setSuccess("");
      await specialtyService.reassignAndDeleteSpecialty(showDeleteConfirm, reassignTargetId);
      setSuccess("Doctors were transferred and specialty deleted successfully");
      setShowDeleteConfirm(null); setDeleteSuggestion(null); setReassignTargetId("");
      fetchSpecialties();
    } catch (err) { setError(err.response?.data?.message || t("specialty.deleteError")); }
  };

  /* ── Tree helpers ───────────────────────────────── */
  const filteredSpecialties = specialties.filter((s) => {
    const q = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.parent_name || "").toLowerCase().includes(q);
  });
  const filteredIdSet = new Set(filteredSpecialties.map((item) => item.id));

  const flattenTreeRows = (nodes, depth = 0) => {
    let result = [];
    nodes.forEach((node) => {
      if (filteredIdSet.has(node.id)) result.push({ ...node, depth });
      if (node.children?.length) result = result.concat(flattenTreeRows(node.children, depth + 1));
    });
    return result;
  };
  const treeRows = flattenTreeRows(specialtyTree);

  const findNodeById = (nodes, targetId) => {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.children?.length) { const f = findNodeById(node.children, targetId); if (f) return f; }
    }
    return null;
  };
  const collectDescendantIds = (node, output = new Set()) => {
    if (!node?.children?.length) return output;
    node.children.forEach((c) => { output.add(c.id); collectDescendantIds(c, output); });
    return output;
  };

  const moveSpecialty = async (specialtyId, newParentId) => {
    if (!specialtyId) return;
    try {
      setIsDropping(true); setError(""); setSuccess("");
      await specialtyService.updateSpecialtyParent(specialtyId, newParentId);
      setSuccess("Hierarchy updated successfully");
      await fetchSpecialties();
    } catch (err) { setError(err.response?.data?.message || t("specialty.updateError")); }
    finally { setIsDropping(false); setDraggingId(null); setDropTargetId(null); }
  };

  const handleDropOnSpecialty = async (targetId) => {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDropTargetId(null); return; }
    const draggingNode = findNodeById(specialtyTree, draggingId);
    if (collectDescendantIds(draggingNode).has(targetId)) { setError("Cannot move a parent under its own child"); setDraggingId(null); setDropTargetId(null); return; }
    await moveSpecialty(draggingId, targetId);
  };
  const handleDropToRoot = async () => { if (draggingId) await moveSpecialty(draggingId, null); };

  /* ── Stats ──────────────────────────────────────── */
  const totalCount = specialties.length;
  const activeCount = specialties.filter((s) => s.status === "active").length;
  const totalDoctors = specialties.reduce((sum, s) => sum + (s.doctor_count || 0), 0);

  const deleteTarget = showDeleteConfirm ? specialties.find((s) => s.id === showDeleteConfirm) : null;

  return (
    <div className="space-y-5">
      {/* ── Hero Header ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-teal-400" />
              <h1 className="text-xl sm:text-2xl font-bold">{t("specialty.managementTitle")}</h1>
            </div>
            <p className="text-sm text-slate-300">{t("specialty.managementSubtitle") || t("specialty.managementTitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchSpecialties} disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20 disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh")}
            </button>
            <button onClick={() => navigate("/admin/specialties/new")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition hover:bg-teal-600">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">{t("specialty.addNew")}</span><span className="sm:hidden">{t("common.add")}</span>
            </button>
          </div>
        </div>
        {/* Stats */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            { label: t("specialty.totalSpecialties") || t("specialty.managementTitle"), value: totalCount, color: "text-white" },
            { label: t("common.active"), value: activeCount, color: "text-emerald-400" },
            { label: t("specialty.doctorCount"), value: totalDoctors, color: "text-teal-400" },
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
        <input type="text" placeholder={t("common.search")} value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-9 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-teal-500/40 dark:bg-slate-900" />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Root Drop Zone (desktop only, drag-and-drop) ── */}
      <div onDragOver={(e) => e.preventDefault()} onDrop={handleDropToRoot}
        className={`hidden md:block rounded-xl border-2 border-dashed px-4 py-3 text-sm transition ${
          draggingId ? "border-teal-500/50 bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" : "border-border-main bg-bg-app text-text-dim dark:bg-slate-800/40"
        }`}>
        {t("specialty.dropToRoot") || "Drop here to move specialty to root level"}
      </div>

      {/* ── Desktop Table ───────────────────────────── */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
                {[t("specialty.name"), "Parent", t("specialty.code"), t("specialty.description"), t("specialty.doctorCount"), t("specialty.status"), ""].map((h, i) => (
                  <th key={i} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim ${i === 6 ? "w-24" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} i={i} />)
              ) : treeRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Stethoscope className="mx-auto h-10 w-10 text-text-dim/30" />
                    <p className="mt-2 text-sm text-text-dim">{t("specialty.noSpecialties")}</p>
                  </td>
                </tr>
              ) : treeRows.map((specialty) => (
                <tr key={specialty.id} draggable={!isDropping}
                  onDragStart={() => setDraggingId(specialty.id)}
                  onDragEnd={() => { setDraggingId(null); setDropTargetId(null); }}
                  onDragOver={(e) => { e.preventDefault(); setDropTargetId(specialty.id); }}
                  onDrop={(e) => { e.preventDefault(); handleDropOnSpecialty(specialty.id); }}
                  className={`group transition ${
                    dropTargetId === specialty.id ? "bg-teal-50 dark:bg-teal-500/10" : "hover:bg-bg-app dark:hover:bg-slate-900/40"
                  } ${draggingId === specialty.id ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 text-sm font-semibold text-text-main">
                    <div style={{ paddingLeft: `${specialty.depth * 20}px` }} className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-text-dim opacity-40 group-hover:opacity-100" />
                      {specialty.depth > 0
                        ? <span className="text-text-dim">└</span>
                        : <span className="text-text-dim">•</span>}
                      <span>{specialty.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-dim">{specialty.parent_name || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <code className="rounded-lg bg-bg-app px-2 py-1 text-xs font-mono text-text-dim dark:bg-slate-900">{specialty.code}</code>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-sm text-text-dim">{specialty.description || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <Users className="h-3 w-3" />{specialty.doctor_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={specialty.status} t={t} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => handleEditSpecialty(specialty)}
                        className="rounded-lg p-1.5 text-text-dim transition hover:bg-bg-app hover:text-teal-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(specialty.id)}
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
        ) : treeRows.length === 0 ? (
          <div className="rounded-2xl border border-border-main bg-bg-surface py-12 text-center dark:bg-slate-800">
            <Stethoscope className="mx-auto h-10 w-10 text-text-dim/30" />
            <p className="mt-2 text-sm text-text-dim">{t("specialty.noSpecialties")}</p>
          </div>
        ) : treeRows.map((specialty) => (
          <div key={specialty.id}
            className="rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800"
            style={{ marginLeft: `${specialty.depth * 12}px` }}>
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30">
                {specialty.depth > 0
                  ? <ChevronRight className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  : <Stethoscope className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-text-main truncate">{specialty.name}</h3>
                    <code className="text-xs font-mono text-text-dim">{specialty.code}</code>
                  </div>
                  <StatusBadge status={specialty.status} t={t} />
                </div>

                {/* Meta row */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {specialty.parent_name && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-text-dim dark:bg-slate-700">
                      {specialty.parent_name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <Users className="h-3 w-3" />{specialty.doctor_count || 0}
                  </span>
                </div>

                {specialty.description && (
                  <p className="mt-2 text-xs text-text-dim line-clamp-2">{specialty.description}</p>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 border-t border-border-main pt-3">
                  <button onClick={() => handleEditSpecialty(specialty)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-main px-3 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app">
                    <Pencil className="h-3 w-3" />{t("common.edit")}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(specialty.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-main px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10">
                    <Trash2 className="h-3 w-3" />{t("common.delete")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Delete Confirm Modal ────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-base font-bold text-text-main">{t("specialty.confirmDelete")}</h3>
            <p className="mt-1 text-sm text-text-dim">
              <span className="font-semibold text-text-main">{deleteTarget.name}</span>{" "}
              <code className="rounded bg-bg-app px-1.5 py-0.5 text-xs dark:bg-slate-800">{deleteTarget.code}</code>
            </p>

            {deleteSuggestion && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-400">
                <p className="font-semibold">This specialty has {deleteSuggestion.doctorCount} doctor(s).</p>
                <p className="mt-1">Please move doctors to another leaf specialty before deleting.</p>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide">Suggested target leaf specialty</label>
                <select value={reassignTargetId} onChange={(e) => setReassignTargetId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border-main bg-bg-app px-3 py-2 text-sm text-text-main dark:bg-slate-800">
                  {deleteSuggestion.suggestions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.parent_name ? `${item.parent_name} > ${item.name}` : item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(null); setDeleteSuggestion(null); setReassignTargetId(""); }}
                className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">
                {t("common.cancel")}
              </button>
              <button onClick={() => {
                  if (deleteSuggestion) { handleReassignAndDelete(); return; }
                  handleDeleteSpecialty(showDeleteConfirm, deleteTarget.doctor_count);
                }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">
                {deleteSuggestion ? "Transfer & Delete" : t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialtiesPage;
