import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, CheckCircle2, Eye, Lock, Pencil,
  Plus, RefreshCw, Search, Shield, Trash2, Users,
} from "lucide-react";
import * as roleService from "../../services/roleService";
import RolePermissionsModal from "../../components/RolePermissionsModal";

const RolesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);

  useEffect(() => { fetchRoles(); }, []);

  // Auto-clear success
  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await roleService.getAllRolesApi();
      setRoles(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id, isSystemRole, userCount) => {
    if (isSystemRole) { setError(t("admin.cannotDeleteSystemRole")); setShowDeleteConfirm(null); return; }
    if (userCount > 0) { setError(t("admin.cannotDeleteRoleWithUsers")); setShowDeleteConfirm(null); return; }
    try {
      setError("");
      await roleService.deleteRoleApi(id);
      setSuccess(t("admin.deleteRoleSuccess"));
      setShowDeleteConfirm(null);
      fetchRoles();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete role";
      setError(msg.includes("cannot") ? t("admin.cannotDeleteRoleWithUsers") : msg);
      setShowDeleteConfirm(null);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openPermissions = (role) => {
    setSelectedRoleForPermissions(role);
    setShowPermissionsModal(true);
  };

  return (
    <div className="space-y-5 pb-10">

      {/* ── Hero Header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 px-5 py-6 text-white shadow-lg sm:px-6 sm:py-7">
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ background: "radial-gradient(circle at 80% 20%, #a855f7, transparent 60%)" }} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Quản trị hệ thống</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Quản lý vai trò</h1>
            <p className="mt-1 text-sm text-white/60">Phân quyền và quản lý vai trò trong hệ thống</p>
          </div>
          <div className="flex items-center gap-2 sm:self-start">
            <button
              onClick={fetchRoles}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{t("common.refresh")}</span>
            </button>
            <button
              onClick={() => navigate("/admin/roles/new")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E06666] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#D55555]"
            >
              <Plus className="h-4 w-4" />
              Thêm vai trò
            </button>
          </div>
        </div>
      </div>

      {/* ── Alerts ───────────────────────────────────────────────── */}
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
        <input
          type="text"
          placeholder="Tìm theo tên hoặc mã vai trò..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-10 pr-4 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900"
        />
      </div>

      {/* ── Desktop table ─────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800 md:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
              {["Tên vai trò", "Mã code", "Mô tả", "Người dùng", "Trạng thái", "Thao tác"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.07em] text-text-dim">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(6)].map((__, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" style={{ width: `${[70,50,80,30,50,60][j]}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredRoles.length === 0 ? (
              <tr><td colSpan={6} className="py-14 text-center">
                <Shield className="mx-auto mb-2 h-8 w-8 text-text-dim opacity-30" />
                <p className="text-sm text-text-dim">Không tìm thấy vai trò nào</p>
              </td></tr>
            ) : filteredRoles.map((role) => (
              <tr key={role.id} className="group transition hover:bg-bg-app dark:hover:bg-slate-900/40">
                <td className="px-4 py-3.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-main">{role.name}</span>
                    {role.is_system_role && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        Hệ thống
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <code className="rounded bg-bg-app px-2 py-1 text-xs font-mono text-text-dim dark:bg-slate-900">{role.code}</code>
                </td>
                <td className="px-4 py-3.5 text-sm text-text-dim max-w-xs truncate">{role.description || "—"}</td>
                <td className="px-4 py-3.5 text-sm">
                  <span className="inline-flex items-center gap-1 rounded-full border border-border-main bg-bg-app px-2.5 py-1 text-xs font-semibold text-text-main dark:bg-slate-900">
                    <Users className="h-3 w-3" />{role.user_count || 0}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    role.status === "active"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${role.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {role.status === "active" ? "Hoạt động" : "Không hoạt động"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => navigate(`/admin/roles/${role.id}`)}
                      title="Xem chi tiết"
                      className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                    ><Eye className="h-3.5 w-3.5" /></button>
                    <button
                      onClick={() => openPermissions(role)}
                      disabled={role.is_system_role}
                      title="Phân quyền"
                      className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 disabled:cursor-not-allowed disabled:opacity-40"
                    ><Lock className="h-3.5 w-3.5" /></button>
                    <button
                      onClick={() => navigate(`/admin/roles/${role.id}/edit`)}
                      disabled={role.is_system_role}
                      title="Chỉnh sửa"
                      className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-[#E06666]/50 hover:bg-[#E06666]/10 hover:text-[#E06666] disabled:cursor-not-allowed disabled:opacity-40"
                    ><Pencil className="h-3.5 w-3.5" /></button>
                    <button
                      onClick={() => setShowDeleteConfirm(role.id)}
                      disabled={role.is_system_role || (role.user_count || 0) > 0}
                      title="Xoá"
                      className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-40"
                    ><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ──────────────────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            </div>
          ))
        ) : filteredRoles.length === 0 ? (
          <div className="rounded-2xl border border-border-main bg-bg-surface py-14 text-center dark:bg-slate-800">
            <Shield className="mx-auto mb-2 h-8 w-8 text-text-dim opacity-30" />
            <p className="text-sm text-text-dim">Không tìm thấy vai trò nào</p>
          </div>
        ) : filteredRoles.map((role) => (
          <div key={role.id} className="rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
            {/* Card header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-text-main">{role.name}</span>
                  {role.is_system_role && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      Hệ thống
                    </span>
                  )}
                </div>
                <code className="mt-0.5 text-xs text-text-dim">{role.code}</code>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                role.status === "active"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${role.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                {role.status === "active" ? "Hoạt động" : "Tắt"}
              </span>
            </div>

            {/* Description + user count */}
            {role.description && (
              <p className="mt-2.5 text-xs text-text-dim line-clamp-2">{role.description}</p>
            )}
            <div className="mt-2 flex items-center gap-1 text-xs text-text-dim">
              <Users className="h-3.5 w-3.5" />
              <span>{role.user_count || 0} người dùng</span>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-main/50 pt-3">
              <button
                onClick={() => navigate(`/admin/roles/${role.id}`)}
                className="flex items-center gap-1 rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-dim transition hover:border-blue-300 hover:text-blue-600"
              >
                <Eye className="h-3.5 w-3.5" /> Chi tiết
              </button>
              <button
                onClick={() => openPermissions(role)}
                disabled={role.is_system_role}
                className="flex items-center gap-1 rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-dim transition hover:border-violet-300 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Lock className="h-3.5 w-3.5" /> Phân quyền
              </button>
              <button
                onClick={() => navigate(`/admin/roles/${role.id}/edit`)}
                disabled={role.is_system_role}
                className="flex items-center gap-1 rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-dim transition hover:border-[#E06666]/50 hover:text-[#E06666] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Pencil className="h-3.5 w-3.5" /> Sửa
              </button>
              <button
                onClick={() => setShowDeleteConfirm(role.id)}
                disabled={role.is_system_role || (role.user_count || 0) > 0}
                className="flex items-center gap-1 rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-dim transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" /> Xoá
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Delete confirm ────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
          <div className="w-full max-w-sm rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-base font-bold text-text-main">Xoá vai trò</h3>
            <p className="mt-1 text-sm text-text-dim">Hành động này không thể hoàn tác.</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app"
              >
                Huỷ
              </button>
              <button
                onClick={() => {
                  const r = roles.find((x) => x.id === showDeleteConfirm);
                  handleDeleteRole(showDeleteConfirm, r?.is_system_role, r?.user_count);
                }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Permissions modal ─────────────────────────────────────── */}
      {showPermissionsModal && selectedRoleForPermissions && (
        <RolePermissionsModal
          roleId={selectedRoleForPermissions.id}
          roleName={selectedRoleForPermissions.name}
          onClose={() => { setShowPermissionsModal(false); setSelectedRoleForPermissions(null); }}
          onSuccess={fetchRoles}
        />
      )}
    </div>
  );
};

export default RolesPage;
