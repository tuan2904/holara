import React from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

const RatingSummary = ({ summary, compact = false }) => {
  const { t } = useTranslation();

  if (!summary || summary.total_reviews === 0) {
    return (
      <div className="rounded-2xl border border-border-main bg-bg-surface p-4 text-center dark:bg-slate-800">
        <p className="text-sm text-text-dim">
          {t("review.summary.noReviews", { defaultValue: "No reviews yet" })}
        </p>
      </div>
    );
  }

  const { average_rating, total_reviews, distribution } = summary;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        <span className="text-sm font-bold text-text-main">{average_rating}</span>
        <span className="text-xs text-text-dim">({total_reviews})</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
      <div className="flex items-start gap-6">
        {/* Left: Big number */}
        <div className="text-center">
          <p className="text-4xl font-bold text-text-main">{average_rating}</p>
          <div className="mt-1 flex items-center justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${star <= Math.round(average_rating) ? "fill-amber-400 text-amber-400" : "fill-none text-slate-300 dark:text-slate-600"}`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-text-dim">
            {total_reviews} {t("review.summary.reviews", { defaultValue: "reviews" })}
          </p>
        </div>

        {/* Right: Distribution bars */}
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const pct = total_reviews > 0 ? (count / total_reviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-xs font-medium text-text-dim">{star}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-6 text-right text-xs text-text-dim">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingSummary;
