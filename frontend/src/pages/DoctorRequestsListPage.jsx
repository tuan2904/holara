import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowRight, CalendarClock, Loader2, RefreshCw, Stethoscope } from "lucide-react";
import { consultationService } from "../services/consultationService";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  in_progress: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const STATUS_LABELS = {
  pending: "Chờ Xếp Bác Sĩ",
  in_progress: "Đang Xử Lý",
  completed: "Hoàn Thành",
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return `${value}`;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DoctorRequestsListPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await consultationService.getDoctorRequests();
      setRequests(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể tải danh sách ca tư vấn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const inProgressCount = requests.filter((r) => r.status === "in_progress").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E06666] to-[#C04444] p-8 text-white shadow-lg md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">
              {t("doctor.zone") || "Doctor Zone"}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Danh Sách Ca Tư Vấn
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
              Các ca tư vấn đang chờ xử lý và đang tiến hành từ bệnh nhân.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Chờ xử lý</p>
              <p className="mt-2 text-2xl font-bold">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Đang xử lý</p>
              <p className="mt-2 text-2xl font-bold">{inProgressCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table card */}
      <section className="overflow-hidden rounded-3xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[#E06666]" />
            <h2 className="text-lg font-semibold text-text-main">
              Tất cả ca tư vấn
              {!loading && (
                <span className="ml-2 rounded-full bg-bg-app px-2 py-0.5 text-xs font-bold text-text-dim dark:bg-slate-900">
                  {requests.length}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border-main px-3 py-2 text-sm font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                  Bệnh nhân
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                  Triệu chứng chính
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                  Thời gian
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                  Trạng thái
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-text-dim">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải danh sách...
                    </span>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <CalendarClock className="mx-auto mb-3 h-10 w-10 text-text-dim/40" />
                    <p className="text-sm text-text-dim">Hiện tại không có ca tư vấn nào.</p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="group transition hover:bg-bg-app dark:hover:bg-slate-900/40">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-text-main">{req.patient_name || "—"}</p>
                      <p className="mt-0.5 text-xs text-text-dim">#{req.id}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-main">
                      <span className="line-clamp-2 max-w-xs border-l-2 border-[#E06666]/60 pl-2">
                        {req.chief_complaint || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-dim whitespace-nowrap">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[req.status] || "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => navigate(`/doctor/consultations/${req.id}`)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#E06666] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#D55555]"
                      >
                        Xem chi tiết
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DoctorRequestsListPage;
