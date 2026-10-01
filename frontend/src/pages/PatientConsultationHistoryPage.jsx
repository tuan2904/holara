import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarDays,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { consultationService } from "../services/consultationService";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  in_progress: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const STATUS_LABEL_KEYS = {
  pending: "patient.consultationsPage.status.pending",
  in_progress: "patient.consultationsPage.status.inProgress",
  completed: "patient.consultationsPage.status.completed",
};

const formatDateTime = (value, locale) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return `${value}`;
  return d.toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PatientConsultationHistoryPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await consultationService.getPatientHistory();
      setConsultations(res.data || []);
    } catch (err) {
      console.error("Failed to fetch consultations:", err);
      setError(err.response?.data?.message || err.message || t("patient.consultationsPage.errors.loadHistory"));
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const pending = consultations.filter((c) => c.status === "pending").length;
    const inProgress = consultations.filter((c) => c.status === "in_progress").length;
    const completed = consultations.filter((c) => c.status === "completed").length;
    return {
      total: consultations.length,
      pending,
      inProgress,
      completed,
    };
  }, [consultations]);

  const getStatusLabel = (status) => t(STATUS_LABEL_KEYS[status] || "patient.consultationsPage.status.unknown");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white shadow-lg sm:p-8 md:p-10">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{t("patient.zone")}</p>
            <h1 className="mt-2 text-xl font-bold tracking-tight sm:mt-3 sm:text-3xl md:text-4xl">
              {t("patient.consultationsPage.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              {t("patient.consultationsPage.heroDescription")}
            </p>
            <Link
              to="/patient/consultations/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              <Plus className="h-4 w-4" />
              {t("patient.consultationsPage.newRequestAction")}
            </Link>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Sparkles className="h-4 w-4" />
              {t("patient.consultationsPage.summaryTitle")}
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-slate-400">{t("patient.consultationsPage.totalLabel")}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-2xl border border-border-main bg-bg-surface p-3 shadow-sm sm:p-5 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-medium text-text-dim sm:text-sm">{t("patient.consultationsPage.pendingLabel")}</p>
            <CalendarDays className="hidden h-5 w-5 flex-shrink-0 text-amber-500 sm:block" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-text-main sm:mt-2 sm:text-3xl">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-3 shadow-sm sm:p-5 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-medium text-text-dim sm:text-sm">{t("patient.consultationsPage.inProgressLabel")}</p>
            <MessageSquare className="hidden h-5 w-5 flex-shrink-0 text-sky-500 sm:block" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-text-main sm:mt-2 sm:text-3xl">{stats.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-3 shadow-sm sm:p-5 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-medium text-text-dim sm:text-sm">{t("patient.consultationsPage.completedLabel")}</p>
            <Stethoscope className="hidden h-5 w-5 flex-shrink-0 text-emerald-500 sm:block" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-text-main sm:mt-2 sm:text-3xl">{stats.completed}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-main">{t("patient.consultationsPage.listTitle")}</h2>
            <p className="text-sm text-text-dim">{t("patient.consultationsPage.listDescription")}</p>
          </div>
          <button
            onClick={fetchHistory}
            className="inline-flex items-center gap-2 rounded-lg border border-border-main px-3 py-2 text-sm font-semibold text-text-main transition hover:bg-bg-app"
          >
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
          </button>
        </div>

        {error ? (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Mobile card list */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-dim sm:hidden">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("patient.consultationsPage.loading")}
          </div>
        ) : consultations.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-dim sm:hidden">{t("patient.consultationsPage.empty")}</p>
        ) : (
          <div className="divide-y divide-border-main/50 sm:hidden">
            {consultations.map((item) => (
              <div key={item.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 flex-1 text-sm font-semibold text-text-main">{item.chief_complaint}</p>
                  <span className={`inline-flex flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[item.status] || "bg-slate-100 text-slate-700"}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                <p className="text-xs text-text-dim">{item.doctor_name || t("patient.consultationsPage.unassignedDoctor")}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-dim">{formatDateTime(item.created_at, i18n.language)}</p>
                  <button
                    onClick={() => navigate(`/patient/consultations/${item.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {t("patient.consultationsPage.viewAction")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden overflow-x-auto px-2 pb-2 sm:block md:px-5 md:pb-5">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                <th className="px-3 py-4">{t("patient.consultationsPage.columns.reason")}</th>
                <th className="px-3 py-4">{t("patient.consultationsPage.columns.doctor")}</th>
                <th className="px-3 py-4">{t("patient.consultationsPage.columns.createdAt")}</th>
                <th className="px-3 py-4">{t("patient.consultationsPage.columns.status")}</th>
                <th className="px-3 py-4 text-right">{t("patient.consultationsPage.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("patient.consultationsPage.loading")}
                    </span>
                  </td>
                </tr>
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    {t("patient.consultationsPage.empty")}
                  </td>
                </tr>
              ) : (
                consultations.map((item) => (
                  <tr key={item.id} className="border-t border-border-main/70 text-sm">
                    <td className="px-3 py-4">
                      <p className="max-w-[320px] truncate font-semibold text-text-main" title={item.chief_complaint}>
                        {item.chief_complaint}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-text-main">
                      {item.doctor_name || t("patient.consultationsPage.unassignedDoctor")}
                    </td>
                    <td className="px-3 py-4 text-text-dim">{formatDateTime(item.created_at, i18n.language)}</td>
                    <td className="px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[item.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <button
                        onClick={() => navigate(`/patient/consultations/${item.id}`)}
                        className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {t("patient.consultationsPage.viewAction")}
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

export default PatientConsultationHistoryPage;

