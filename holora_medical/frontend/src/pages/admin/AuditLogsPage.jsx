import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  User,
  Monitor,
  Globe,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  getAuditLogsApi,
  getAuditActionsApi,
  getAuditEntityTypesApi,
} from "../../services/auditService";

const PAGE_SIZE = 25;

// Action badge colors
const ACTION_COLOR = {
  AUTH_LOGIN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  AUTH_LOGIN_FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  AUTH_REGISTER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  AUTH_LOGOUT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  AUTH_LOGOUT_ALL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  AUTH_FORGOT_PASSWORD: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  AUTH_RESET_PASSWORD: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  USER_CREATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  USER_UPDATE: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  USER_DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ROLE_ASSIGN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ROLE_REMOVE: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  DOCTOR_CREATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DOCTOR_UPDATE: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  DOCTOR_DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  DOCTOR_INVITE: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  PATIENT_CREATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PATIENT_UPDATE: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  PATIENT_DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  APPOINTMENT_CREATE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  APPOINTMENT_STATUS_CHANGE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONSULTATION_CREATE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CONSULTATION_RESPONSE: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  CONSULTATION_REOPEN: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const DEFAULT_BADGE = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const parseBrowser = (ua) => {
  if (!ua) return "Unknown";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Opera") || ua.includes("OPR/")) return "Opera";
  return "Other";
};

const AuditLogsPage = () => {
  const { t } = useTranslation();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Filter options
  const [actionOptions, setActionOptions] = useState([]);
  const [entityTypeOptions, setEntityTypeOptions] = useState([]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [actionsRes, typesRes] = await Promise.all([
        getAuditActionsApi(),
        getAuditEntityTypesApi(),
      ]);
      setActionOptions(actionsRes.data || []);
      setEntityTypeOptions(typesRes.data || []);
    } catch {
      // Filter options are optional
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (actionFilter) params.action = actionFilter;
      if (entityTypeFilter) params.entity_type = entityTypeFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo + " 23:59:59";

      const res = await getAuditLogsApi(params);
      setLogs(res.data || []);
      setPagination(res.pagination || { page: 1, total: 0, totalPages: 0 });
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearFilters = () => {
    setActionFilter("");
    setEntityTypeFilter("");
    setSearchUser("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters = actionFilter || entityTypeFilter || dateFrom || dateTo;

  // Client-side user search (filter already-loaded rows)
  const filteredLogs = searchUser
    ? logs.filter(
        (l) =>
          (l.user_name || "").toLowerCase().includes(searchUser.toLowerCase()) ||
          (l.user_email || "").toLowerCase().includes(searchUser.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            {t("admin.auditLogs", { defaultValue: "Audit Logs" })}
          </h1>
          <p className="mt-1 text-sm text-text-dim">
            {t("admin.auditLogsDesc", {
              defaultValue: "Track all system activities and security events",
            })}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              hasActiveFilters
                ? "border-[#E06666] bg-[#E06666]/10 text-[#E06666]"
                : "border-border-main bg-bg-surface text-text-main hover:bg-bg-hover"
            }`}
          >
            <Filter className="h-4 w-4" />
            {t("common.filter", { defaultValue: "Filter" })}
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-[#E06666] px-1.5 py-0.5 text-xs text-white">!</span>
            )}
          </button>

          <button
            onClick={() => {
              setPage(1);
              fetchLogs();
            }}
            className="flex items-center gap-2 rounded-lg border border-border-main bg-bg-surface px-4 py-2 text-sm font-medium text-text-main hover:bg-bg-hover transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-xl border border-border-main bg-white/60 backdrop-blur-xl dark:bg-slate-900/60 p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-dim">
                {t("audit.action", { defaultValue: "Action" })}
              </label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border-main bg-bg-surface px-3 py-2 text-sm text-text-main"
              >
                <option value="">{t("common.all", { defaultValue: "All" })}</option>
                {actionOptions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-dim">
                {t("audit.entityType", { defaultValue: "Entity Type" })}
              </label>
              <select
                value={entityTypeFilter}
                onChange={(e) => {
                  setEntityTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border-main bg-bg-surface px-3 py-2 text-sm text-text-main"
              >
                <option value="">{t("common.all", { defaultValue: "All" })}</option>
                {entityTypeOptions.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-dim">
                {t("audit.from", { defaultValue: "From" })}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border-main bg-bg-surface px-3 py-2 text-sm text-text-main"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-text-dim">
                {t("audit.to", { defaultValue: "To" })}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border-main bg-bg-surface px-3 py-2 text-sm text-text-main"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 rounded-lg border border-border-main px-3 py-2 text-sm text-text-dim hover:bg-bg-hover transition"
              >
                <X className="h-4 w-4" />
                {t("common.clear", { defaultValue: "Clear" })}
              </button>
            </div>
          </div>

          {/* User search */}
          <div className="mt-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                placeholder={t("audit.searchUser", { defaultValue: "Search by user name or email..." })}
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full rounded-lg border border-border-main bg-bg-surface py-2 pl-10 pr-3 text-sm text-text-main placeholder:text-text-dim"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-text-dim">
        <span className="flex items-center gap-1">
          <Shield className="h-4 w-4" />
          {pagination.total} {t("audit.totalEvents", { defaultValue: "events" })}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border-main bg-white/60 backdrop-blur-xl shadow-sm dark:bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-main bg-bg-surface/50">
                <th className="px-4 py-3 font-medium text-text-dim">{t("audit.time", { defaultValue: "Time" })}</th>
                <th className="px-4 py-3 font-medium text-text-dim">{t("audit.user", { defaultValue: "User" })}</th>
                <th className="px-4 py-3 font-medium text-text-dim">{t("audit.action", { defaultValue: "Action" })}</th>
                <th className="px-4 py-3 font-medium text-text-dim">{t("audit.entity", { defaultValue: "Entity" })}</th>
                <th className="px-4 py-3 font-medium text-text-dim">{t("audit.ip", { defaultValue: "IP" })}</th>
                <th className="px-4 py-3 font-medium text-text-dim w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-main/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-bg-hover" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-dim">
                    {t("audit.noResults", { defaultValue: "No audit logs found." })}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className="border-b border-border-main/50 hover:bg-bg-hover/50 transition cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-text-main">
                          <Clock className="h-3.5 w-3.5 text-text-dim" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E06666]/10">
                            <User className="h-3.5 w-3.5 text-[#E06666]" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-text-main font-medium text-xs">
                              {log.user_name || "System"}
                            </div>
                            <div className="truncate text-text-dim text-xs">
                              {log.user_email || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            ACTION_COLOR[log.action] || DEFAULT_BADGE
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-main text-xs">
                        {log.entity_type && (
                          <span>
                            {log.entity_type}
                            {log.entity_id ? ` #${log.entity_id}` : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-text-dim">
                          <Globe className="h-3 w-3" />
                          {log.ip_address || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {log.details && (
                          expandedRow === log.id ? (
                            <ChevronUp className="h-4 w-4 text-text-dim" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-text-dim" />
                          )
                        )}
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {expandedRow === log.id && (
                      <tr className="border-b border-border-main/50 bg-bg-surface/30">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                            {log.details && (
                              <div>
                                <span className="font-medium text-text-dim">
                                  {t("audit.details", { defaultValue: "Details" })}:
                                </span>
                                <pre className="mt-1 rounded-lg bg-bg-surface p-2 text-text-main overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Monitor className="h-3.5 w-3.5 text-text-dim" />
                                <span className="text-text-dim">
                                  {t("audit.browser", { defaultValue: "Browser" })}:
                                </span>
                                <span className="text-text-main">{parseBrowser(log.user_agent)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-text-dim" />
                                <span className="text-text-dim">IP:</span>
                                <span className="text-text-main">{log.ip_address || "—"}</span>
                              </div>
                              {log.user_agent && (
                                <div className="mt-1 break-all rounded-lg bg-bg-surface p-2 text-text-dim">
                                  {log.user_agent}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-main px-4 py-3">
            <span className="text-xs text-text-dim">
              {t("common.page", { defaultValue: "Page" })} {pagination.page} / {pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border-main p-1.5 text-text-dim hover:bg-bg-hover disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-border-main p-1.5 text-text-dim hover:bg-bg-hover disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
