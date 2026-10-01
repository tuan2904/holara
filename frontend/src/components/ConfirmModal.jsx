import React, { useEffect } from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";

const ConfirmModal = ({
  isOpen,
  title,
  description,
  badgeLabel,
  icon,
  tone = "default",
  confirmLabel,
  cancelLabel,
  closeLabel,
  onConfirm,
  onClose,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toneStyles = {
    default: {
      header: "from-[#FFF1EF] via-[#FFE8E2] to-[#FDE4DA] dark:from-[#2A1E28] dark:via-[#2B2134] dark:to-[#1C2A40]",
      iconWrap: "bg-[#E06666] text-white shadow-[#E06666]/25 dark:bg-[#F08A8A] dark:text-[#2B1F28] dark:shadow-[#F08A8A]/20",
      badge: "border-[#E9D1CB] bg-[#FFF7F5] text-[#B45555] dark:border-slate-700 dark:bg-slate-800 dark:text-[#F3A3A3]",
      confirm: "bg-[#E06666] text-white hover:bg-[#D55555]",
    },
    danger: {
      header: "from-[#FFF0F0] via-[#FFE1E1] to-[#FFD6D6] dark:from-[#311B1B] dark:via-[#371F26] dark:to-[#231820]",
      iconWrap: "bg-red-600 text-white shadow-red-500/25 dark:bg-red-400 dark:text-[#2C1111] dark:shadow-red-400/20",
      badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300",
      confirm: "bg-red-600 text-white hover:bg-red-700",
    },
    info: {
      header: "from-[#EEF5FF] via-[#E8F1FF] to-[#E5EDFF] dark:from-[#18253A] dark:via-[#1A2940] dark:to-[#152338]",
      iconWrap: "bg-blue-600 text-white shadow-blue-500/25 dark:bg-blue-400 dark:text-[#10233D] dark:shadow-blue-400/20",
      badge: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300",
      confirm: "bg-blue-600 text-white hover:bg-blue-700",
    },
  };

  const toneStyle = toneStyles[tone] || toneStyles.default;
  const IconComponent = icon || AlertTriangle;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-[#111827] dark:shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-r ${toneStyle.header}`} />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-500 transition hover:text-slate-800 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-white"
          aria-label={closeLabel}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${toneStyle.iconWrap}`}>
            <IconComponent className="h-7 w-7" />
          </div>

          {badgeLabel ? (
            <p className={`mt-5 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneStyle.badge}`}>
              {badgeLabel}
            </p>
          ) : null}

          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[28px]">
            {title}
          </h2>

          {description ? (
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
              {description}
            </p>
          ) : null}

          {children ? <div className="mt-6">{children}</div> : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold transition sm:w-auto sm:min-w-[210px] ${toneStyle.confirm}`}
            >
              {confirmLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto sm:min-w-[150px]"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;