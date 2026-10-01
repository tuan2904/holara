import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Building2, Calendar, CheckCircle, Clock, Download,
  FileText, Loader2, MapPin, Phone, Sparkles, Stethoscope,
  User, Video, XCircle, AlertCircle, MessageSquare, Activity,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import { consultationService } from "../services/consultationService";

/* ─────────── Design tokens (shared with list page) ────── */
const STATUS = {
  scheduled:   { color: "amber",   icon: Clock },
  confirmed:   { color: "emerald", icon: CheckCircle },
  checked_in:  { color: "sky",     icon: Activity },
  in_progress: { color: "blue",    icon: Activity },
  completed:   { color: "purple",  icon: CheckCircle },
  cancelled:   { color: "red",     icon: XCircle },
  no_show:     { color: "slate",   icon: XCircle },
};

const PILL = {
  amber:   "bg-amber-100/80 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/25 dark:text-amber-300 dark:ring-amber-700/40",
  emerald: "bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-700/40",
  sky:     "bg-sky-100/80 text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-900/25 dark:text-sky-300 dark:ring-sky-700/40",
  blue:    "bg-blue-100/80 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-900/25 dark:text-blue-300 dark:ring-blue-700/40",
  purple:  "bg-purple-100/80 text-purple-700 ring-1 ring-purple-200/60 dark:bg-purple-900/25 dark:text-purple-300 dark:ring-purple-700/40",
  red:     "bg-red-100/80 text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/25 dark:text-red-300 dark:ring-red-700/40",
  slate:   "bg-slate-100/80 text-slate-600 ring-1 ring-slate-200/60 dark:bg-slate-800/40 dark:text-slate-400 dark:ring-slate-600/40",
};

const GLASS = "backdrop-blur-xl bg-white/60 dark:bg-slate-900/50 border border-white/30 dark:border-slate-700/40 shadow-lg shadow-black/[0.03]";
const GLASS_CARD = `rounded-2xl ${GLASS}`;

