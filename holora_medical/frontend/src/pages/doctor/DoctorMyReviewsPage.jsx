import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, MessageSquare, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { getReceivedReviewsApi } from "../../services/reviewService";
import ReviewCard from "../../components/ReviewCard";
import RatingSummary from "../../components/RatingSummary";
import { getDoctorRatingSummaryApi } from "../../services/reviewService";

const DoctorMyReviewsPage = () => {
  const { t, i18n } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingSummary, setRatingSummary] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (statusFilter) params.status = statusFilter;
        const res = await getReceivedReviewsApi(params);
        setReviews(res.data || []);
        setPagination(res.pagination || null);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, statusFilter]);

  // Load summary using doctor_id from first review, or a separate endpoint
  useEffect(() => {
    if (reviews.length > 0 && reviews[0].doctor_id) {
      getDoctorRatingSummaryApi(reviews[0].doctor_id)
        .then((r) => setRatingSummary(r.data))
        .catch(() => setRatingSummary(null));
    }
  }, [reviews]);

  const STATUS_OPTIONS = [
    { value: "", label: t("review.filter.all", { defaultValue: "All" }) },
    { value: "approved", label: t("review.filter.approved", { defaultValue: "Approved" }) },
    { value: "pending", label: t("review.filter.pending", { defaultValue: "Pending" }) },
    { value: "hidden", label: t("review.filter.hidden", { defaultValue: "Hidden" }) },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-800 to-cyan-950 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
            {t("review.page.subtitle", { defaultValue: "Feedback & Ratings" })}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {t("review.page.doctorTitle", { defaultValue: "My Reviews" })}
          </h1>
          <p className="mt-2 text-sm text-cyan-100/60">
            {t("review.page.doctorDescription", { defaultValue: "Reviews and ratings from your patients" })}
          </p>
        </div>
      </div>

      {/* Summary */}
      {ratingSummary && <RatingSummary summary={ratingSummary} />}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-text-dim" />
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === opt.value
                  ? "bg-cyan-500 text-white"
                  : "bg-bg-app text-text-dim hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-bg-app dark:bg-slate-800" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-main bg-bg-surface py-16 dark:bg-slate-800">
          <MessageSquare className="h-12 w-12 text-text-dim opacity-30" />
          <p className="mt-3 text-sm font-medium text-text-dim">
            {t("review.page.noReviews", { defaultValue: "No reviews yet" })}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} locale={i18n.language} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-border-main p-2 text-text-dim transition hover:bg-bg-app disabled:opacity-30 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-text-dim">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="rounded-xl border border-border-main p-2 text-text-dim transition hover:bg-bg-app disabled:opacity-30 dark:hover:bg-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorMyReviewsPage;
