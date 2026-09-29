import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { scheduleService } from "../../services/appointmentService";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

const getMinDate = () => new Date().toISOString().slice(0, 10);

const formatDate = (value, locale) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatTime = (value) => {
  if (!value) return "-";
  return `${value}`.slice(0, 5);
};

const DoctorSchedulePage = () => {
  const { role, user } = useAuth();
  const authDoctorId = user?.doctor_id || user?.doctorId || null;
  const { t, i18n } = useTranslation();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editId, setEditId] = useState(null);
  const [workDate, setWorkDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [deleteId, setDeleteId] = useState(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await scheduleService.getDoctorSchedules(authDoctorId, "", "");
      setSchedules(data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.response?.data?.error || t("doctor.schedulePage.loadError"));
    } finally {
      setLoading(false);
    }
  }, [authDoctorId, t]);

  useEffect(() => {
    if (role === "doctor") {
      fetchSchedules();
    }
  }, [authDoctorId, role, fetchSchedules]);

  const resetForm = () => {
    setEditId(null);
    setWorkDate("");
    setStartTime("08:00");
    setEndTime("12:00");
    setSlotDuration(30);
  };

  const handleEditClick = (shift) => {
    setSuccessMessage("");
    setError("");
    setEditId(shift.id);
    setWorkDate(new Date(shift.work_date).toISOString().split("T")[0]);
    setStartTime(formatTime(shift.start_time));
    setEndTime(formatTime(shift.end_time));
    setSlotDuration(shift.slot_duration);
  };

  const handleSubmitSchedule = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!workDate || !startTime || !endTime) {
      setError(t("doctor.schedulePage.validationMissing"));
      return;
    }

    if (startTime >= endTime) {
      setError(t("doctor.schedulePage.validationRange"));
      return;
    }

    try {
      setSubmitting(true);
      if (editId) {
        await scheduleService.updateSchedule(editId, {
          work_date: workDate,
          start_time: startTime,
          end_time: endTime,
          slot_duration: slotDuration,
          status: "active",
        });
        setSuccessMessage(t("doctor.schedulePage.updateSuccess"));
      } else {
        await scheduleService.createSchedule({
          ...(authDoctorId ? { doctor_id: authDoctorId } : {}),
          schedules: [
            {
              work_date: workDate,
              start_time: startTime,
              end_time: endTime,
              slot_duration: slotDuration,
            },
          ],
        });
        setSuccessMessage(t("doctor.schedulePage.createSuccess"));
      }

      resetForm();
      await fetchSchedules();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.response?.data?.error || t("doctor.schedulePage.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError("");
      setSuccessMessage("");
      await scheduleService.deleteSchedule(id);
      if (editId === id) resetForm();
      setSuccessMessage(t("doctor.schedulePage.deleteSuccess"));
      await fetchSchedules();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.response?.data?.error || t("doctor.schedulePage.deleteError"));
    } finally {
      setDeleteId(null);
    }
  };

  const stats = useMemo(() => {
    const activeCount = schedules.filter((shift) => shift.status === "active").length;
    const totalBlocks = schedules.reduce((sum, shift) => {
      const start = formatTime(shift.start_time);
      const end = formatTime(shift.end_time);
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);
      const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
      return sum + Math.max(0, Math.floor(duration / Number(shift.slot_duration || 30)));
    }, 0);

    return {
      total: schedules.length,
      active: activeCount,
      blocks: totalBlocks,
    };
  }, [schedules]);

  const inputClassName =
    "w-full rounded-xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666] dark:bg-slate-900";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E06666] to-[#C04444] p-8 text-white shadow-lg md:p-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">{t("doctor.zone")}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {t("doctor.schedulePage.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              {t("doctor.schedulePage.description")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">{t("doctor.schedulePage.summaryTitle")}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-white/70">{t("doctor.schedulePage.totalLabel")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-white/70">{t("doctor.schedulePage.activeLabel")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.blocks}</p>
                <p className="text-xs text-white/70">{t("doctor.schedulePage.blocksLabel")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {successMessage && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-border-main bg-bg-surface p-6 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between gap-3 border-b border-border-main pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-text-main">
                {editId ? <Edit3 className="h-5 w-5 text-[#E06666]" /> : <Plus className="h-5 w-5 text-[#E06666]" />}
                {editId ? t("doctor.schedulePage.editFormTitle") : t("doctor.schedulePage.createFormTitle")}
              </h2>
              <p className="mt-1 text-sm text-text-dim">
                {t("doctor.schedulePage.formDescription")}
              </p>
            </div>

            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1 rounded-xl border border-border-main px-3 py-2 text-xs font-semibold text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700"
              >
                <X className="h-3.5 w-3.5" /> {t("common.cancel")}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitSchedule} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">{t("doctor.schedulePage.workDate")}</label>
              <input
                type="date"
                required
                min={getMinDate()}
                className={inputClassName}
                value={workDate}
                onChange={(event) => setWorkDate(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-main">{t("doctor.schedulePage.startTime")}</label>
                <input
                  type="time"
                  required
                  className={inputClassName}
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-main">{t("doctor.schedulePage.endTime")}</label>
                <input
                  type="time"
                  required
                  className={inputClassName}
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">{t("doctor.schedulePage.slotDuration")}</label>
              <select
                className={inputClassName}
                value={slotDuration}
                onChange={(event) => setSlotDuration(Number.parseInt(event.target.value, 10))}
              >
                <option value={30}>{t("doctor.schedulePage.slot30Minutes")}</option>
                <option value={60}>{t("doctor.schedulePage.slot60Minutes")}</option>
              </select>
            </div>

            <div className="rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("doctor.schedulePage.previewTitle")}</p>
              <div className="mt-3 space-y-2 text-sm text-text-main">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#E06666]" />
                  {workDate ? formatDate(workDate, i18n.language) : t("doctor.schedulePage.noDateSelected")}
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#E06666]" />
                  {startTime} - {endTime}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                editId ? "bg-amber-600 hover:bg-amber-700" : "bg-[#E06666] hover:bg-[#D55555]"
              }`}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editId ? t("doctor.schedulePage.saveChanges") : t("doctor.schedulePage.publishAction")}
            </button>
          </form>
        </aside>

        <section className="overflow-hidden rounded-3xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between gap-3 border-b border-border-main bg-bg-app px-6 py-4 dark:bg-slate-900">
            <div>
              <h2 className="text-base font-bold text-text-main">{t("doctor.schedulePage.listTitle")}</h2>
              <p className="mt-1 text-sm text-text-dim">{t("doctor.schedulePage.listDescription")}</p>
            </div>

            <button
              type="button"
              onClick={fetchSchedules}
              className="inline-flex items-center gap-2 rounded-xl border border-border-main px-3 py-2 text-xs font-semibold text-text-main transition hover:bg-bg-surface dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" /> {t("common.refresh")}
            </button>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-text-dim">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("doctor.schedulePage.syncing")}
                </span>
              </div>
            ) : schedules.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-main bg-bg-app px-6 py-14 text-center dark:bg-slate-900">
                <CalendarDays className="h-12 w-12 text-text-dim" />
                <p className="mt-4 text-sm font-medium text-text-main">{t("doctor.schedulePage.emptyTitle")}</p>
                <p className="mt-1 max-w-sm text-sm text-text-dim">
                  {t("doctor.schedulePage.emptyDescription")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((shift) => (
                  <article
                    key={shift.id}
                    className={`relative overflow-hidden rounded-2xl border p-5 transition ${
                      editId === shift.id
                        ? "border-amber-300 bg-amber-50 shadow-sm dark:border-amber-700 dark:bg-amber-950/20"
                        : "border-border-main bg-bg-surface hover:shadow-sm dark:bg-slate-800"
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${shift.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="ml-2 space-y-3">
                        <div>
                          <h3 className="text-lg font-bold text-text-main">{formatDate(shift.work_date, i18n.language)}</h3>
                          <p className="mt-1 text-sm text-text-dim">
                            {t("doctor.schedulePage.timeRangeLabel")}: <span className="font-semibold text-text-main">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#fff4f2] px-3 py-1 text-xs font-semibold text-[#E06666] dark:bg-red-950/20">
                            Slot {shift.slot_duration}m
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${STATUS_STYLES[shift.status] || STATUS_STYLES.inactive}`}>
                            {shift.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:flex-col">
                        <button
                          type="button"
                          onClick={() => handleEditClick(shift)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/20"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> {t("doctor.schedulePage.editAction")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(shift.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> {t("doctor.schedulePage.deleteAction")}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title={t("doctor.schedulePage.confirmDelete")}
        description={t("doctor.schedulePage.emptyDescription")}
        badgeLabel={t("doctor.zone")}
        tone="danger"
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        closeLabel={t("common.close")}
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};

export default DoctorSchedulePage;
