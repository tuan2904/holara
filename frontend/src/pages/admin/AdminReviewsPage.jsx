import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Star, Filter, ChevronLeft, ChevronRight, Check, X, EyeOff,
  MessageSquare, Loader2,
} from "lucide-react";
import { getAllReviewsApi, moderateReviewApi } from "../../services/reviewService";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  hidden: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-none text-slate-300 dark:text-slate-600"}`} />
    ))}
  </div>
);

const formatDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? `${v}` : d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const AdminReviewsPage = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [moderating, setModerating] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 25 };
        if (statusFilter) params.status = statusFilter;
        if (ratingFilter) params.rating = ratingFilter;
        const res = await getAllReviewsApi(params);
        setReviews(res.data || []);
        setPagination(res.pagination || null);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, statusFilter, ratingFilter]);

  const handleModerate = async (id, status) => {
    setModerating(id);
    try {
      await moderateReviewApi(id, status);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setModerating(null);
    }
  };

  const STATUS_OPTIONS = [
    { value: "", label: t("review.filter.all", { defaultValue: "All" }) },
    { value: "pending", label: t("review.filter.pending", { defaultValue: "Pending" }) },
    { value: "approved", label: t("review.filter.approved", { defaultValue: "Approved" }) },
    { value: "rejected", label: t("review.filter.rejected", { defaultValue: "Rejected" }) },
    { value: "hidden", label: t("review.filter.hidden", { defaultValue: "Hidden" }) },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            {t("admin.reviews.subtitle", { defaultValue: "Moderation" })}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {t("admin.reviews.title", { defaultValue: "Review Management" })}
          </h1>
          {pagination && (
            <p className="mt-2 text-sm text-slate-400">
              {pagination.total} {t("admin.reviews.totalReviews", { defaultValue: "total reviews" })}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-dim" />
          <span className="text-xs font-semibold text-text-dim">Status:</span>
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  statusFilter === opt.value
                    ? "bg-[#E06666] text-white"
                    : "bg-bg-app text-text-dim hover:text-[#E06666] dark:hover:bg-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-text-dim" />
          <span className="text-xs font-semibold text-text-dim">Rating:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => { setRatingFilter(""); setPage(1); }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${!ratingFilter ? "bg-[#E06666] text-white" : "bg-bg-app text-text-dim dark:hover:bg-slate-700"}`}
            >
              {t("review.filter.all", { defaultValue: "All" })}
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => { setRatingFilter(String(r)); setPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  ratingFilter === String(r) ? "bg-amber-500 text-white" : "bg-bg-app text-text-dim dark:hover:bg-slate-700"
                }`}
              >
                {r}★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#E06666]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-main bg-bg-surface py-16 dark:bg-slate-800">
          <MessageSquare className="h-12 w-12 text-text-dim opacity-30" />
          <p className="mt-3 text-sm font-medium text-text-dim">
            {t("admin.reviews.noReviews", { defaultValue: "No reviews found" })}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-main bg-bg-app/50 dark:bg-slate-700/30">
                <th className="px-4 py-3 font-semibold text-text-dim">ID</th>
                <th className="px-4 py-3 font-semibold text-text-dim">{t("admin.reviews.patient", { defaultValue: "Patient" })}</th>
                <th className="px-4 py-3 font-semibold text-text-dim">{t("admin.reviews.doctor", { defaultValue: "Doctor" })}</th>
                <th className="px-4 py-3 font-semibold text-text-dim">{t("admin.reviews.rating", { defaultValue: "Rating" })}</th>
                <th className="px-4 py-3 font-semibold text-text-dim">{t("admin.reviews.content", { defaultValue: "Content" })}</th>
                <th className="px-4 py-3 font-semibold text-text-dim">{t("admin.reviews.status", { defaultValue: "Status" })}</th>
                <th className="px-4 py-3 font-semibold text-text-dim">{t("admin.reviews.date", { defaultValue: "Date" })}</th>
                <th className="px-4 py-3 font-semibold text-text-dim">{t("admin.reviews.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-border-main transition hover:bg-bg-app/30 dark:hover:bg-slate-700/20">
                  <td className="px-4 py-3 text-xs font-mono text-text-dim">#{review.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-main">
                      {review.is_anonymous ? <span className="italic text-text-dim">Anonymous</span> : review.patient_name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-main">Dr. {review.doctor_name}</p>
                    <p className="text-xs text-text-dim">{review.doctor_code}</p>
                  </td>
                  <td className="px-4 py-3"><Stars rating={review.rating} /></td>
                  <td className="max-w-xs px-4 py-3">
                    {review.title && <p className="text-sm font-semibold text-text-main truncate">{review.title}</p>}
                    {review.comment && <p className="text-xs text-text-dim truncate">{review.comment}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[review.status] || ""}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-dim whitespace-nowrap">{formatDate(review.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {review.status !== "approved" && (
                        <button
                          onClick={() => handleModerate(review.id, "approved")}
                          disabled={moderating === review.id}
                          title={t("admin.reviews.approve", { defaultValue: "Approve" })}
                          className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-900/30 dark:text-emerald-300"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {review.status !== "rejected" && (
                        <button
                          onClick={() => handleModerate(review.id, "rejected")}
                          disabled={moderating === review.id}
                          title={t("admin.reviews.reject", { defaultValue: "Reject" })}
                          className="rounded-lg bg-red-100 p-1.5 text-red-700 transition hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      {review.status !== "hidden" && (
                        <button
                          onClick={() => handleModerate(review.id, "hidden")}
                          disabled={moderating === review.id}
                          title={t("admin.reviews.hide", { defaultValue: "Hide" })}
                          className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300"
                        >
                          <EyeOff className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-border-main p-2 text-text-dim transition hover:bg-bg-app disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-text-dim">{page} / {pagination.totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="rounded-xl border border-border-main p-2 text-text-dim transition hover:bg-bg-app disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
