import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, CalendarDays, CheckCircle2, Clock3, Edit3,
  Loader2, Plus, RefreshCw, Save, Sparkles, Trash2, X,
} from "lucide-react";
import { scheduleService } from "../../services/appointmentService";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";

/* ── Helpers ─────────────────────────────── */
const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const getMinDate = () => new Date().toISOString().slice(0, 10);

const formatDate = (raw, lang = "vi") => {
  if (!raw) return "—";
  const d = new Date(raw);
  return d.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
    weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const formatTime = (t) => {
  if (!t) return "—";
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
};

/* ── Skeleton ──────────────────────────────── */
const SkeletonHero = () => (
  <div className="animate-pulse rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 md:p-10">
    <div className="h-3 w-24 rounded bg-slate-700" />
    <div className="mt-4 h-8 w-64 rounded bg-slate-700" />
    <div className="mt-3 h-4 w-96 rounded bg-slate-700" />
    <div className="mt-6 grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/5" />)}
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-5 dark:bg-slate-800">
    <div className="h-5 w-2/5 rounded bg-slate-200 dark:bg-slate-700" />
    <div className="mt-3 h-4 w-3/5 rounded bg-slate-200 dark:bg-slate-700" />
    <div className="mt-3 flex gap-2">
      <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

/* ══════════════════════════════════════════════
   DoctorSchedulePage — Doctor Zone (cyan theme)
   ══════════════════════════════════════════════ */
