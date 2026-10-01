import React from "react";
import { useTranslation } from "react-i18next";
import { Star, User } from "lucide-react";

const formatDate = (value, locale) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return `${value}`;
  return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const Stars = ({ rating, size = "h-4 w-4" }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`${size} ${star <= rating ? "fill-amber-400 text-amber-400" : "fill-none text-slate-300 dark:text-slate-600"}`}
      />
    ))}
  </div>
);

const ReviewCard = ({ review, showDoctor = false, locale = "vi" }) => {
  const { t } = useTranslation();
  const isAnonymous = review.is_anonymous;

  return (
    <div className="rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm transition hover:shadow-md dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {isAnonymous ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <User className="h-5 w-5 text-slate-400" />
            </div>
          ) : review.patient_avatar ? (
            <img src={review.patient_avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
              <span className="text-sm font-bold text-rose-500">
                {(review.patient_name || "?").charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-text-main">
              {isAnonymous ? t("review.card.anonymous", { defaultValue: "Anonymous" }) : (review.patient_name || "—")}
            </p>
            <p className="text-xs text-text-dim">{formatDate(review.created_at, locale)}</p>
          </div>
        </div>

        <Stars rating={review.rating} />
      </div>

      {showDoctor && review.doctor_name && (
        <p className="mt-2 text-xs text-text-dim">
          → Dr. {review.doctor_name} {review.doctor_code && <span className="opacity-60">({review.doctor_code})</span>}
        </p>
      )}

      {review.title && (
        <p className="mt-3 text-sm font-semibold text-text-main">{review.title}</p>
      )}
      {review.comment && (
        <p className="mt-1 text-sm leading-relaxed text-text-dim">{review.comment}</p>
      )}

      {review.status && review.status !== "approved" && (
        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          review.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          : review.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
        }`}>
          {review.status}
        </span>
      )}
    </div>
  );
};

export { Stars };
export default ReviewCard;