/* ─────────── Helpers ───────────────────────────────────── */
const fmtDate = (d, lng) => d ? new Date(d).toLocaleDateString(lng === "vi" ? "vi-VN" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—";
const fmtDateShort = (d, lng) => d ? new Date(d).toLocaleDateString(lng === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (t) => { if (!t) return "—"; try { return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return "—"; } };
const fmtDateTime = (d, lng) => d ? new Date(d).toLocaleString(lng === "vi" ? "vi-VN" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const calcDuration = (s, e) => { if (!s || !e) return "—"; const m = Math.round((new Date(e) - new Date(s)) / 60000); return `${m} min`; };

/* ─────────── Skeleton ──────────────────────────────────── */
const Pulse = ({ className }) => <div className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/50 ${className}`} />;

/* ══════════════════════════════════════════════════════════
   DoctorAppointmentDetailPage
   Bento Grid · Glassmorphism · Progressive Disclosure
   ══════════════════════════════════════════════════════════ */
const DoctorAppointmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lng = i18n.language;

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [linkedConsultation, setLinkedConsultation] = useState(null);
  const [cancelModal, setCancelModal] = useState({ open: false, reason: "" });
  // Recurring
  const [recurringChildren, setRecurringChildren] = useState([]);
  const [showRecurring, setShowRecurring] = useState(false);
  const [cancellingSeries, setCancellingSeries] = useState(false);

  const sLabel = (status) => t(`doctor.appointmentDetail.status.${status === "checked_in" ? "checkedIn" : status === "in_progress" ? "inProgress" : status === "no_show" ? "noShow" : status}`, { defaultValue: status });

  /* ── Fetch ── */
  const fetchDetail = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await appointmentService.getAppointmentById(id);
      setAppointment(Array.isArray(data) ? data[0] : data?.data || data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("doctor.appointmentDetail.errors.loadFailed", { defaultValue: "Failed to load" }));
    } finally { setLoading(false); }
  }, [id, t]);

  useEffect(() => {
    fetchDetail();
    consultationService.getByAppointmentId(id)
      .then((res) => setLinkedConsultation(res.data || null))
      .catch(() => setLinkedConsultation(null));
  }, [fetchDetail, id]);

  // Fetch recurring children if needed
  useEffect(() => {
    if (showRecurring && appointment?.recurring_id) {
      appointmentService.getRecurringChildren(appointment.recurring_id).then(setRecurringChildren).catch(() => setRecurringChildren([]));
    }
  }, [showRecurring, appointment]);

  /* ── Status update ── */
  const handleUpdateStatus = async (newStatus, reason) => {
    setUpdatingStatus(true);
    try {
      await appointmentService.updateStatus(appointment.id, newStatus, reason);
      setAppointment((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("common.error", { defaultValue: "Update failed" }));
    } finally { setUpdatingStatus(false); }
  };

  const handleCancel = () => {
    handleUpdateStatus("cancelled", cancelModal.reason);
    setCancelModal({ open: false, reason: "" });
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <Pulse className="h-10 w-32" />
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 animate-pulse">
          <Pulse className="h-3 w-20 mb-4 !bg-slate-700" />
          <Pulse className="h-8 w-64 mb-3 !bg-slate-700" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[1,2,3,4].map(i => <Pulse key={i} className="h-16 !bg-white/5 !rounded-xl" />)}
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-5">
            <Pulse className="h-48 rounded-2xl" />
            <Pulse className="h-40 rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-5">
            <Pulse className="h-52 rounded-2xl" />
            <Pulse className="h-36 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate("/doctor/appointments")}
          className="inline-flex items-center gap-2 rounded-lg border border-border-main px-3 py-2 text-sm font-medium text-text-main transition hover:bg-bg-app">
          <ArrowLeft className="h-4 w-4" /> {t("common.back", { defaultValue: "Back" })}
        </button>
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-5 py-4 text-sm text-red-700 backdrop-blur dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  const a = appointment;
  const st = STATUS[a.status] || STATUS.scheduled;
  const StIcon = st.icon;

  return (
    <div className="mx-auto max-w-6xl space-y-5">

      {/* ── Back button ── */}
      <button onClick={() => navigate("/doctor/appointments")}
        className="inline-flex items-center gap-2 rounded-xl border border-border-main px-3.5 py-2 text-sm font-medium text-text-main transition hover:bg-bg-app">
        <ArrowLeft className="h-4 w-4" />
        {t("doctor.appointmentDetail.backToList", { defaultValue: "All Appointments" })}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-5 py-4 text-sm text-red-700 backdrop-blur dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* ── HERO: Glassmorphism appointment header ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900/40 p-6 text-white shadow-2xl sm:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE4YzEgMSAxIDMgMCA0bC0yIDJjLTEgMS0zIDEtNCAwbC0yLTJjLTEtMS0xLTMgMC00bDItMmMxLTEgMy0xIDQgMGwyIDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative">
          {/* Zone + Code */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> {t("doctor.zone", { defaultValue: "Doctor Zone" })}
            </p>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-slate-300">
              {a.appointment_code}
            </span>
          </div>

          {/* Title + Status */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("doctor.appointmentDetail.title", { defaultValue: "Appointment Details" })}
            </h1>
            <span className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold ${PILL[st.color] || ""}`}>
              <StIcon className="h-4 w-4" />
              {sLabel(a.status)}
            </span>
          </div>

          {/* Bento mini-stats (Progressive Disclosure — key info at a glance) */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Calendar, label: t("doctor.appointmentDetail.date", { defaultValue: "Date" }), value: fmtDateShort(a.appointment_date, lng) },
              { icon: Clock, label: t("doctor.appointmentDetail.time", { defaultValue: "Time" }), value: `${fmtTime(a.start_time)} – ${fmtTime(a.end_time)}` },
              { icon: User, label: t("doctor.appointmentDetail.patientName", { defaultValue: "Patient" }), value: a.patient_name || "—" },
              { icon: Video, label: t("doctor.appointmentDetail.type", { defaultValue: "Type" }), value: (a.appointment_type || "office").toUpperCase() },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <item.icon className="h-3 w-3 text-cyan-400" /> {item.label}
                </div>
                <p className="mt-1 text-sm font-bold text-white truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO GRID: Main content ── */}
      <div className="grid gap-5 lg:grid-cols-12">

        {/* ── LEFT COLUMN (8 cols) ── */}
        <div className="space-y-5 lg:col-span-8">

          {/* Recurring Series Info */}
          {a.recurring_id && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-800/30 dark:bg-blue-900/10 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">Lịch hẹn lặp lại (Recurring Series)</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-400 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  onClick={() => setShowRecurring((v) => !v)}
                >
                  {showRecurring ? "Ẩn chuỗi" : "Xem chuỗi"}
                </button>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-red-400 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                  disabled={cancellingSeries}
                  onClick={async () => {
                    if (!window.confirm("Bạn chắc chắn muốn huỷ toàn bộ chuỗi lịch này?")) return;
                    setCancellingSeries(true);
                    try {
                      await appointmentService.cancelRecurringSeries(a.recurring_id);
                      alert("Đã huỷ toàn bộ chuỗi lịch thành công.");
                      fetchDetail();
                    } catch {
                      alert("Huỷ chuỗi thất bại");
                    } finally {
                      setCancellingSeries(false);
                    }
                  }}
                >
                  Huỷ toàn bộ chuỗi
                </button>
              </div>
              {showRecurring && (
                <div className="mt-2">
                  <div className="text-xs mb-1 text-text-dim">Danh sách các lịch trong chuỗi:</div>
                  <div className="space-y-1">
                    {recurringChildren.length === 0 && <div className="text-xs text-text-dim">Không có lịch nào.</div>}
                    {recurringChildren.map(child => (
                      <div key={child.id} className="flex items-center gap-2 text-xs p-2 rounded border border-border-main bg-white dark:bg-slate-800">
                        <span className="font-mono text-sm text-blue-700">{child.appointment_code}</span>
                        <span>{fmtDate(child.appointment_date, lng)} {fmtTime(child.start_time)} - {fmtTime(child.end_time)}</span>
                        <span className="text-text-dim">{child.status}</span>
                        <button
                          className="ml-auto text-xs text-red-500 underline"
                          disabled={child.status === "cancelled"}
                          onClick={async () => {
                            if (!window.confirm("Huỷ lịch này?")) return;
                            await appointmentService.cancelRecurringChild(child.id);
                            setRecurringChildren((prev) => prev.map(c => c.id === child.id ? { ...c, status: "cancelled" } : c));
                          }}
                        >Huỷ lịch này</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Appointment Details Card */}
          <div className={`${GLASS_CARD} p-6`}>
            <h2 className="flex items-center gap-2 text-base font-bold text-text-main">
              <FileText className="h-5 w-5 text-cyan-500" />
              {t("doctor.appointmentDetail.appointmentInfo", { defaultValue: "Appointment Information" })}
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {/* Date */}
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 dark:bg-blue-900/20">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-text-dim">{t("doctor.appointmentDetail.date", { defaultValue: "Date" })}</p>
                  <p className="mt-0.5 text-sm font-semibold text-text-main">{fmtDate(a.appointment_date, lng)}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 dark:bg-emerald-900/20">
                  <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-text-dim">{t("doctor.appointmentDetail.time", { defaultValue: "Time" })}</p>
                  <p className="mt-0.5 text-sm font-semibold text-text-main">
                    {fmtTime(a.start_time)} — {fmtTime(a.end_time)}
                    <span className="ml-2 text-xs font-normal text-text-dim">({calcDuration(a.start_time, a.end_time)})</span>
                  </p>
                </div>
              </div>

              {/* Type */}
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100/80 dark:bg-cyan-900/20">
                  {a.appointment_type === "online" ? <Video className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> : <MapPin className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-text-dim">{t("doctor.appointmentDetail.type", { defaultValue: "Type" })}</p>
                  <p className={`mt-0.5 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    a.appointment_type === "online"
                      ? "bg-cyan-100/70 text-cyan-700 ring-1 ring-cyan-200/50 dark:bg-cyan-900/20 dark:text-cyan-300"
                      : "bg-slate-100/70 text-slate-600 ring-1 ring-slate-200/50 dark:bg-slate-800/40 dark:text-slate-400"
                  }`}>
                    {a.appointment_type || "office"}
                  </p>
                </div>
              </div>

              {/* Specialty */}
              {a.specialty_name && (
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100/80 dark:bg-rose-900/20">
                    <Stethoscope className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-text-dim">{t("doctor.appointmentDetail.specialty", { defaultValue: "Specialty" })}</p>
                    <p className="mt-0.5 text-sm font-semibold text-text-main">{a.specialty_name}</p>
                  </div>
                </div>
              )}
            </div>


            {/* Reason (Progressive Disclosure — expandable area) */}
            <div className="mt-5 rounded-xl border border-border-main/50 bg-bg-app/50 p-4 dark:bg-slate-800/50">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-dim mb-2">
                {t("doctor.appointmentDetail.reason", { defaultValue: "Reason for Visit" })}
              </p>
              <p className="text-sm leading-relaxed text-text-main">
                {a.reason || t("doctor.appointmentDetail.noReason", { defaultValue: "No reason provided" })}
              </p>
            </div>

            {/* Cancellation Policy Notice */}
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-400" />
              <span>
                <b>{t("doctor.appointmentDetail.cancellationPolicyTitle", { defaultValue: "Cancellation Policy:" })}</b> {t("doctor.appointmentDetail.cancellationPolicyDesc", { defaultValue: "Appointments can only be cancelled more than 2 hours before the scheduled time. If you attempt to cancel within 2 hours of the appointment, cancellation will not be allowed." })}
              </span>
            </div>

            {/* Cancellation reason */}
            {a.status === "cancelled" && a.cancellation_reason && (
              <div className="mt-4 rounded-xl border border-red-200/50 bg-red-50/50 p-4 dark:border-red-800/30 dark:bg-red-900/10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-red-500 mb-2">
                  {t("doctor.appointmentDetail.cancellationReason", { defaultValue: "Cancellation Reason" })}
                </p>
                <p className="text-sm leading-relaxed text-red-700 dark:text-red-400">{a.cancellation_reason}</p>
              </div>
            )}
          </div>

          {/* Patient Info Card */}
          <div className={`${GLASS_CARD} p-6`}>
            <h2 className="flex items-center gap-2 text-base font-bold text-text-main">
              <User className="h-5 w-5 text-cyan-500" />
              {t("doctor.appointmentDetail.patientInfo", { defaultValue: "Patient Information" })}
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 dark:bg-blue-900/20">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-text-dim">{t("doctor.appointmentDetail.patientName", { defaultValue: "Patient Name" })}</p>
                  <p className="mt-0.5 text-sm font-bold text-text-main">{a.patient_name || "—"}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 dark:bg-emerald-900/20">
                  <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-text-dim">{t("doctor.appointmentDetail.patientPhone", { defaultValue: "Phone" })}</p>
                  <p className="mt-0.5 text-sm font-semibold text-text-main">{a.patient_phone || "—"}</p>
                </div>
              </div>

              {a.branch_name && (
                <div className="flex gap-3 sm:col-span-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100/80 dark:bg-purple-900/20">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-text-dim">{t("doctor.appointmentDetail.branch", { defaultValue: "Branch" })}</p>
                    <p className="mt-0.5 text-sm font-semibold text-text-main">
                      {a.branch_name}
                      {a.branch_code && <span className="ml-1.5 text-xs font-normal text-text-dim">({a.branch_code})</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (4 cols) ── */}
        <div className="space-y-5 lg:col-span-4">

          {/* Quick Actions Card */}
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-text-main mb-4">
              <Activity className="h-4 w-4 text-cyan-500" />
              {t("doctor.appointmentDetail.actions.title", { defaultValue: "Actions" })}
            </h3>

            <div className="space-y-2.5">
              {/* Enter Room */}
              {a.appointment_type === "online" && ["scheduled", "confirmed"].includes(a.status) && (
                <button onClick={() => navigate(`/doctor/appointments/${a.id}/room`)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-cyan-500/20 transition hover:shadow-lg hover:shadow-cyan-500/30">
                  <Video className="h-5 w-5" />
                  {t("doctor.appointmentDetail.actions.enterRoom", { defaultValue: "Enter Online Room" })}
                </button>
              )}

              {/* Confirm */}
              {a.status === "scheduled" && (
                <button onClick={() => handleUpdateStatus("confirmed")}
                  disabled={updatingStatus}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-60">
                  <CheckCircle className="h-4 w-4" />
                  {updatingStatus ? t("common.processing", { defaultValue: "Processing..." }) : t("doctor.appointmentDetail.actions.confirm", { defaultValue: "Confirm Appointment" })}
                </button>
              )}

              {/* Complete */}
              {a.status === "confirmed" && (
                <button onClick={() => handleUpdateStatus("completed")}
                  disabled={updatingStatus}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-purple-500/20 transition hover:bg-purple-600 disabled:opacity-60">
                  <CheckCircle className="h-4 w-4" />
                  {updatingStatus ? t("common.processing", { defaultValue: "Processing..." }) : t("doctor.appointmentDetail.actions.complete", { defaultValue: "Mark Completed" })}
                </button>
              )}

              {/* Cancel */}
              {["scheduled", "confirmed"].includes(a.status) && (
                <button onClick={() => setCancelModal({ open: true, reason: "" })}
                  disabled={updatingStatus}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200/60 bg-red-50/60 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400 disabled:opacity-60">
                  <XCircle className="h-4 w-4" />
                  {t("doctor.appointmentDetail.actions.cancel", { defaultValue: "Cancel Appointment" })}
                </button>
              )}

              {/* Print */}
              <button onClick={() => window.print()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border-main px-4 py-3 text-sm font-semibold text-text-main transition hover:bg-bg-app">
                <Download className="h-4 w-4" />
                {t("doctor.appointmentDetail.actions.print", { defaultValue: "Print / Export" })}
              </button>
            </div>
          </div>

          {/* Timeline Card */}
          <div className={`${GLASS_CARD} p-5`}>
            <h3 className="flex items-center gap-2 text-sm font-bold text-text-main mb-4">
              <Clock className="h-4 w-4 text-cyan-500" />
              {t("doctor.appointmentDetail.timeline", { defaultValue: "Timeline" })}
            </h3>

            <div className="relative space-y-4 pl-5">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border-main/60" />

              {/* Created */}
              <div className="relative">
                <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-cyan-500 ring-4 ring-cyan-500/15" />
                <p className="text-[11px] font-semibold text-text-dim">{t("doctor.appointmentDetail.created", { defaultValue: "Created" })}</p>
                <p className="text-sm font-semibold text-text-main">{fmtDateTime(a.created_at, lng)}</p>
              </div>

              {/* Updated */}
              {a.updated_at && a.updated_at !== a.created_at && (
                <div className="relative">
                  <div className="absolute -left-5 top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/15" />
                  <p className="text-[11px] font-semibold text-text-dim">{t("doctor.appointmentDetail.updated", { defaultValue: "Last Updated" })}</p>
                  <p className="text-sm font-semibold text-text-main">{fmtDateTime(a.updated_at, lng)}</p>
                </div>
              )}

              {/* Current status */}
              <div className="relative">
                <div className={`absolute -left-5 top-1 h-2.5 w-2.5 rounded-full ring-4 ${
                  st.color === "emerald" ? "bg-emerald-500 ring-emerald-500/15" :
                  st.color === "purple" ? "bg-purple-500 ring-purple-500/15" :
                  st.color === "red" ? "bg-red-500 ring-red-500/15" :
                  "bg-slate-400 ring-slate-400/15"
                }`} />
                <p className="text-[11px] font-semibold text-text-dim">{t("doctor.appointmentDetail.currentStatus", { defaultValue: "Current Status" })}</p>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${PILL[st.color] || ""}`}>
                  <StIcon className="h-3 w-3" /> {sLabel(a.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Consultation Card */}
          <div className={`${GLASS_CARD} overflow-hidden`}>
            <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-5 py-3 dark:from-violet-900/20 dark:to-purple-900/20">
              <h3 className="flex items-center gap-2 text-sm font-bold text-text-main">
                <MessageSquare className="h-4 w-4 text-violet-500" />
                {t("doctor.appointmentDetail.linkedConsultation", { defaultValue: "Linked Consultation" })}
              </h3>
            </div>
            <div className="p-5">
              {linkedConsultation ? (
                <div className="space-y-3">
                  <p className="text-sm text-text-main">
                    {t("doctor.appointmentDetail.consultationId", { defaultValue: "Consultation" })} <span className="font-mono font-bold text-violet-600 dark:text-violet-400">#{linkedConsultation.id}</span>
                  </p>
                  {linkedConsultation.chief_complaint && (
                    <p className="text-xs italic text-text-dim">{linkedConsultation.chief_complaint}</p>
                  )}
                  <button onClick={() => navigate(`/doctor/consultations/${linkedConsultation.id}`)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-violet-500/20 transition hover:bg-violet-600">
                    {t("doctor.appointmentDetail.viewConsultation", { defaultValue: "View Consultation" })}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-text-dim">
                  {t("doctor.appointmentDetail.noConsultation", { defaultValue: "No consultation linked to this appointment." })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cancel Reason Modal (Glassmorphism) ── */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <div className={`w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl ${GLASS} p-6`}>
            <h3 className="text-base font-bold text-text-main">
              {t("doctor.appointmentDetail.cancelPrompt", { defaultValue: "Cancel Appointment" })}
            </h3>
            <p className="mt-1 text-sm text-text-dim">
              {t("doctor.appointmentDetail.cancelPromptDesc", { defaultValue: "Please provide a reason for cancellation." })}
            </p>
            <textarea autoFocus rows={3}
              value={cancelModal.reason}
              onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder={t("doctor.appointmentDetail.cancelPlaceholder", { defaultValue: "e.g. schedule conflict, patient request..." })}
              className="mt-4 w-full resize-none rounded-xl border border-border-main bg-bg-app/80 px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-red-400/50 dark:bg-slate-800/80"
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setCancelModal({ open: false, reason: "" })}
                className="flex-1 rounded-xl border border-border-main px-4 py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">
                {t("common.cancel", { defaultValue: "Cancel" })}
              </button>
              <button onClick={handleCancel}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-red-500/20 transition hover:bg-red-600">
                {t("doctor.appointmentDetail.confirmCancel", { defaultValue: "Confirm Cancel" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointmentDetailPage;