const DoctorSchedulePage = () => {
  const { role, doctorId: authDoctorId } = useAuth();
  const { t, i18n } = useTranslation();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* form */
  const [editId, setEditId] = useState(null);
  const [workDate, setWorkDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [deleteId, setDeleteId] = useState(null);

  /* ── Fetch ── */
  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const doctorId = authDoctorId || "";
      const res = await scheduleService.getDoctorSchedules(doctorId, "", "");
      setSchedules(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || t("doctor.schedulePage.loadError", { defaultValue: "Failed to load schedules" }));
    } finally {
      setLoading(false);
    }
  }, [authDoctorId, t]);

  useEffect(() => {
    if (role === "doctor") fetchSchedules();
  }, [role, fetchSchedules]);

  /* ── Form ── */
  const resetForm = () => {
    setEditId(null);
    setWorkDate("");
    setStartTime("08:00");
    setEndTime("17:00");
    setSlotDuration(30);
  };

  const handleEditClick = (shift) => {
    setEditId(shift.id);
    setWorkDate(shift.work_date ? new Date(shift.work_date).toISOString().slice(0, 10) : "");
    setStartTime(formatTime(shift.start_time));
    setEndTime(formatTime(shift.end_time));
    setSlotDuration(shift.slot_duration || 30);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!workDate || !startTime || !endTime) {
      setError(t("doctor.schedulePage.validationMissing", { defaultValue: "Please fill in all fields" }));
      return;
    }
    if (startTime >= endTime) {
      setError(t("doctor.schedulePage.validationRange", { defaultValue: "Start time must be before end time" }));
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
        setSuccessMessage(t("doctor.schedulePage.updateSuccess", { defaultValue: "Schedule updated" }));
      } else {
        await scheduleService.createSchedule({
          ...(authDoctorId ? { doctor_id: authDoctorId } : {}),
          schedules: [{ work_date: workDate, start_time: startTime, end_time: endTime, slot_duration: slotDuration }],
        });
        setSuccessMessage(t("doctor.schedulePage.createSuccess", { defaultValue: "Schedule created" }));
      }
      resetForm();
      await fetchSchedules();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.response?.data?.error || t("doctor.schedulePage.saveError", { defaultValue: "Failed to save" }));
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
      setSuccessMessage(t("doctor.schedulePage.deleteSuccess", { defaultValue: "Schedule deleted" }));
      await fetchSchedules();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.response?.data?.error || t("doctor.schedulePage.deleteError", { defaultValue: "Failed to delete" }));
    } finally {
      setDeleteId(null);
    }
  };

  /* ── Stats ── */
  const stats = useMemo(() => {
    const activeCount = schedules.filter((s) => s.status === "active").length;
    const totalBlocks = schedules.reduce((sum, s) => {
      const st = formatTime(s.start_time);
      const en = formatTime(s.end_time);
      const [sh, sm] = st.split(":").map(Number);
      const [eh, em] = en.split(":").map(Number);
      const dur = (eh * 60 + em) - (sh * 60 + sm);
      return sum + Math.max(0, Math.floor(dur / Number(s.slot_duration || 30)));
    }, 0);
    return { total: schedules.length, active: activeCount, blocks: totalBlocks };
  }, [schedules]);

  const inputCls =
    "w-full rounded-xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-cyan-500 dark:bg-slate-900";

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* ── Hero ── */}
      {loading ? (
        <SkeletonHero />
      ) : (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white shadow-lg md:p-10">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl" />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                {t("doctor.zone", { defaultValue: "Doctor Zone" })}
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                {t("doctor.schedulePage.title", { defaultValue: "Work Schedule" })}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                {t("doctor.schedulePage.description", { defaultValue: "Manage your availability and time slots for patient appointments." })}
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                {t("doctor.schedulePage.summaryTitle", { defaultValue: "Summary" })}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-slate-400">{t("doctor.schedulePage.totalLabel", { defaultValue: "Total" })}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
                  <p className="text-xs text-slate-400">{t("doctor.schedulePage.activeLabel", { defaultValue: "Active" })}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-cyan-400">{stats.blocks}</p>
                  <p className="text-xs text-slate-400">{t("doctor.schedulePage.blocksLabel", { defaultValue: "Slots" })}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Alerts ── */}
      {successMessage && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* ── Main: Form + List ── */}
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">

        {/* ── Sidebar Form ── */}
        <aside className="rounded-2xl border border-border-main bg-bg-surface p-6 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between gap-3 border-b border-border-main pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-text-main">
                {editId
                  ? <Edit3 className="h-5 w-5 text-amber-500" />
                  : <Plus className="h-5 w-5 text-cyan-500" />}
                {editId
                  ? t("doctor.schedulePage.editFormTitle", { defaultValue: "Edit Shift" })
                  : t("doctor.schedulePage.createFormTitle", { defaultValue: "New Shift" })}
              </h2>
              <p className="mt-1 text-sm text-text-dim">
                {t("doctor.schedulePage.formDescription", { defaultValue: "Set your working hours" })}
              </p>
            </div>
            {editId && (
              <button type="button" onClick={resetForm}
                className="inline-flex items-center gap-1 rounded-xl border border-border-main px-3 py-2 text-xs font-semibold text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700">
                <X className="h-3.5 w-3.5" /> {t("common.cancel", { defaultValue: "Cancel" })}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitSchedule} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                {t("doctor.schedulePage.workDate", { defaultValue: "Work Date" })}
              </label>
              <input type="date" required min={getMinDate()} className={inputCls}
                value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-main">
                  {t("doctor.schedulePage.startTime", { defaultValue: "Start" })}
                </label>
                <input type="time" required className={inputCls}
                  value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-text-main">
                  {t("doctor.schedulePage.endTime", { defaultValue: "End" })}
                </label>
                <input type="time" required className={inputCls}
                  value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                {t("doctor.schedulePage.slotDuration", { defaultValue: "Slot Duration" })}
              </label>
              <select className={inputCls} value={slotDuration}
                onChange={(e) => setSlotDuration(Number.parseInt(e.target.value, 10))}>
                <option value={15}>15 {t("common.minutes", { defaultValue: "min" })}</option>
                <option value={30}>30 {t("common.minutes", { defaultValue: "min" })}</option>
                <option value={45}>45 {t("common.minutes", { defaultValue: "min" })}</option>
                <option value={60}>60 {t("common.minutes", { defaultValue: "min" })}</option>
              </select>
            </div>

            {/* Preview */}
            <div className="rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.2em] text-text-dim">
                {t("doctor.schedulePage.previewTitle", { defaultValue: "Preview" })}
              </p>
              <div className="mt-3 space-y-2 text-sm text-text-main">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-cyan-500" />
                  {workDate ? formatDate(workDate, i18n.language) : t("doctor.schedulePage.noDateSelected", { defaultValue: "No date selected" })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-cyan-500" />
                  {startTime || "—"} – {endTime || "—"}
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                editId ? "bg-amber-600 hover:bg-amber-700" : "bg-cyan-600 hover:bg-cyan-700"
              }`}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editId
                ? t("doctor.schedulePage.saveChanges", { defaultValue: "Save Changes" })
                : t("doctor.schedulePage.publishAction", { defaultValue: "Publish Schedule" })}
            </button>
          </form>
        </aside>

        {/* ── Schedule List ── */}
        <section className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between gap-3 border-b border-border-main bg-bg-app px-6 py-4 dark:bg-slate-900">
            <div>
              <h2 className="text-base font-bold text-text-main">
                {t("doctor.schedulePage.listTitle", { defaultValue: "Your Shifts" })}
              </h2>
              <p className="mt-1 text-sm text-text-dim">
                {t("doctor.schedulePage.listDescription", { defaultValue: "All upcoming and past work shifts" })}
              </p>
            </div>
            <button type="button" onClick={fetchSchedules}
              className="inline-flex items-center gap-2 rounded-xl border border-border-main px-3 py-2 text-xs font-semibold text-text-main transition hover:bg-bg-surface dark:hover:bg-slate-800">
              <RefreshCw className="h-3.5 w-3.5" /> {t("common.refresh", { defaultValue: "Refresh" })}
            </button>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : schedules.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-main bg-bg-app px-6 py-14 text-center dark:bg-slate-900">
                <CalendarDays className="h-12 w-12 text-text-dim" />
                <p className="mt-4 text-sm font-medium text-text-main">
                  {t("doctor.schedulePage.emptyTitle", { defaultValue: "No shifts yet" })}
                </p>
                <p className="mt-1 max-w-sm text-sm text-text-dim">
                  {t("doctor.schedulePage.emptyDescription", { defaultValue: "Create your first shift using the form on the left." })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((shift) => (
                  <article key={shift.id}
                    className={`relative overflow-hidden rounded-2xl border p-5 transition ${
                      editId === shift.id
                        ? "border-amber-300 bg-amber-50 shadow-sm dark:border-amber-700 dark:bg-amber-950/20"
                        : "border-border-main bg-bg-surface hover:shadow-sm dark:bg-slate-800"
                    }`}>
                    {/* left accent */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${shift.status === "active" ? "bg-cyan-500" : "bg-slate-400"}`} />

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="ml-2 space-y-3">
                        <div>
                          <h3 className="text-base font-bold text-text-main sm:text-lg">
                            {formatDate(shift.work_date, i18n.language)}
                          </h3>
                          <p className="mt-1 text-sm text-text-dim">
                            {t("doctor.schedulePage.timeRangeLabel", { defaultValue: "Hours" })}:{" "}
                            <span className="font-semibold text-text-main">
                              {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300">
                            {shift.slot_duration}{t("common.minutes", { defaultValue: "min" })} / slot
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${STATUS_STYLES[shift.status] || STATUS_STYLES.inactive}`}>
                            {shift.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:flex-col">
                        <button type="button" onClick={() => handleEditClick(shift)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/20">
                          <Edit3 className="h-3.5 w-3.5" /> {t("doctor.schedulePage.editAction", { defaultValue: "Edit" })}
                        </button>
                        <button type="button" onClick={() => setDeleteId(shift.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20">
                          <Trash2 className="h-3.5 w-3.5" /> {t("doctor.schedulePage.deleteAction", { defaultValue: "Delete" })}
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

      {/* ── Delete Confirmation ── */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title={t("doctor.schedulePage.confirmDelete", { defaultValue: "Delete this shift?" })}
        description={t("doctor.schedulePage.confirmDeleteDesc", { defaultValue: "This action cannot be undone. The shift will be permanently removed." })}
        badgeLabel={t("doctor.zone", { defaultValue: "Doctor Zone" })}
        tone="danger"
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        closeLabel={t("common.close", { defaultValue: "Close" })}
        onConfirm={() => handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};

export default DoctorSchedulePage;
