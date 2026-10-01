import React from "react";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = ({ variant = "compact", className = "" }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || "vi").toLowerCase();
  const isVietnamese = currentLanguage.startsWith("vi");

  const toggleLanguage = (lng) => {
    if (lng === currentLanguage) return;
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  if (variant === "menu") {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition-colors dark:border-slate-700 dark:bg-slate-800 ${className}`.trim()}
      >
        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-200">
          <Globe className="h-4 w-4 shrink-0 text-[#E06666]" />
          <span className="font-medium">{t("common.language") || "Language"}</span>
        </div>

        <div className="flex items-center rounded-full bg-gray-100 p-1 dark:bg-slate-700">
          <button
            type="button"
            onClick={() => toggleLanguage("vi")}
            className={`min-w-10 rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E06666]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800 ${
              isVietnamese
                ? "bg-[#E06666] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-slate-100"
            }`}
          >
            VI
          </button>
          <button
            type="button"
            onClick={() => toggleLanguage("en")}
            className={`min-w-10 rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E06666]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800 ${
              !isVietnamese
                ? "bg-[#E06666] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-slate-100"
            }`}
          >
            EN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm dark:border-slate-600 dark:bg-slate-800 ${className}`.trim()}>
      <button
        type="button"
        onClick={() => toggleLanguage("vi")}
        className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E06666]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800 ${
          isVietnamese
            ? "bg-[#E06666] text-white shadow-sm"
            : "text-gray-600 hover:text-[#E06666] dark:text-slate-300 dark:hover:text-slate-100"
        }`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => toggleLanguage("en")}
        className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E06666]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800 ${
          !isVietnamese
            ? "bg-[#E06666] text-white shadow-sm"
            : "text-gray-600 hover:text-[#E06666] dark:text-slate-300 dark:hover:text-slate-100"
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
