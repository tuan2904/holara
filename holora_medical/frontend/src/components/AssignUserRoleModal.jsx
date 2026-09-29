import { useState, useEffect, useCallback } from "react";
import {
  getAvailableRolesApi,
  getUserRolesApi,
  assignRoleToUserApi,
  removeRoleFromUserApi,
} from "../services/userRoleService";
import ConfirmModal from "./ConfirmModal";
import { ShieldEllipsis, X, Trash2, Plus, CheckCircle2, AlertCircle } from "lucide-react";

// ── Role colour maps ──────────────────────────────────────────────────────────
const ROLE_BADGE = {
  super_admin:  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40",
  admin:        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40",
  doctor:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40",
  patient:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40",
  receptionist: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40",
  accountant:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40",
};
const ROLE_LABEL = {
  super_admin:  "Super Admin",
  admin:        "Admin",
  doctor:       "Bác sĩ",
  patient:      "Bệnh nhân",
  receptionist: "Lễ tân",
  accountant:   "Kế toán",
};

// ── Component ─────────────────────────────────────────────────────────────────
// Accepts both userId/userName (new) and user_id/user_name (legacy)
const AssignUserRoleModal = ({ userId, userName, user_id, user_name, onClose, onSuccess }) => {
  const resolvedUserId   = userId   ?? user_id;
  const resolvedUserName = userName ?? user_name ?? "Người dùng";

  const [availableRoles, setAvailableRoles] = useState([]);
  const [userRoles, setUserRoles]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedRole, setSelectedRole]     = useState("");
  const [assigning, setAssigning]           = useState(false);
  const [roleToRemove, setRoleToRemove]     = useState(null);
  const [error, setError]                   = useState("");
  const [success, setSuccess]               = useState("");

  const fetchRoles = useCallback(async () => {
    if (!resolvedUserId) return;
    try {
      setLoading(true);
      setError("");
      const [available, current] = await Promise.all([
        getAvailableRolesApi(resolvedUserId),
        getUserRolesApi(resolvedUserId),
      ]);
      setAvailableRoles(available || []);
      setUserRoles(current || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải danh sách vai trò.");
    } finally {
      setLoading(false);
    }
  }, [resolvedUserId]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  // Auto-clear success
  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(id);
  }, [success]);

  const handleAssignRole = async () => {
    if (!selectedRole) return;
    try {
      setAssigning(true);
      setError("");
      await assignRoleToUserApi(resolvedUserId, selectedRole);
      setSelectedRole("");
      setSuccess("Gán vai trò thành công!");
      await fetchRoles();
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể gán vai trò.");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async (role_id) => {
    try {
      setError("");
      await removeRoleFromUserApi(resolvedUserId, role_id);
      setSuccess("Đã gỡ vai trò.");
      await fetchRoles();
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể gỡ vai trò.");
    } finally {
      setRoleToRemove(null);
    }
  };

  const unassignedRoles = availableRoles.filter((r) => !r.is_assigned);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border-main bg-bg-surface shadow-2xl dark:bg-slate-800">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border-main px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <ShieldEllipsis className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">Phân quyền người dùng</h3>
              <p className="text-xs text-text-dim">{resolvedUserName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-dim transition hover:bg-bg-app hover:text-text-main dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-5">

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E06666] border-r-transparent" />
              <p className="text-sm text-text-dim">Đang tải...</p>
            </div>
          ) : (
            <>
              {/* ── Current roles ──────────────────────────────────── */}
              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Vai trò hiện tại ({userRoles.length})
                </p>
                {userRoles.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border-main py-4 text-center text-sm text-text-dim">
                    Chưa có vai trò nào được gán
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userRoles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between rounded-xl border border-border-main bg-bg-app px-4 py-3 dark:bg-slate-900/60"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                            ROLE_BADGE[role.name] || "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-300"
                          }`}>
                            {ROLE_LABEL[role.name] || role.name}
                          </span>
                          {role.assigned_at && (
                            <span className="text-xs text-text-dim">
                              {new Date(role.assigned_at).toLocaleDateString("vi-VN")}
                              {role.assigned_by_name && ` · ${role.assigned_by_name}`}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setRoleToRemove(role)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-main text-text-dim transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          title="Gỡ vai trò"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Assign new role ────────────────────────────────── */}
              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Thêm vai trò mới
                </p>
                {unassignedRoles.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border-main py-4 text-center text-sm text-text-dim">
                    Đã gán tất cả vai trò khả dụng
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="flex-1 rounded-xl border border-border-main bg-bg-app px-3.5 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900"
                    >
                      <option value="">-- Chọn vai trò --</option>
                      {unassignedRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {ROLE_LABEL[role.name] || role.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignRole}
                      disabled={assigning || !selectedRole}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#E06666] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D55555] disabled:opacity-50"
                    >
                      {assigning ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Gán
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex justify-end border-t border-border-main px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-xl border border-border-main px-5 py-2 text-sm font-medium text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* ── Confirm remove modal ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={Boolean(roleToRemove)}
        title="Gỡ vai trò"
        description={roleToRemove ? `Bạn có chắc muốn gỡ vai trò "${ROLE_LABEL[roleToRemove.name] || roleToRemove.name}" của ${resolvedUserName}?` : ""}
        tone="danger"
        confirmLabel="Gỡ vai trò"
        cancelLabel="Huỷ"
        onConfirm={() => handleRemoveRole(roleToRemove.id)}
        onClose={() => setRoleToRemove(null)}
      />
    </div>
  );
};

export default AssignUserRoleModal;
