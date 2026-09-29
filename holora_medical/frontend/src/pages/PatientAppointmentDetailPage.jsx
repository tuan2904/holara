import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, ArrowLeft, Building2, Calendar, Clock, FileText,
  Loader2, MapPin, RefreshCw, Star, Stethoscope, Video, XCircle,
} from "lucide-react";
import { appointmentService } from "../services/appointmentService";
import { consultationService } from "../services/consultationService";
import { createReviewApi, checkReviewExistsApi } from "../services/reviewService";
import { getPrescriptionsByAppointmentApi } from "../services/prescriptionService";
import ReviewFormModal from "../components/ReviewFormModal";
import PrescriptionCard from "../components/PrescriptionCard";
import PrescriptionDetailModal from "../components/PrescriptionDetailModal";

const STATUS_CLS = {
  scheduled:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  checked_in:  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  no_show:     "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

const fmtDate = (v) => v ? new Date(v).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (v) => { if (!v) return "—"; const d = new Date(v); return !Number.isNaN(d.getTime()) ? d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : typeof v === "string" ? v.slice(0, 5) : "—"; };
const fmtDT = (v) => v ? new Date(v).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const InfoRow = ({ icon: Icon, iconColor = "text-rose-400", label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bg-app dark:bg-slate-700/50"><Icon className={`h-4 w-4 ${iconColor}`} /></div>
    <div className="min-w-0"><p className="text-xs font-medium text-text-dim">{label}</p><p className="mt-0.5 text-sm font-semibold text-text-main">{value || "—"}</p></div>
  </div>
);

const PatientAppointmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkedConsultation, setLinkedConsultation] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("loading");
  const [paying, setPaying] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [viewRxDetail, setViewRxDetail] = useState(null);
  // Recurring
  const [recurringChildren, setRecurringChildren] = useState([]);
  const [showRecurring, setShowRecurring] = useState(false);
  const [cancellingSeries, setCancellingSeries] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await appointmentService.getAppointmentById(id);
      setAppointment(Array.isArray(res) ? res[0] : (res?.data || res));
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("common.loadError", { defaultValue: "Failed to load data" }));
    } finally { setLoading(false); }
  }, [id, t]);

  useEffect(() => {
    fetchDetail();
    consultationService.getByAppointmentId(id).then(r => setLinkedConsultation(r.data || null)).catch(() => setLinkedConsultation(null));
    getPrescriptionsByAppointmentApi(id).then(r => setPrescriptions((r.data || []).filter(rx => rx.status !== 'draft'))).catch(() => setPrescriptions([]));
    // Fetch payment status
    appointmentService.getPaymentStatus(id)
      .then((r) => setPaymentStatus(r.payment_status || "unpaid"))
      .catch(() => setPaymentStatus("unpaid"));
  }, [fetchDetail, id]);

  // Fetch recurring children if needed
  useEffect(() => {
    if (showRecurring && appointment?.recurring_id) {
      appointmentService.getRecurringChildren(appointment.recurring_id).then(setRecurringChildren).catch(() => setRecurringChildren([]));
    }
  }, [showRecurring, appointment]);

  // Check existing review when appointment is loaded
  useEffect(() => {
    if (!appointment || appointment.status !== "completed") return;
    checkReviewExistsApi({ doctor_id: appointment.doctor_id, appointment_id: appointment.id })
      .then((r) => setExistingReview(r.data?.exists ? r.data.review : null))
      .catch(() => setExistingReview(null));
  }, [appointment]);

  const canEnterRoom = appointment?.appointment_type === "online" && ["scheduled", "confirmed"].includes(appointment?.status);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative">
          <button onClick={() => navigate("/patient/appointments")} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {t("patient.appointmentDetail.backToList", { defaultValue: "My Appointments" })}
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{t("patient.appointmentDetail.title", { defaultValue: "Appointment Detail" })}</p>
              <h1 className="mt-1 text-xl font-bold text-white">{appointment?.appointment_code || "..."}</h1>
            </div>
            {appointment && (
              <span className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-wide ${STATUS_CLS[appointment.status] || "bg-white/20 text-white"}`}>
                {appointment.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1">{error}</div>
          <button onClick={fetchDetail} className="flex items-center gap-1 text-xs font-medium underline hover:no-underline"><RefreshCw className="h-3 w-3" /> {t("common.retry", { defaultValue: "Retry" })}</button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-dim">
          <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
          <p className="text-sm">{t("common.loading", { defaultValue: "Loading..." })}</p>
        </div>
      )}

      {appointment && !loading && (
        <>
          {/* Recurring Series Info */}
          {appointment.recurring_id && (
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
                      await appointmentService.cancelRecurringSeries(appointment.recurring_id);
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
                        <span>{fmtDate(child.appointment_date)} {fmtTime(child.start_time)} - {fmtTime(child.end_time)}</span>
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
          {/* Payment Section */}
          {paymentStatus === "unpaid" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm dark:border-rose-800/30 dark:bg-slate-900/30 mb-4">
              <h2 className="mb-3 text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                💳 Thanh toán lịch hẹn
              </h2>
              <p className="mb-3 text-xs text-rose-700 dark:text-rose-200">Bạn cần thanh toán để xác nhận lịch hẹn này.</p>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-rose-600 disabled:opacity-60"
                disabled={paying}
                onClick={async () => {
                  setPaying(true);
                  try {
                    await appointmentService.payForAppointment(appointment.id);
                    setPaymentStatus("paid");
                    alert("Thanh toán thành công (mock)");
                  } catch (e) {
                    alert(e?.response?.data?.message || "Thanh toán thất bại");
                  } finally {
                    setPaying(false);
                  }
                }}
              >
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Thanh toán ngay</span>}
              </button>
            </div>
          )}
          {paymentStatus === "paid" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-800/30 dark:bg-emerald-900/20 mb-4">
              <h2 className="mb-2 text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                ✅ Đã thanh toán
              </h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-200">Lịch hẹn này đã được thanh toán thành công.</p>
            </div>
          )}
          {/* Appointment Info */}
          <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
            <h2 className="mb-4 text-sm font-bold text-text-main">{t("patient.appointmentDetail.info", { defaultValue: "Appointment Info" })}</h2>
            <div className="space-y-4">
              {/* Cancellation Policy Notice */}
              <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-amber-400" />
                <span>
                  <b>{t("patient.appointmentDetail.cancellationPolicyTitle", { defaultValue: "Cancellation Policy:" })}</b> {t("patient.appointmentDetail.cancellationPolicyDesc", { defaultValue: "Appointments can only be cancelled more than 2 hours before the scheduled time. If you attempt to cancel within 2 hours of the appointment, cancellation will not be allowed." })}
                </span>
              </div>
              <InfoRow icon={Calendar} label={t("patient.appointmentDetail.date", { defaultValue: "Date" })} value={fmtDate(appointment.appointment_date)} />
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bg-app dark:bg-slate-700/50"><Clock className="h-4 w-4 text-emerald-500" /></div>
                <div><p className="text-xs font-medium text-text-dim">{t("patient.appointmentDetail.time", { defaultValue: "Time" })}</p>
                  <p className="mt-0.5 text-sm font-semibold text-text-main">{fmtTime(appointment.start_time)}{appointment.end_time && <span className="font-normal text-text-dim"> – {fmtTime(appointment.end_time)}</span>}</p>
                </div>
              </div>
              <InfoRow icon={Stethoscope} iconColor="text-blue-400" label={t("patient.appointmentDetail.type", { defaultValue: "Type" })} value={appointment.appointment_type === "online" ? t("patient.appointmentDetail.online", { defaultValue: "Online" }) : appointment.appointment_type === "offline" ? t("patient.appointmentDetail.offline", { defaultValue: "In-person" }) : appointment.appointment_type} />
              {appointment.reason && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-bg-app dark:bg-slate-700/50"><FileText className="h-4 w-4 text-amber-500" /></div>
                  <div className="min-w-0 flex-1"><p className="text-xs font-medium text-text-dim">{t("patient.appointmentDetail.reason", { defaultValue: "Reason" })}</p>
                    <p className="mt-1 rounded-xl bg-bg-app p-3 text-sm leading-relaxed text-text-main dark:bg-slate-700/30">{appointment.reason}</p>
                  </div>
                </div>
              )}
              {appointment.status === "cancelled" && appointment.cancellation_reason && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20"><XCircle className="h-4 w-4 text-red-400" /></div>
                  <div className="min-w-0 flex-1"><p className="text-xs font-medium text-red-400">{t("patient.appointmentDetail.cancelReason", { defaultValue: "Cancellation Reason" })}</p>
                    <p className="mt-1 rounded-xl bg-red-50 p-3 text-sm leading-relaxed text-red-600 dark:bg-red-900/20 dark:text-red-400">{appointment.cancellation_reason}</p>
                  </div>
                </div>
              )}
              <div className="border-t border-border-main pt-2 text-xs text-text-dim">{t("patient.appointmentDetail.bookedAt", { defaultValue: "Booked at" })}: {fmtDT(appointment.created_at)}</div>
            </div>
          </div>

          {/* Doctor */}
          <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
            <h2 className="mb-4 text-sm font-bold text-text-main">{t("patient.appointmentDetail.doctor", { defaultValue: "Doctor" })}</h2>
            <div className="flex items-center gap-4">
              {appointment.doctor_avatar ? (
                <img src={appointment.doctor_avatar} alt={appointment.doctor_name} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/20">
                  <span className="text-lg font-bold text-rose-500">{(appointment.doctor_name || "?").split(" ").filter(Boolean).slice(-2).map(w => w[0]).join("").toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="font-bold text-text-main">Dr. {appointment.doctor_name || "—"}</p>
                {appointment.specialty_name && <p className="mt-0.5 text-sm text-text-dim">{appointment.specialty_name}</p>}
              </div>
            </div>
          </div>

          {/* Branch */}
          {appointment.branch_name && (
            <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
              <h2 className="mb-4 text-sm font-bold text-text-main">{t("patient.appointmentDetail.branch", { defaultValue: "Branch" })}</h2>
              <InfoRow icon={Building2} label={t("patient.appointmentDetail.branchName", { defaultValue: "Name" })} value={appointment.branch_name} />
              {appointment.branch_code && <div className="mt-3"><InfoRow icon={MapPin} iconColor="text-text-dim" label={t("patient.appointmentDetail.branchCode", { defaultValue: "Code" })} value={appointment.branch_code} /></div>}
            </div>
          )}

          {/* Linked Consultation */}
          <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
            <h2 className="mb-3 text-sm font-bold text-text-main">{t("patient.appointmentDetail.linkedConsultation", { defaultValue: "Linked Consultation" })}</h2>
            {linkedConsultation ? (
              <div className="space-y-3">
                <p className="text-sm text-text-dim">
                  {t("patient.appointmentDetail.consultationId", { defaultValue: "Consultation" })} <span className="font-semibold text-text-main">#{linkedConsultation.id}</span> — <span className="italic">{linkedConsultation.chief_complaint}</span>
                </p>
                <button onClick={() => navigate(`/patient/consultations/${linkedConsultation.id}`)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-600">
                  {t("patient.appointmentDetail.viewConsultation", { defaultValue: "View Consultation" })}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-text-dim">{t("patient.appointmentDetail.noConsultation", { defaultValue: "No consultation linked to this appointment." })}</p>
                {["confirmed", "in_progress", "scheduled"].includes(appointment.status) && (
                  <button onClick={() => navigate(`/patient/consultations/new?appointmentId=${appointment.id}&branchId=${appointment.branch_id}&doctorId=${appointment.doctor_id}`)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-600 transition hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/10 dark:text-violet-400 dark:hover:bg-violet-900/20">
                    + {t("patient.appointmentDetail.createConsultation", { defaultValue: "Create consultation from this appointment" })}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Enter Room */}
          {canEnterRoom && (
            <button onClick={() => navigate(`/patient/appointments/${appointment.id}/room`)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4 text-sm font-bold text-white shadow-md transition hover:shadow-lg">
              <Video className="h-5 w-5" /> {t("patient.appointmentDetail.enterRoom", { defaultValue: "Enter Online Room" })}
            </button>
          )}

          {/* Rate Doctor */}
          {appointment.status === "completed" && (
            <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
              <h2 className="mb-3 text-sm font-bold text-text-main">{t("review.rateDoctor", { defaultValue: "Rate Doctor" })}</h2>
              {existingReview ? (
                <p className="text-sm text-text-dim">
                  ★ {t("review.alreadyReviewed", { defaultValue: "You have already reviewed this doctor" })} ({existingReview.rating}/5)
                </p>
              ) : (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-amber-600"
                >
                  <Star className="h-5 w-5" />
                  {t("review.writeReview", { defaultValue: "Write a Review" })}
                </button>
              )}
            </div>
          )}

          {/* Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="rounded-2xl border border-emerald-200/50 bg-bg-surface p-5 shadow-sm dark:border-emerald-800/30 dark:bg-slate-800">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-main">
                📋 {t("prescription.sectionTitle", { defaultValue: "Toa thuốc" })}
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">{prescriptions.length}</span>
              </h2>
              <div className="space-y-2">
                {prescriptions.map((rx) => (
                  <PrescriptionCard key={rx.id} prescription={rx} compact onViewDetail={(p) => setViewRxDetail(p)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Review Modal */}
      <ReviewFormModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        doctorName={appointment?.doctor_name}
        onSubmit={async (reviewData) => {
          await createReviewApi({ ...reviewData, doctor_id: appointment.doctor_id, appointment_id: appointment.id });
          setExistingReview({ rating: reviewData.rating });
        }}
      />

      <PrescriptionDetailModal
        isOpen={viewRxDetail !== null}
        onClose={() => setViewRxDetail(null)}
        prescriptionData={viewRxDetail}
      />
    </div>
  );
};

export default PatientAppointmentDetailPage;
