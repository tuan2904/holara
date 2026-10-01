import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  previousLabel = "Previous",
  nextLabel = "Next",
}) => {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#E06666]/35 hover:text-[#B64949] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-200"
      >
        <ChevronLeft size={16} /> {previousLabel}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {pageNumbers.map((page) => {
          const active = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-10 min-w-10 rounded-2xl px-3 text-sm font-semibold transition ${
                active
                  ? "bg-[#E06666] text-white shadow-md shadow-[#E06666]/20"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-200"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#E06666]/35 hover:text-[#B64949] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-200"
      >
        {nextLabel} <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
