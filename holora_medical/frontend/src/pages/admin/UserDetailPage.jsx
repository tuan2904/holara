import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  ShieldEllipsis,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Hash,
  Venus,
  Mars,
  HelpCircle,
  BadgeCheck,
  LogIn,
  CalendarClock,
  Monitor,
  Smartphone,
  Globe,
  Trash2,
  LogOut,
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getUserByIdApi, getUserSessionsApi, getUserLoginHistoryApi, forceLogoutUserApi, revokeSessionApi } from "../../services/userService";
import AssignUserRoleModal from "../../components/AssignUserRoleModal";
import ConfirmModal from "../../components/ConfirmModal";

// ── Shared maps ────────────────────────────────────────────────────────────────
const ROLE_COLOR = {
  super_admin:  "bg-rose-500",
  admin:        "bg-orange-500",
  doctor:       "bg-blue-500",
  patient:      "bg-emerald-500",
  receptionist: "bg-violet-500",
  accountant:   "bg-amber-500",
};
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

const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).slice(-2).map((w) => w[0].toUpperCase()).join("");

const getAvatarColor = (roles = "") =>
  ROLE_COLOR[(roles || "").split(",")[0].trim()] || "bg-slate-500";

const parseBrowser = (ua) => {
  if (!ua) return "Không rõ";
  if (/edg/i.test(ua)) return "Microsoft Edge";
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return "Google Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return ua.length > 60 ? ua.substring(0, 57) + "…" : ua;
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateTime = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, children }) => {
  const RowIcon = icon;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-main last:border-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-app dark:bg-slate-900 text-text-dim">
        <RowIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-dim mb-0.5">{label}</p>
        <div className="text-sm font-medium text-text-main break-words">{children}</div>
      </div>
    </div>
  );
};

const Card = ({ title, children, className = "" }) => (
  <div className={`rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800 ${className}`}>
    {title && (
      <div className="border-b border-border-main px-5 py-3.5">
        <h3 className="text-sm font-semibold text-text-main uppercase tracking-wide">{title}</h3>
      </div>
    )}
    <div className="px-5 py-1">{children}</div>
  </div>
);

