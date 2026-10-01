import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Pencil, Shield, Users, CheckCircle2,
  AlertCircle, Search, Save, Lock, ChevronDown, ChevronUp,
} from "lucide-react";
import * as roleService from "../../services/roleService";
import * as permissionService from "../../services/permissionService";

const RoleDetailPage = () => {
  const { t } = useTranslation();
  const { roleId } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [collapsedModules, setCollapsedModules] = useState({});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [roleId]);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const roleResponse = await roleService.getRoleByIdApi(roleId);
      setRole(roleResponse.data);

      const permResponse = await permissionService.getAllPermissionsApi();
      setPermissions(permResponse.data || []);

      const uniqueModules = [
        ...new Set((permResponse.data || []).filter((p) => p.module_name).map((p) => p.module_name)),
      ];
      setModules(uniqueModules);

      const rolePermResponse = await roleService.getRolePermissionsApi(roleId);
      setAssignedPermissions(rolePermResponse.data || []);
      const assignedIds = rolePermResponse.data.filter((p) => p.is_assigned).map((p) => p.id);
      setSelectedPermissions(assignedIds);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]
    );
  };

  const handleToggleModule = (module, perms) => {
    const moduleIds = perms.map((p) => p.id);
    const allSelected = moduleIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !moduleIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...moduleIds])]);
    }
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const currentAssigned = assignedPermissions.filter((p) => p.is_assigned).map((p) => p.id);
      const toAdd = selectedPermissions.filter((id) => !currentAssigned.includes(id));
      const toRemove = currentAssigned.filter((id) => !selectedPermissions.includes(id));

      for (const permissionId of toAdd) {
        await roleService.assignPermissionApi({ role_id: roleId, permission_id: permissionId });
      }
      for (const permissionId of toRemove) {
        await roleService.removePermissionApi({ role_id: roleId, permission_id: permissionId });
      }

      setSuccess(t("admin.updateRolePermissionsSuccess"));
      setTimeout(() => { fetchData(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = permissions.filter((p) => {
    const kw = searchTerm.toLowerCase();
    const matchSearch = !kw || p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw);
    const matchModule = !selectedModule || p.module_name === selectedModule;
    return matchSearch && matchModule;
  });

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const mod = perm.module_name || "General";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  const assignedCount = selectedPermissions.length;
  const totalCount = permissions.length;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 pb-10">
        <div className="animate-pulse h-14 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="animate-pulse h-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="animate-pulse h-64 rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-red-500">{t("admin.roleNotFound")}</p>
        <button
          onClick={() => navigate("/admin/roles")}
          className="rounded-xl bg-[#E06666] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#D55555]"
        >
          {t("admin.backToRoles")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">

      {/* ── Nav bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate("/admin/roles")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3.5 py-2 text-sm font-medium text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Quay lại</span>
        </button>

        <div className="flex items-center gap-2">
          {!role.is_system_role && (
            <>
              <button
                onClick={() => navigate(`/admin/roles/${roleId}/edit`)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3.5 py-2 text-sm font-medium text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Chỉnh sửa</span>
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E06666] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#D55555] disabled:opacity-50"
              >
                {saving
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">Lưu quyền</span>
              </button>
            </>
          )}
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

      {/* ── Hero card ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border-main bg-gradient-to-br from-slate-800 to-slate-900 p-5 sm:p-6 shadow-md">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-white sm:text-2xl">{role.name}</h1>
                {role.is_system_role && (
                  <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-300 ring-1 ring-purple-500/30">
                    Hệ thống
                  </span>
                )}
              </div>
              <code className="mt-1 text-sm text-slate-400">{role.code}</code>
              {role.description && <p className="mt-1 text-sm text-slate-400">{role.description}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              role.status === "active"
                ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                : "bg-slate-500/20 text-slate-400 ring-1 ring-slate-500/30"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${role.status === "active" ? "bg-emerald-400" : "bg-slate-500"}`} />
              {role.status === "active" ? "Hoạt động" : "Không hoạt động"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              <Users className="h-3.5 w-3.5" />
              {role.user_count || 0} người dùng
            </span>
          </div>
        </div>
      </div>

      {/* ── Permission stats (mini bar) ───────────────────────────── */}
      <div className="flex items-center gap-4 rounded-2xl border border-border-main bg-bg-surface px-5 py-4 shadow-sm dark:bg-slate-800">
        <Lock className="h-5 w-5 shrink-0 text-text-dim" />
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-text-dim">Quyền được gán</span>
            <span className="font-semibold text-text-main">{assignedCount} / {totalCount}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg-app dark:bg-slate-900">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 transition-all"
              style={{ width: `${totalCount > 0 ? (assignedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── System role warning ───────────────────────────────────── */}
      {role.is_system_role && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/15 dark:text-amber-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("admin.systemRolePermissionsWarning")}</span>
        </div>
      )}

      {/* ── Permissions section ───────────────────────────────────── */}
      <div className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        {/* Section header */}
        <div className="border-b border-border-main px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-dim">
            Danh sách quyền
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2.5 border-b border-border-main px-5 py-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="Tìm quyền..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-4 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900"
            />
          </div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="rounded-xl border border-border-main bg-bg-app px-3.5 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900"
          >
            <option value="">Tất cả module</option>
            {modules.map((mod) => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        </div>

        {/* Permission groups */}
        <div className="divide-y divide-border-main">
          {Object.keys(groupedPermissions).length === 0 ? (
            <div className="py-14 text-center text-sm text-text-dim">
              Không tìm thấy quyền nào
            </div>
          ) : Object.entries(groupedPermissions).map(([mod, perms]) => {
            const assignedInModule = perms.filter((p) => selectedPermissions.includes(p.id)).length;
            const allSelected = assignedInModule === perms.length;
            const isCollapsed = collapsedModules[mod];

            return (
              <div key={mod}>
                {/* Module header */}
                <div className="flex items-center justify-between px-5 py-3 bg-bg-app/50 dark:bg-slate-900/30">
                  <div className="flex items-center gap-3">
                    {!role.is_system_role && (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => handleToggleModule(mod, perms)}
                        disabled={saving}
                        className="h-4 w-4 rounded text-violet-600 focus:ring-violet-500/30"
                        title="Chọn tất cả module"
                      />
                    )}
                    <span className="text-sm font-semibold text-text-main">{mod}</span>
                    <span className="text-xs text-text-dim">
                      {assignedInModule}/{perms.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setCollapsedModules((s) => ({ ...s, [mod]: !s[mod] }))}
                    className="rounded-lg p-1 text-text-dim transition hover:bg-bg-app dark:hover:bg-slate-700"
                  >
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </button>
                </div>

                {/* Permission items */}
                {!isCollapsed && (
                  <div className="divide-y divide-border-main/50">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className={`flex cursor-pointer items-start gap-3 px-5 py-3 transition sm:items-center ${
                          !role.is_system_role ? "hover:bg-bg-app dark:hover:bg-slate-700/40" : "cursor-default"
                        }`}
                      >
                        {!role.is_system_role && (
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => handleTogglePermission(perm.id)}
                            disabled={saving}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded text-violet-600 focus:ring-violet-500/30 disabled:opacity-50 sm:mt-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-main leading-snug">{perm.name}</p>
                          <p className="text-xs text-text-dim">{perm.code}</p>
                          {perm.description && (
                            <p className="mt-0.5 text-xs text-text-dim">{perm.description}</p>
                          )}
                        </div>
                        <span className={`shrink-0 self-start rounded-full px-2 py-0.5 text-[10px] font-semibold sm:self-auto ${
                          perm.status === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        }`}>
                          {perm.status === "active" ? "Active" : "Off"}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sticky save bar (mobile) ──────────────────────────────── */}
      {!role.is_system_role && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-main bg-bg-surface/95 px-4 py-3 shadow-xl backdrop-blur-sm dark:bg-slate-900/95 sm:hidden">
          <button
            onClick={handleSavePermissions}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E06666] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#D55555] disabled:opacity-50"
          >
            {saving
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              : <Save className="h-4 w-4" />}
            {saving ? "Đang lưu..." : "Lưu thay đổi quyền"}
          </button>
        </div>
      )}
    </div>
  );
};

export default RoleDetailPage;

