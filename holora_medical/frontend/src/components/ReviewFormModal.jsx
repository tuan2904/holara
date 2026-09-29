import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, X, Send, Eye, EyeOff } from "lucide-react";

const ReviewFormModal = ({ isOpen, onClose, onSubmit, doctorName, initialData = null }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(initialData?.title || "");
  const [comment, setComment] = useState(initialData?.comment || "");
  const [isAnonymous, setIsAnonymous] = useState(initialData?.is_anonymous || false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      setError(t("review.form.ratingRequired", { defaultValue: "Please select a rating" }));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ rating, title: title.trim() || null, comment: comment.trim() || null, is_anonymous: isAnonymous });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("review.form.error", { defaultValue: "Failed to submit review" }));
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = [
    t("review.form.rating1", { defaultValue: "Poor" }),
    t("review.form.rating2", { defaultValue: "Fair" }),
    t("review.form.rating3", { defaultValue: "Good" }),
    t("review.form.rating4", { defaultValue: "Very Good" }),
    t("review.form.rating5", { defaultValue: "Excellent" }),
  ];

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-main">
              {initialData ? t("review.form.editTitle", { defaultValue: "Edit Review" }) : t("review.form.title", { defaultValue: "Rate Your Doctor" })}
            </h3>
            {doctorName && (
              <p className="mt-1 text-sm text-text-dim">Dr. {doctorName}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-text-dim transition hover:bg-bg-app hover:text-text-main dark:hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Star Rating */}
          <div>
            <label className="text-sm font-semibold text-text-main">
              {t("review.form.ratingLabel", { defaultValue: "Rating" })} <span className="text-red-500">*</span>
            </label>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="rounded-lg p-1 transition hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition ${star <= activeRating ? "fill-amber-400 text-amber-400" : "fill-none text-slate-300 dark:text-slate-600"}`}
                  />
                </button>
              ))}
              {activeRating > 0 && (
                <span className="ml-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                  {ratingLabels[activeRating - 1]}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-text-main">
              {t("review.form.titleLabel", { defaultValue: "Title" })}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder={t("review.form.titlePlaceholder", { defaultValue: "Summarize your experience..." })}
              className="mt-1 block w-full rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main placeholder-text-dim outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 dark:bg-slate-700"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-semibold text-text-main">
              {t("review.form.commentLabel", { defaultValue: "Comment" })}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={t("review.form.commentPlaceholder", { defaultValue: "Share details about your experience with this doctor..." })}
              className="mt-1 block w-full resize-none rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main placeholder-text-dim outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 dark:bg-slate-700"
            />
          </div>

          {/* Anonymous Toggle */}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-main bg-bg-app p-3 transition hover:border-rose-300 dark:bg-slate-700">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="sr-only"
            />
            <div className={`flex h-6 w-11 items-center rounded-full transition ${isAnonymous ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-600"}`}>
              <div className={`h-5 w-5 rounded-full bg-white shadow transition ${isAnonymous ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <div className="flex items-center gap-2">
              {isAnonymous ? <EyeOff className="h-4 w-4 text-rose-500" /> : <Eye className="h-4 w-4 text-text-dim" />}
              <span className="text-sm font-medium text-text-main">
                {t("review.form.anonymous", { defaultValue: "Post anonymously" })}
              </span>
            </div>
          </label>

          {/* Error */}
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border-main px-4 py-2.5 text-sm font-medium text-text-dim transition hover:bg-bg-app dark:hover:bg-slate-700"
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </button>
            <button
              type="submit"
              disabled={submitting || rating < 1}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting
                ? t("common.submitting", { defaultValue: "Submitting..." })
                : initialData
                  ? t("review.form.update", { defaultValue: "Update" })
                  : t("review.form.submit", { defaultValue: "Submit Review" })
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewFormModal;