const SkeletonBlock = () => (
  <div className="animate-pulse space-y-5">
    <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-700" />
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-700" />
      <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

// ── Main page ──────────────────────────────────────────────────────────────────
const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Session management state
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchSessions = useCallback(async () => {
    if (!userId) return;
    setSessionsLoading(true);
    try {
      const res = await getUserSessionsApi(userId);
      setSessions(res.data || []);
    } catch { /* silent */ }
    finally { setSessionsLoading(false); }
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getUserLoginHistoryApi(userId, 50);
      setLoginHistory(res.data || []);
    } catch { /* silent */ }
  }, [userId]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await getUserByIdApi(userId);
        setUser(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Không thể tải thông tin người dùng.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  useEffect(() => {
    if (user) fetchSessions();
  }, [user, fetchSessions]);

  const handleForceLogout = async () => {
    try {
      await forceLogoutUserApi(userId);
      setSessions([]);
      setConfirmAction(null);
    } catch { /* silent */ }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSessionApi(userId, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setConfirmAction(null);
    } catch { /* silent */ }
  };

  const handleToggleHistory = async () => {
    if (!showHistory && loginHistory.length === 0) {
      await fetchHistory();
    }
    setShowHistory((v) => !v);
  };

  const handleRoleModalClose = async () => {
    setShowRoleModal(false);
    // Refresh user data after role change
    try {
      const res = await getUserByIdApi(userId);
      setUser(res.data);
    } catch {/* silent */}
  };

  const roles = user?.roles
    ? user.roles.split(",").map((r) => r.trim()).filter(Boolean)
    : [];

  const genderIcon = user?.gender === "male"
    ? <Mars className="h-4 w-4 text-blue-500" />
    : user?.gender === "female"
    ? <Venus className="h-4 w-4 text-pink-500" />
    : <HelpCircle className="h-4 w-4 text-text-dim" />;

  const genderLabel = user?.gender === "male"
    ? "Nam"
    : user?.gender === "female"
    ? "Nữ"
    : user?.gender
    ? user.gender
    : "—";

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      {/* ── Nav bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3.5 py-2 text-sm font-medium text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Quay lại</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRoleModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3.5 py-2 text-sm font-medium text-text-main transition hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20 dark:hover:text-violet-400"
          >
            <ShieldEllipsis className="h-4 w-4" />
            <span className="hidden sm:inline">Phân quyền</span>
          </button>
          <button
            onClick={() => navigate(`/admin/users/${userId}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#E06666] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#D55555]"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Chỉnh sửa</span>
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonBlock />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          {error}
        </div>
      ) : user ? (
        <>
          {/* ── Hero card ─────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl border border-border-main bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-md">
            {/* Glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />

            <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-lg ${getAvatarColor(user.roles)}`}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  getInitials(user.full_name)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl font-bold text-white sm:text-2xl">{user.full_name}</h1>
                <p className="mt-1 text-sm text-slate-400">@{user.username}</p>

                {/* Roles */}
                {roles.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                    {roles.map((r) => (
                      <span
                        key={r}
                        className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                          ROLE_BADGE[r] || "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {ROLE_LABEL[r] || r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status pill */}
              <div className="sm:self-start">
                {user.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Hoạt động
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/20 px-3 py-1 text-xs font-semibold text-slate-400 ring-1 ring-slate-500/30">
                    <XCircle className="h-3.5 w-3.5" />
                    Không hoạt động
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Info grid ─────────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Personal info */}
            <Card title="Thông tin cá nhân">
              <InfoRow icon={User} label="Họ và tên">
                {user.full_name || "—"}
              </InfoRow>
              <InfoRow icon={Mail} label="Email">
                <a href={`mailto:${user.email}`} className="text-[#E06666] hover:underline break-all">
                  {user.email || "—"}
                </a>
              </InfoRow>
              <InfoRow icon={Phone} label="Số điện thoại">
                {user.phone ? (
                  <a href={`tel:${user.phone}`} className="text-[#E06666] hover:underline">
                    {user.phone}
                  </a>
                ) : "—"}
              </InfoRow>
              <InfoRow icon={user.gender === "male" ? Mars : user.gender === "female" ? Venus : HelpCircle} label="Giới tính">
                <span className="inline-flex items-center gap-1.5">
                  {genderIcon}
                  {genderLabel}
                </span>
              </InfoRow>
              <InfoRow icon={Calendar} label="Ngày sinh">
                {formatDate(user.date_of_birth)}
              </InfoRow>
            </Card>

            {/* Account info */}
            <Card title="Thông tin tài khoản">
              <InfoRow icon={Hash} label="ID người dùng">
                <code className="rounded bg-bg-app px-2 py-0.5 text-xs font-mono dark:bg-slate-900">
                  #{user.id}
                </code>
              </InfoRow>
              <InfoRow icon={User} label="Tên đăng nhập">
                @{user.username || "—"}
              </InfoRow>
              <InfoRow icon={BadgeCheck} label="Xác minh email">
                {user.email_verified_at ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {formatDateTime(user.email_verified_at)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <XCircle className="h-3.5 w-3.5" />
                    Chưa xác minh
                  </span>
                )}
              </InfoRow>
              <InfoRow icon={LogIn} label="Đăng nhập lần cuối">
                {formatDateTime(user.last_login_at)}
              </InfoRow>
              <InfoRow icon={CalendarClock} label="Ngày tạo">
                {formatDateTime(user.created_at)}
              </InfoRow>
            </Card>
          </div>

          {/* ── Roles card ────────────────────────────────────────────── */}
          <Card title="Phân quyền">
            {roles.length === 0 ? (
              <p className="py-4 text-sm text-text-dim text-center">Chưa có vai trò nào được gán.</p>
            ) : (
              <div className="flex flex-wrap gap-2 py-4">
                {roles.map((r) => (
                  <span
                    key={r}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${
                      ROLE_BADGE[r] || "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <ShieldEllipsis className="h-3.5 w-3.5" />
                    {ROLE_LABEL[r] || r}
                  </span>
                ))}
              </div>
            )}
            <div className="pb-3">
              <button
                onClick={() => setShowRoleModal(true)}
                className="w-full rounded-xl border-2 border-dashed border-border-main py-2.5 text-sm font-medium text-text-dim transition hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-500 dark:hover:text-violet-400"
              >
                + Quản lý vai trò
              </button>
            </div>
          </Card>

          {/* ── Sessions card ─────────────────────────────────────────── */}
          <Card title="Phiên đăng nhập">
            <div className="py-3 space-y-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-text-dim">
                  <span className="font-semibold text-text-main">{sessions.length}</span> phiên đang hoạt động
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchSessions}
                    disabled={sessionsLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-main px-3 py-1.5 text-xs font-medium text-text-dim transition hover:bg-bg-app dark:hover:bg-slate-700"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${sessionsLoading ? "animate-spin" : ""}`} />
                    Làm mới
                  </button>
                  {sessions.length > 0 && (
                    <button
                      onClick={() => setConfirmAction({ type: "force-logout-all" })}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Đăng xuất tất cả
                    </button>
                  )}
                </div>
              </div>

              {/* Session list */}
              {sessionsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-6 text-sm text-text-dim">
                  Không có phiên đăng nhập nào đang hoạt động.
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => {
                    const isMobile = /mobile|android|iphone|ipad/i.test(s.user_agent || "");
                    const DeviceIcon = isMobile ? Smartphone : Monitor;
                    const browser = parseBrowser(s.user_agent);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 rounded-xl border border-border-main bg-bg-app/50 px-4 py-3 dark:bg-slate-900/50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <DeviceIcon className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-main truncate">{browser}</p>
                          <div className="flex items-center gap-3 text-xs text-text-dim mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {s.ip_address || "—"}
                            </span>
                            <span>{formatDateTime(s.created_at)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmAction({ type: "revoke-session", sessionId: s.id })}
                          className="shrink-0 rounded-lg p-2 text-text-dim transition hover:bg-red-500/10 hover:text-red-500"
                          title="Thu hồi phiên"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Toggle login history */}
              <button
                onClick={handleToggleHistory}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border-main py-2.5 text-sm font-medium text-text-dim transition hover:border-slate-400 hover:text-text-main dark:hover:border-slate-500"
              >
                <History className="h-4 w-4" />
                {showHistory ? "Ẩn lịch sử đăng nhập" : "Xem lịch sử đăng nhập"}
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {/* Login history table */}
              {showHistory && (
                <div className="overflow-x-auto rounded-xl border border-border-main">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-main bg-bg-app dark:bg-slate-900">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-text-dim uppercase">Thời gian</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-text-dim uppercase">IP</th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-text-dim uppercase">Thiết bị</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-text-dim uppercase">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-text-dim">Chưa có lịch sử</td>
                        </tr>
                      ) : (
                        loginHistory.map((h) => (
                          <tr key={h.id} className="border-b border-border-main last:border-0">
                            <td className="px-3 py-2.5 text-text-main whitespace-nowrap">{formatDateTime(h.created_at)}</td>
                            <td className="px-3 py-2.5 text-text-dim font-mono text-xs">{h.ip_address || "—"}</td>
                            <td className="px-3 py-2.5 text-text-dim text-xs max-w-[200px] truncate">{parseBrowser(h.user_agent)}</td>
                            <td className="px-3 py-2.5 text-center">
                              {h.status === "active" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" /> Active
                                </span>
                              ) : h.status === "expired" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                  <Clock className="h-3 w-3" /> Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  <XCircle className="h-3 w-3" /> Revoked
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </>
      ) : null}

      {/* ── Confirm modal ────────────────────────────────────────────────── */}
      {confirmAction && (
        <ConfirmModal
          isOpen={true}
          title={confirmAction.type === "force-logout-all" ? "Đăng xuất tất cả?" : "Thu hồi phiên?"}
          description={
            confirmAction.type === "force-logout-all"
              ? `Tất cả ${sessions.length} phiên đăng nhập của ${user?.full_name} sẽ bị đăng xuất. Người dùng sẽ cần đăng nhập lại trên tất cả thiết bị.`
              : "Phiên đăng nhập này sẽ bị thu hồi. Thiết bị tương ứng sẽ bị đăng xuất."
          }
          tone="danger"
          confirmLabel={confirmAction.type === "force-logout-all" ? "Đăng xuất tất cả" : "Thu hồi"}
          onConfirm={() =>
            confirmAction.type === "force-logout-all"
              ? handleForceLogout()
              : handleRevokeSession(confirmAction.sessionId)
          }
          onClose={() => setConfirmAction(null)}
        />
      )}

      {/* ── Role modal ───────────────────────────────────────────────────── */}
      {showRoleModal && user && (
        <AssignUserRoleModal
          userId={user.id}
          userName={user.full_name}
          onClose={handleRoleModalClose}
        />
      )}
    </div>
  );
};

export default UserDetailPage;
