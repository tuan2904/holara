import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Pencil,
  Eye,
  ShieldEllipsis,
  Trash2,
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Filter,
  X,
} from "lucide-react";
import { getAllUsersApi, deleteUserApi } from "../../services/userService";
import AssignUserRoleModal from "../../components/AssignUserRoleModal";

const PAGE_SIZE = 10;

// Màu avatar theo role đầu tiên
const ROLE_COLOR = {
  super_admin: "bg-rose-500",
  admin:       "bg-orange-500",
  doctor:      "bg-blue-500",
  patient:     "bg-emerald-500",
  receptionist:"bg-violet-500",
  accountant:  "bg-amber-500",
};
const ROLE_BADGE = {
  super_admin: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  admin:       "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  doctor:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  patient:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  receptionist:"bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  accountant:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};
const ROLE_LABEL = {
  super_admin: "Super Admin",
  admin:       "Admin",
  doctor:      "Bác sĩ",
  patient:     "Bệnh nhân",
  receptionist:"Lễ tân",
  accountant:  "Kế toán",
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("");

const getAvatarColor = (roles = "") => {
  const first = (roles || "").split(",")[0].trim();
  return ROLE_COLOR[first] || "bg-slate-500";
};

const RoleBadge = ({ role }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      ROLE_BADGE[role.trim()] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
    }`}
  >
    {ROLE_LABEL[role.trim()] || role.trim()}
  </span>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[70, 90, 65, 80, 75, 85].map((w, i) => (
      <td key={i} className="px-5 py-4">
        <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" style={{ width: `${w}%` }} />
      </td>
    ))}
  </tr>
);

const UsersPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null, userName: "" });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  // Auto-clear success message
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsersApi();
      setUsers(res.data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    const userId = deleteModal.userId;
    setDeleteModal({ show: false, userId: null, userName: "" });
    try {
      setError(""); setSuccess("");
      await deleteUserApi(userId);
      setSuccess(t("admin.deleteSuccess"));
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.deleteFailed"));
    }
  };

  const handleRoleModalClose = () => {
    setShowRoleModal(false);
    setSelectedUserForRole(null);
    fetchUsers();
  };

  // Stats derived from full list
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "active").length;
    const inactive = total - active;
    const admins = users.filter((u) =>
      (u.roles || "").split(",").some((r) => ["admin", "super_admin"].includes(r.trim()))
    ).length;
    return { total, active, inactive, admins };
  }, [users]);

  // All unique roles for filter dropdown
  const allRoles = useMemo(() => {
    const set = new Set();
    users.forEach((u) => (u.roles || "").split(",").forEach((r) => { if (r.trim()) set.add(r.trim()); }));
    return [...set].sort();
  }, [users]);

  // Filtered + paginated
  const filtered = useMemo(() => {
    const kw = searchTerm.toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !kw ||
        u.full_name?.toLowerCase().includes(kw) ||
        u.email?.toLowerCase().includes(kw) ||
        u.username?.toLowerCase().includes(kw) ||
        u.phone?.includes(kw);
      const matchStatus =
        filterStatus === "all" || u.status === filterStatus;
      const matchRole =
        filterRole === "all" ||
        (u.roles || "").split(",").some((r) => r.trim() === filterRole);
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, searchTerm, filterStatus, filterRole]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [searchTerm, filterStatus, filterRole]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterRole("all");
  };
  const hasActiveFilters = searchTerm || filterStatus !== "all" || filterRole !== "all";

  return (
    <div className="space-y-6 pb-10">

      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 px-6 py-7 text-white shadow-lg dark:from-slate-900 dark:via-slate-800 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ background: "radial-gradient(circle at 80% 20%, #E06666, transparent 60%)" }} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Quản trị hệ thống</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Quản lý người dùng
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Tạo, chỉnh sửa, phân quyền và xoá tài khoản trong hệ thống
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/users/new")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E06666] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#D55555] active:bg-[#C44444] sm:self-start"
          >
            <Plus className="h-4 w-4" />
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Tổng tài khoản", value: stats.total,    icon: Users,      color: "from-blue-500 to-blue-600",    ring: "ring-blue-200 dark:ring-blue-800" },
          { label: "Đang hoạt động", value: stats.active,   icon: UserCheck,  color: "from-emerald-500 to-emerald-600", ring: "ring-emerald-200 dark:ring-emerald-800" },
          { label: "Không hoạt động",value: stats.inactive, icon: UserX,      color: "from-slate-400 to-slate-500",  ring: "ring-slate-200 dark:ring-slate-700" },
          { label: "Quản trị viên",  value: stats.admins,   icon: Shield,     color: "from-rose-500 to-rose-600",    ring: "ring-rose-200 dark:ring-rose-800" },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-2xl border bg-bg-surface p-4 shadow-sm ring-1 ${stat.ring} dark:bg-slate-800`}>
              <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}>
                <StatIcon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-text-main">{loading ? "—" : stat.value}</p>
              <p className="mt-0.5 text-xs text-text-dim">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Alerts ──────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <X className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer" onClick={() => setError("")} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-400">
          <UserCheck className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* ── Search + Filter Bar ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder="Tìm tên, email, username, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-10 pr-4 text-sm text-text-main placeholder-text-dim outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-text-dim" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-border-main bg-bg-app px-3 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>

          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-xl border border-border-main bg-bg-app px-3 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900"
          >
            <option value="all">Tất cả role</option>
            {allRoles.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r] || r}</option>
            ))}
          </select>
        </div>

        {/* Clear + Refresh */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3 py-2.5 text-xs font-medium text-text-dim transition hover:border-[#E06666]/50 hover:text-[#E06666]"
            >
              <X className="h-3 w-3" /> Xoá lọc
            </button>
          )}
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3 py-2.5 text-xs font-medium text-text-dim transition hover:border-[#E06666]/50 hover:text-[#E06666] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Result count ───────────────────────────────────────── */}
      {!loading && (
        <p className="text-xs text-text-dim">
          Hiển thị <span className="font-semibold text-text-main">{filtered.length}</span> / {users.length} người dùng
          {hasActiveFilters && <button onClick={clearFilters} className="ml-2 text-[#E06666] hover:underline">Xoá bộ lọc</button>}
        </p>
      )}

      {/* ── Table (desktop) / Cards (mobile) ────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
              <tr>
                {["Người dùng", "Email", "SĐT", "Vai trò", "Trạng thái", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-text-dim">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading
                ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                : paginated.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-text-dim">
                        <Users className="h-10 w-10 opacity-30" />
                        <p className="font-medium">Không tìm thấy người dùng nào</p>
                        {hasActiveFilters && (
                          <button onClick={clearFilters} className="mt-1 text-sm text-[#E06666] hover:underline">Xoá bộ lọc</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
                : paginated.map((user) => {
                  const roles = (user.roles || "").split(",").filter(Boolean);
                  return (
                    <tr key={user.id} className="group transition hover:bg-bg-app dark:hover:bg-slate-700/40">
                      {/* User cell */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow ${getAvatarColor(user.roles)}`}>
                            {getInitials(user.full_name)}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => navigate(`/admin/users/${user.id}/view`)}
                              className="truncate text-sm font-semibold text-text-main hover:text-[#E06666] hover:underline text-left"
                            >
                              {user.full_name}
                            </button>
                            <p className="truncate text-xs text-text-dim">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-5 py-3.5 text-sm text-text-main">{user.email}</td>
                      {/* Phone */}
                      <td className="px-5 py-3.5 text-sm text-text-dim">{user.phone || "—"}</td>
                      {/* Roles */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {roles.length > 0
                            ? roles.map((r) => <RoleBadge key={r} role={r} />)
                            : <span className="text-xs text-text-dim">—</span>
                          }
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}/view`)}
                            title="Xem chi tiết"
                            className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { setSelectedUserForRole(user); setShowRoleModal(true); }}
                            title="Phân quyền"
                            className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20"
                          >
                            <ShieldEllipsis className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                            title="Chỉnh sửa"
                            className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-[#E06666]/50 hover:bg-[#E06666]/10 hover:text-[#E06666]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ show: true, userId: user.id, userName: user.full_name })}
                            title="Xoá"
                            className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-border-main md:hidden">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                </div>
              ))
            : paginated.length === 0
            ? (
              <div className="py-16 text-center text-sm text-text-dim">
                <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                Không tìm thấy người dùng nào
              </div>
            )
            : paginated.map((user) => {
              const roles = (user.roles || "").split(",").filter(Boolean);
              return (
                <div key={user.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow ${getAvatarColor(user.roles)}`}>
                      {getInitials(user.full_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-text-main">{user.full_name}</p>
                          <p className="text-xs text-text-dim">@{user.username}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          user.status === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {user.status === "active" ? "Hoạt động" : "Không HĐ"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-dim">{user.email}</p>
                      {user.phone && <p className="text-xs text-text-dim">{user.phone}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {roles.map((r) => <RoleBadge key={r} role={r} />)}
                      </div>
                    </div>
                  </div>
                  {/* Mobile action row */}
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-border-main/50 pt-3">
                    <button
                      onClick={() => navigate(`/admin/users/${user.id}/view`)}
                      className="flex items-center gap-1 rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-dim transition hover:border-blue-300 hover:text-blue-600"
                    >
                      <Eye className="h-3.5 w-3.5" /> Xem
                    </button>
                    <button
                      onClick={() => { setSelectedUserForRole(user); setShowRoleModal(true); }}
                      className="flex items-center gap-1 rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-dim transition hover:border-violet-300 hover:text-violet-600"
                    >
                      <ShieldEllipsis className="h-3.5 w-3.5" /> Phân quyền
                    </button>
                    <button
                      onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                      className="flex items-center gap-1 rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-dim transition hover:border-[#E06666]/50 hover:text-[#E06666]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Sửa
                    </button>
                    <button
                      onClick={() => setDeleteModal({ show: true, userId: user.id, userName: user.full_name })}
                      className="flex items-center gap-1 rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-dim transition hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Xoá
                    </button>
                  </div>
                </div>
              );
            })
          }
        </div>

        {/* Pagination footer */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border-main px-5 py-3 text-sm">
            <p className="text-text-dim">
              Trang <span className="font-semibold text-text-main">{page}</span> / {totalPages}
              &nbsp;·&nbsp;{filtered.length} kết quả
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-[#E06666]/50 hover:text-[#E06666] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {/* Page number pills */}
              {[...Array(totalPages)].map((_, i) => {
                const n = i + 1;
                if (totalPages <= 7 || n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`min-w-[32px] rounded-lg border px-2 py-1 text-xs font-medium transition ${
                        n === page
                          ? "border-[#E06666] bg-[#E06666] text-white"
                          : "border-border-main text-text-dim hover:border-[#E06666]/50 hover:text-[#E06666]"
                      }`}
                    >
                      {n}
                    </button>
                  );
                if (Math.abs(n - page) === 2) return <span key={n} className="text-text-dim">…</span>;
                return null;
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-[#E06666]/50 hover:text-[#E06666] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border-main bg-bg-surface shadow-2xl dark:bg-slate-800">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border-main px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-text-main">Xác nhận xoá</h3>
                <p className="text-xs text-text-dim">Hành động này không thể hoàn tác</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-text-main">
                Bạn có chắc muốn xoá tài khoản{" "}
                <span className="font-semibold text-red-600 dark:text-red-400">"{deleteModal.userName}"</span>?
              </p>
              <p className="mt-1.5 text-xs text-text-dim">
                Tất cả dữ liệu liên quan đến tài khoản này sẽ bị xoá vĩnh viễn.
              </p>
            </div>
            <div className="flex gap-3 border-t border-border-main px-6 py-4">
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Xoá tài khoản
              </button>
              <button
                onClick={() => setDeleteModal({ show: false, userId: null, userName: "" })}
                className="flex-1 rounded-xl border border-border-main px-4 py-2.5 text-sm font-medium text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700"
              >
                Huỷ bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Role Assignment Modal ────────────────────────────────── */}
      {showRoleModal && selectedUserForRole && (
        <AssignUserRoleModal
          userId={selectedUserForRole.id}
          userName={selectedUserForRole.full_name}
          onClose={handleRoleModalClose}
        />
      )}
    </div>
  );
};

export default UsersPage;