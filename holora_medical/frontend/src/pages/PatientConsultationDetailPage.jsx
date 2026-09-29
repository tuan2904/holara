import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { resolveApiUrl } from "../services/api";
import { consultationService } from "../services/consultationService";
import { aiService } from "../services/aiService";
import { createReviewApi, checkReviewExistsApi } from "../services/reviewService";
import { getPrescriptionsByConsultationApi } from "../services/prescriptionService";
import ReviewFormModal from "../components/ReviewFormModal";
import PrescriptionCard from "../components/PrescriptionCard";
import PrescriptionDetailModal from "../components/PrescriptionDetailModal";

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

const PatientConsultationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patientAiData, setPatientAiData] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [mobileTab, setMobileTab] = useState("info");
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [imageErrors, setImageErrors] = useState({}); // { [imageId]: errorMsg }
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [viewRxDetail, setViewRxDetail] = useState(null);

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await consultationService.getConsultationDetails(id);
      setData(res.data);
      // Check existing review if completed
      if (res.data?.status === "completed" && res.data?.doctor_id) {
        try {
          const checkRes = await checkReviewExistsApi({ doctor_id: res.data.doctor_id });
          setExistingReview(checkRes.data?.exists ? checkRes.data.review : null);
        } catch { setExistingReview(null); }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("patient.consultationsPage.errors.loadDetail"));
    } finally {
      setLoading(false);
    }
    // AI data is optional – non-blocking
    try {
      const aiRes = await aiService.getAnalysisForConsultation(id);
      setPatientAiData(aiRes.data || []);
    } catch {
      setPatientAiData([]);
    }
    // Prescriptions
    try {
      const rxRes = await getPrescriptionsByConsultationApi(id);
      setPrescriptions(rxRes.data || []);
    } catch {
      setPrescriptions([]);
    }
  };

  const handleDeleteImage = async (imageId) => {
    // Clear error trước khi thử lại
    setImageErrors(prev => ({ ...prev, [imageId]: null }));
    setDeletingImageId(imageId);
    try {
      await consultationService.deleteImage(id, imageId);
      const res = await consultationService.getConsultationDetails(id);
      setData(res.data);
    } catch (err) {
      const serverMsg = err.response?.data?.message || "";
      const code = err.response?.data?.code || "";
      const displayMsg = code === "IMAGE_ALREADY_ANALYZED"
        ? "Không thể xóa — ảnh này đã được phân tích AI."
        : serverMsg || "Không thể xóa ảnh, vui lòng thử lại.";
      setImageErrors(prev => ({ ...prev, [imageId]: displayMsg }));
      // Tự xóa error sau 5 giây
      setTimeout(() => setImageErrors(prev => ({ ...prev, [imageId]: null })), 5000);
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      setSubmitting(true);
      setReplyError("");
      await consultationService.addResponse(id, { content: replyText, complete: false });
      setReplyText("");
      const res = await consultationService.getConsultationDetails(id);
      setData(res.data);
    } catch (err) {
      setReplyError(err.response?.data?.message || err.message || t("patient.consultationsPage.errors.sendReply"));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status) => t(STATUS_LABEL_KEYS[status] || "patient.consultationsPage.status.unknown");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-text-dim">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("patient.consultationsPage.loadingDetail")}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-text-dim transition hover:text-text-main"
        >
          ← Quay lại
        </button>
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Mobile tab bar */}
      <div className="flex items-stretch border-b border-border-main bg-bg-surface md:hidden dark:bg-slate-900">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center border-r border-border-main px-4 text-2xl text-text-dim transition active:bg-slate-100 dark:active:bg-slate-800"
          aria-label="Quay lại"
        >
          ←
        </button>
        <button
          onClick={() => setMobileTab("info")}
          className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3.5 text-sm font-semibold transition ${
            mobileTab === "info" ? "border-[#E06666] text-[#E06666]" : "border-transparent text-text-dim"
          }`}
        >
          <FileText className="h-4 w-4" />
          {t("patient.consultationsPage.caseTitle")}
        </button>
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3.5 text-sm font-semibold transition ${
            mobileTab === "chat" ? "border-[#E06666] text-[#E06666]" : "border-transparent text-text-dim"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          {t("patient.consultationsPage.chatTitle")}
        </button>
      </div>

      <div className="flex flex-col md:flex-row overflow-hidden rounded-none md:rounded-2xl border-0 md:border border-border-main bg-bg-surface shadow-sm md:min-h-[calc(100vh-180px)] dark:bg-slate-900">

        {/* ── INFO PANEL (left 1/3) ── */}
        <div
          className={`${
            mobileTab !== "info" ? "hidden md:block" : ""
          } w-full overflow-y-auto border-r border-border-main bg-[linear-gradient(180deg,#fff6f6_0%,#fffdfd_100%)] p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-900/80 md:w-1/3`}
        >
          {/* Back button – desktop only */}
          <button
            onClick={() => navigate(-1)}
            className="mb-3 hidden items-center gap-1 text-sm font-medium text-text-dim transition hover:text-text-main md:inline-flex"
          >
            ← Quay lại danh sách
          </button>

          <h3 className="text-xl font-bold text-[#E06666]">{t("patient.consultationsPage.caseTitle")}</h3>

          {/* Status + doctor */}
          <div className="mt-4 space-y-3 rounded-xl border border-red-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-dim">{t("patient.consultationsPage.columns.status")}</p>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[data.status] || "bg-slate-100 text-slate-700"}`}>
                {getStatusLabel(data.status)}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-dim">{t("patient.consultationsPage.columns.doctor")}</p>
              {data.doctor_name ? (
                <p className="mt-0.5 text-sm font-medium text-text-main">🩺 {data.doctor_name}</p>
              ) : (
                <div className="mt-1 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("patient.consultationsPage.waitingDoctor") || "Đang chờ bác sĩ tiếp nhận..."}
                </div>
              )}
            </div>
          </div>

          {/* Reason + symptoms */}
          <div className="mt-4 rounded-xl border border-red-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-semibold text-text-dim">{t("patient.consultationsPage.fields.reason")}</p>
            <p className="mt-1 text-sm text-text-main">{data.chief_complaint || "-"}</p>
            <p className="mt-4 text-sm font-semibold text-text-dim">{t("patient.consultationsPage.fields.symptoms")}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-text-main">{data.symptoms || "-"}</p>
          </div>

          {/* Lịch hẹn liên kết */}
          {data.appointment_id && (
            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 dark:bg-violet-900/10 dark:border-violet-800 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-500 dark:text-violet-400 mb-2">
                Lịch hẹn liên kết
              </p>
              <p className="text-sm text-text-dim mb-3">
                Tư vấn này được tạo từ lịch hẹn <span className="font-semibold text-text-main">#{data.appointment_id}</span>.
              </p>
              <button
                onClick={() => navigate(`/patient/appointments/${data.appointment_id}`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Xem chi tiết lịch hẹn
              </button>
            </div>
          )}

          {/* Images */}
          <div className="mt-4 rounded-xl border border-red-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-dim">
                {t("patient.consultationsPage.fields.images", { count: data.images?.length || 0 })}
              </p>
            </div>
            {data.images?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {data.images.map((img, idx) => {
                  const hasAI = patientAiData.some(a => a.consultation_image_id === img.id);
                  const isPending = data.status === "pending";
                  // Bệnh nhân thấy có AI khi data được chia sẻ
                  // Backend sẽ block nếu có ai_analysis_request bất kể shared hay không
                  const isDeleting = deletingImageId === img.id;
                  const imgError = imageErrors[img.id];

                  return (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="group relative">
                        <a href={resolveApiUrl(img.image_url)} target="_blank" rel="noreferrer">
                          <img
                            src={resolveApiUrl(img.image_url)}
                            alt={`symptom-${idx + 1}`}
                            className="h-28 w-full cursor-pointer rounded-xl border border-border-main object-cover transition hover:opacity-80 sm:h-24"
                          />
                        </a>

                        {/* Ánh đã có AI phân tích (shared với bệnh nhân): hiện icon khóa + tooltip */}
                        {hasAI && isPending && (
                          <div className="absolute right-1 top-1 group/lock">
                            <div className="flex h-6 w-6 cursor-not-allowed items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-md backdrop-blur">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            </div>
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute right-0 top-8 z-20 w-44 rounded-xl border border-indigo-100 bg-white px-2.5 py-2 text-[10px] leading-relaxed text-indigo-700 shadow-xl opacity-0 transition-opacity group-hover/lock:opacity-100 dark:border-indigo-800/40 dark:bg-slate-800 dark:text-indigo-300">
                              🔒 Không thể xóa — ảnh này đã được phân tích AI.
                            </div>
                          </div>
                        )}

                        {/* Nút xóa: chỉ hiện khi pending */}
                        {isPending && !hasAI && (
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            disabled={isDeleting}
                            title="Xóa ảnh này"
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700 disabled:opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            {isDeleting
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Trash2 className="h-3 w-3" />}
                          </button>
                        )}

                        {/* Badge số thứ tự */}
                        <div className="absolute bottom-1 left-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-bold text-white/90 backdrop-blur">
                          #{idx + 1}
                        </div>
                      </div>

                      {/* Inline error — hiện khi xóa thất bại */}
                      {imgError && (
                        <div className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 dark:border-red-800/40 dark:bg-red-900/15">
                          <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-500" />
                          <p className="text-[10px] leading-relaxed text-red-600 dark:text-red-400">{imgError}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs italic text-text-dim">{t("patient.consultationsPage.emptyImages")}</p>
            )}
          </div>

          {/* AI results (only when doctor has approved sharing) */}
          {patientAiData.length > 0 && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-white p-4 shadow-sm dark:border-indigo-800/30 dark:bg-slate-800">
              <p className="mb-1 text-sm font-semibold text-text-dim">🤖 Kết quả Phân tích AI</p>
              <p className="mb-3 rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 text-[10px] text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300">
                Đã được bác sĩ xem xét và chấp thuận chia sẻ
              </p>
              <div className="space-y-3">
                {patientAiData.map((result, idx) => (
                  <div key={idx} className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 dark:border-indigo-800/30 dark:bg-indigo-900/10">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Ảnh #{idx + 1}</span>
                      {result.doctor_review_status === "approved" && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">✅ Đạt tiêu chuẩn</span>
                      )}
                      {result.doctor_review_status === "approved_watch" && (
                        <span className="rounded-full border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">👁️ Cần theo dõi</span>
                      )}
                    </div>
                    {result.risk_level && (
                      <div className="mb-2">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          result.risk_level === "high" || result.risk_level === "critical"
                            ? "bg-red-100 text-red-800"
                            : result.risk_level === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          Mức rủi ro:{" "}
                          {result.risk_level === "low" ? "Thấp"
                            : result.risk_level === "medium" ? "Trung bình"
                            : result.risk_level === "high" ? "Cao"
                            : "Nghiêm trọng"}{" "}
                          · {result.confidence_score}% tin cậy
                        </span>
                      </div>
                    )}
                    {result.result_summary && (
                      <p className="text-xs leading-relaxed text-text-main">{result.result_summary}</p>
                    )}
                    {result.recommendation && (
                      <p className="mt-2 rounded border border-indigo-100 bg-indigo-50 p-2 text-xs leading-relaxed text-indigo-800 dark:border-indigo-800/30 dark:bg-indigo-900/20 dark:text-indigo-300">
                        💡 {result.recommendation}
                      </p>
                    )}
                    {result.review_note && (
                      <p className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs leading-relaxed text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-300">
                        📝 Ghi chú bác sĩ: {result.review_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-main">
                📋 {t("prescription.sectionTitle", { defaultValue: "Toa thuốc" })}
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">{prescriptions.length}</span>
              </h3>
              <div className="space-y-2">
                {prescriptions.filter(rx => rx.status !== 'draft').map((rx) => (
                  <PrescriptionCard
                    key={rx.id}
                    prescription={rx}
                    compact
                    onViewDetail={(p) => setViewRxDetail(p)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── CHAT PANEL (right 2/3) ── */}
        <div
          className={`${
            mobileTab !== "chat" ? "hidden md:flex" : "flex"
          } w-full flex-col bg-bg-surface dark:bg-slate-900 md:w-2/3`}
        >
          <div className="flex w-full items-center justify-between border-b border-border-main px-6 py-4 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold text-text-main">
              <MessageSquare className="h-5 w-5 text-[#E06666]" />
              {t("patient.consultationsPage.chatTitle")}
            </h3>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-bg-app p-4 sm:p-6 dark:bg-slate-950/50">
            {data.responses?.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <p className="mb-2 text-sm italic text-text-dim">{t("patient.consultationsPage.emptyChatTitle")}</p>
                <p className="text-xs text-text-dim">{t("patient.consultationsPage.emptyChatHint")}</p>
              </div>
            ) : (
              data.responses?.map((msg) => {
                const iAmSending = msg.responder_role === "patient";
                const isDoctor = msg.responder_role === "doctor" || msg.responder_role === "admin" || msg.responder_role === "super_admin" || msg.responder_role === "clinic_owner";
                const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
                const messageText = typeof msg.content === "string" ? msg.content.trim() : "";

                let bubbleClass;
                if (iAmSending) {
                  bubbleClass = "rounded-tr-none bg-[#E06666] text-white";
                } else if (isDoctor && msg.response_type === "diagnosis") {
                  bubbleClass = "rounded-tl-none bg-indigo-600 text-white shadow-md";
                } else if (isDoctor && msg.response_type === "prescription_note") {
                  bubbleClass = "rounded-tl-none bg-emerald-600 text-white shadow-md";
                } else if (isDoctor && msg.response_type === "recommendation") {
                  bubbleClass = "rounded-tl-none bg-violet-600 text-white shadow-md";
                } else {
                  bubbleClass = "rounded-tl-none border border-border-main bg-bg-surface text-text-main";
                }

                const hasColorBg = iAmSending || (isDoctor && msg.response_type !== "message");

                return (
                  <div key={msg.id} className={`flex w-full ${iAmSending ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 sm:p-4 shadow-sm ${bubbleClass}`}>
                      <div className={`mb-1 text-[10px] font-bold uppercase ${hasColorBg ? "text-white/70" : "text-text-dim"}`}>
                        {iAmSending ? t("patient.consultationsPage.meLabel") : msg.responder_name} • {formatDateTime(msg.created_at, i18n.language)}
                      </div>
                      {isDoctor && msg.response_type === "diagnosis" && (
                        <div className="mb-1 flex items-center gap-1 text-xs font-bold uppercase text-white/90">⚡ KẾT LUẬN Y KHOA</div>
                      )}
                      {isDoctor && msg.response_type === "recommendation" && (
                        <div className="mb-1 text-xs font-bold uppercase text-white/90">📋 LỜI KHUYÊN</div>
                      )}
                      {isDoctor && msg.response_type === "prescription_note" && (
                        <div className="mb-1 text-xs font-bold uppercase text-white/90">💊 DẶN DÒ DÙNG THUỐC</div>
                      )}
                      {messageText && <div className="whitespace-pre-wrap text-sm leading-relaxed">{messageText}</div>}
                      {attachments.length > 0 && (
                        <div className={`mt-2 grid gap-2 ${attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                          {attachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={resolveApiUrl(attachment.image_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="group overflow-hidden rounded-xl border border-white/20 bg-black/10"
                            >
                              <img
                                src={resolveApiUrl(attachment.image_url)}
                                alt={attachment.file_name || "attachment"}
                                className="h-44 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {data.status !== "completed" ? (
            <form onSubmit={handleSubmitResponse} className="border-t border-border-main bg-bg-surface px-3 py-3 sm:p-4 dark:bg-slate-900">
              {replyError && (
                <div className="mb-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  {replyError}
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t("patient.consultationsPage.replyPlaceholder")}
                  className="flex-1 resize-none rounded-xl border border-border-main bg-white p-3 text-sm text-text-main outline-none focus:border-[#E06666] focus:ring-1 focus:ring-[#F7CACA] dark:bg-slate-900"
                  rows="2"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-[#E06666] p-3 font-semibold text-white shadow-md transition hover:bg-[#d85a5a] disabled:opacity-50 sm:gap-2 sm:px-5 sm:py-2.5"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  <span className="hidden sm:inline">
                    {submitting ? t("patient.consultationsPage.sending") : t("patient.consultationsPage.sendAction")}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="border-t border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="text-center text-sm font-semibold italic text-emerald-700 dark:text-emerald-300">
                {t("patient.consultationsPage.completedNotice")}
              </p>
              {data.doctor_id && !existingReview && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="mx-auto mt-3 flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-amber-600"
                >
                  <Star className="h-4 w-4" />
                  {t("review.rateDoctor", { defaultValue: "Rate Doctor" })}
                </button>
              )}
              {existingReview && (
                <p className="mt-2 text-center text-xs text-emerald-600 dark:text-emerald-400">
                  ★ {t("review.alreadyReviewed", { defaultValue: "You have already reviewed this doctor" })} ({existingReview.rating}/5)
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <ReviewFormModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        doctorName={data?.doctor_name}
        onSubmit={async (reviewData) => {
          await createReviewApi({ ...reviewData, doctor_id: data.doctor_id });
          setExistingReview({ rating: reviewData.rating });
        }}
      />

      {/* Prescription Detail Modal */}
      <PrescriptionDetailModal
        isOpen={viewRxDetail !== null}
        onClose={() => setViewRxDetail(null)}
        prescriptionData={viewRxDetail}
      />
    </div>
  );
};

export default PatientConsultationDetailPage;
