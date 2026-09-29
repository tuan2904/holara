import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity, AlertCircle, ArrowLeft, Brain, Calendar, CheckCircle,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Eye, EyeOff, FileText, Image,
  Loader2, Lock, MessageSquare, Minus, Plus, RefreshCw, RotateCcw, Send, Shield,
  Sparkles, Stethoscope, TrendingUp, User, XCircle, Check,
} from "lucide-react";
import { consultationService } from "../services/consultationService";
import { aiService } from "../services/aiService";
import { createPrescriptionApi, getPrescriptionsByConsultationApi, updatePrescriptionApi, issuePrescriptionApi, cancelPrescriptionApi } from "../services/prescriptionService";
import { resolveApiUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import PrescriptionFormModal from "../components/PrescriptionFormModal";
import PrescriptionCard from "../components/PrescriptionCard";
import PrescriptionDetailModal from "../components/PrescriptionDetailModal";

/* ─────────── Design Tokens ──────────────── */
const C_STATUS = {
  pending:     { label: "Pending",     color: "amber",   icon: Clock },
  in_progress: { label: "In Progress", color: "sky",     icon: TrendingUp },
  completed:   { label: "Completed",   color: "emerald", icon: CheckCircle },
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

const REVIEW_STATUS_CONFIG = {
  pending_review: { label: "Pending Review", color: "amber",   icon: Eye },
  approved:       { label: "Approved · Shared", color: "emerald", icon: CheckCircle },
  approved_watch: { label: "Approved · Watch · Shared", color: "sky", icon: Eye },
  not_standard:   { label: "Not Standard", color: "red",     icon: XCircle },
  revoked:        { label: "Revoked", color: "slate",   icon: Lock },
};

const MAX_REPLY_ATTACHMENTS = 5;

/* ─────────── Helpers ────────────────────────────────────── */
const fmtDateTime = (v, lng) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString(lng === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const calcAge = (dob) => {
  if (!dob) return "—";
  return Math.max(0, new Date().getFullYear() - new Date(dob).getFullYear());
};

const getAiViewLabel = (view, t) => ({
  processed: t("doctor.consultationDetail.viewMode.processed", { defaultValue: "Processed" }),
  edge: t("doctor.consultationDetail.viewMode.edge", { defaultValue: "Edge" }),
  mask: t("doctor.consultationDetail.viewMode.mask", { defaultValue: "Mask" }),
}[view] || view);

const getAiVisionUrls = (aiResult) => {
  if (!aiResult?.result_payload) return {};

  const payload = typeof aiResult.result_payload === "string"
    ? (() => {
        try {
          return JSON.parse(aiResult.result_payload);
        } catch {
          return {};
        }
      })()
    : aiResult.result_payload;
  const vision = payload.vision_results || {};
  const AI_BASE = "http://localhost:8000";

  const getImageUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;

    const normalizedPath = path.replace(/\\/g, "/");
    const filename = normalizedPath.split("/").pop();
    const folder = normalizedPath.includes("uploads") ? "uploads" : "processed";
    return `${AI_BASE}/${folder}/${filename}`;
  };

  return {
    processed: getImageUrl(vision.processed_image_path),
    edge: getImageUrl(vision.edge_image_path),
    mask: getImageUrl(vision.mask_image_path),
  };
};

const getAiSendCaption = (view, t) => ({
  processed: t("doctor.consultationDetail.aiCaptionProcessed", { defaultValue: "Ảnh AI đã xử lý" }),
  edge: t("doctor.consultationDetail.aiCaptionEdge", { defaultValue: "Ảnh AI biên" }),
  mask: t("doctor.consultationDetail.aiCaptionMask", { defaultValue: "Ảnh AI mặt nạ" }),
}[view] || t("doctor.consultationDetail.aiCaptionDefault", { defaultValue: "Ảnh AI" }));

const getReviewStatusLabel = (status, t) => ({
  pending_review: t("doctor.consultationDetail.reviewStatus.pendingReview", { defaultValue: "Pending review" }),
  approved: t("doctor.consultationDetail.reviewStatus.approved", { defaultValue: "Approved" }),
  approved_watch: t("doctor.consultationDetail.reviewStatus.approvedWatch", { defaultValue: "Approved with watch" }),
  not_standard: t("doctor.consultationDetail.reviewStatus.notStandard", { defaultValue: "Not standard" }),
  revoked: t("doctor.consultationDetail.reviewStatus.revoked", { defaultValue: "Revoked" }),
}[status] || status);

/* ─────────── Sub-components ─────────────────────────────── */
const Pulse = ({ className }) => <div className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/50 ${className}`} />;

const ZoomPreviewButton = ({ onClick, label, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-violet-950/90 px-3.5 py-2 text-[11px] font-bold tracking-wide text-white shadow-xl shadow-black/25 ring-1 ring-white/10 backdrop-blur-md transition hover:-translate-y-0.5 hover:scale-[1.02] hover:border-violet-300/60 hover:shadow-violet-500/25 focus:outline-none focus:ring-2 focus:ring-violet-400 ${className}`}
  >
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
      <Eye className="h-3.5 w-3.5" />
    </span>
    <span className="leading-none">{label}</span>
  </button>
);

const RiskBadge = ({ level, t: _t }) => {
  const map = {
    low:    { label: _t("doctor.consultationDetail.risk.low",    { defaultValue: "Low Risk" }),    cls: "bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/20 dark:text-emerald-300" },
    medium: { label: _t("doctor.consultationDetail.risk.medium", { defaultValue: "Medium Risk" }), cls: "bg-amber-100/80 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/20 dark:text-amber-300" },
    high:   { label: _t("doctor.consultationDetail.risk.high",   { defaultValue: "High Risk" }),   cls: "bg-red-100/80 text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/20 dark:text-red-300 animate-pulse" },
  };
  const cfg = map[level];
  if (!cfg) return null;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${cfg.cls}`}>{cfg.label}</span>;
};

/* ══════════════════════════════════════════════════════════
   DoctorConsultationDetailPage
   3-Zone Layout: Compact Header · Sticky Sidebar · Right Content
   ══════════════════════════════════════════════════════════ */
const DoctorConsultationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const { role } = useAuth();

  const [data, setData] = useState(null);
  const [aiData, setAiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyType, setReplyType] = useState("message");
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [replyError, setReplyError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reopenSubmitting, setReopenSubmitting] = useState(false);
  const [requestAILoading, setRequestAILoading] = useState(null);
  const [confirmAiImageId, setConfirmAiImageId] = useState(null);
  const [reviewingRequestId, setReviewingRequestId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: "approved", note: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [aiViews, setAiViews] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [previewZoom, setPreviewZoom] = useState({ scale: 1, x: 0, y: 0 });
  const previewDragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [prescriptions, setPrescriptions] = useState([]);
  const [showRxForm, setShowRxForm] = useState(false);
  const [editingRx, setEditingRx] = useState(null);
  const [viewRxDetail, setViewRxDetail] = useState(null);
  const replyFileInputRef = useRef(null);
  const replyAttachmentsRef = useRef([]);

  const sLabel = (status) => {
    const key = status === "in_progress" ? "inProgress" : status;
    return t(`doctor.consultationsPage.status.${key}`, { defaultValue: C_STATUS[status]?.label || status });
  };

  const clearReplyAttachments = useCallback(() => {
    replyAttachmentsRef.current.forEach((attachment) => {
      URL.revokeObjectURL(attachment.previewUrl);
    });
    replyAttachmentsRef.current = [];
    setReplyAttachments([]);
    if (replyFileInputRef.current) {
      replyFileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    replyAttachmentsRef.current = replyAttachments;
  }, [replyAttachments]);

  useEffect(() => {
    clearReplyAttachments();
    setReplyText("");
    setReplyType("message");
    setReplyError("");
  }, [id, clearReplyAttachments]);

  useEffect(() => () => {
    replyAttachmentsRef.current.forEach((attachment) => {
      URL.revokeObjectURL(attachment.previewUrl);
    });
  }, []);

  /* ── Fetch ── */
  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await consultationService.getConsultationDetails(id);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("doctor.consultationDetail.errors.loadFailed", { defaultValue: "Failed to load" }));
    } finally { setLoading(false); }
  }, [id, t]);

  const fetchAiData = useCallback(async () => {
    try {
      const res = await aiService.getAnalysisForConsultation(id);
      setAiData(res.data || []);
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => { fetchDetail(); fetchAiData(); }, [fetchDetail, fetchAiData]);

  /* ── Prescriptions ── */
  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await getPrescriptionsByConsultationApi(id);
      setPrescriptions(res.data || []);
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const getAiDisplayUrl = (aiResult, currentView = "processed") => {
    const urls = getAiVisionUrls(aiResult);
    return urls[currentView] || urls.processed || null;
  };

  const previewItems = (data?.images || []).flatMap((img, idx) => {
    const items = [{
      key: `original-${img.id}`,
      title: `${t("doctor.consultationDetail.originalLabel", { defaultValue: "Original" })} #${idx + 1}`,
      source: t("doctor.consultationDetail.originalImage", { defaultValue: "Original image" }),
      src: resolveApiUrl(img.image_url),
      kind: "original",
    }];

    const aiResult = aiData.find((a) => a.consultation_image_id === img.id);
    const currentView = aiViews[img.id] || "processed";
    const displayUrl = getAiDisplayUrl(aiResult, currentView);

    if (aiResult?.request_status === "completed" && displayUrl) {
      items.push({
        key: `ai-${img.id}-${currentView}`,
        title: `${t("doctor.consultationDetail.aiLabel", { defaultValue: "AI" })} · ${getAiViewLabel(currentView, t)} #${idx + 1}`,
        source: t("doctor.consultationDetail.aiLabel", { defaultValue: "AI" }),
        src: displayUrl,
        kind: "ai",
        view: currentView,
      });
    }

    return items;
  });

  const currentPreview = imagePreview
    ? previewItems.find((item) => item.key === imagePreview.currentKey)
    : null;
  const currentPreviewIndex = imagePreview
    ? previewItems.findIndex((item) => item.key === imagePreview.currentKey)
    : -1;

  const resetPreviewTransform = useCallback(() => {
    setPreviewZoom({ scale: 1, x: 0, y: 0 });
  }, []);

  const openPreviewByKey = (key) => {
    if (!previewItems.length) return;
    const index = previewItems.findIndex((item) => item.key === key);
    if (index < 0) return;
    setImagePreview({ currentKey: previewItems[index].key });
    resetPreviewTransform();
  };

  const goToPreview = useCallback((direction) => {
    if (!currentPreview || previewItems.length <= 1) return;
    const currentIndex = previewItems.findIndex((item) => item.key === currentPreview.key);
    if (currentIndex < 0) return;
    const nextIndex = (currentIndex + direction + previewItems.length) % previewItems.length;
    setImagePreview({ currentKey: previewItems[nextIndex].key });
    resetPreviewTransform();
  }, [currentPreview, previewItems, resetPreviewTransform]);

  const adjustPreviewZoom = useCallback((delta) => {
    setPreviewZoom((prev) => {
      const nextScale = clamp(Number((prev.scale + delta).toFixed(2)), 1, 4);
      if (nextScale === 1) {
        return { scale: 1, x: 0, y: 0 };
      }
      return { ...prev, scale: nextScale };
    });
  }, []);

  const closePreview = useCallback(() => {
    setImagePreview(null);
    resetPreviewTransform();
  }, [resetPreviewTransform]);

  useEffect(() => {
    if (imagePreview && !currentPreview) {
      closePreview();
    }
  }, [imagePreview, currentPreview, closePreview]);

  const handlePreviewPointerDown = (event) => {
    if (!currentPreview || previewZoom.scale <= 1) return;
    event.preventDefault();
    previewDragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: previewZoom.x,
      originY: previewZoom.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePreviewPointerMove = (event) => {
    if (!previewDragRef.current.active) return;
    const dx = event.clientX - previewDragRef.current.startX;
    const dy = event.clientY - previewDragRef.current.startY;
    setPreviewZoom((prev) => ({
      ...prev,
      x: clamp(previewDragRef.current.originX + dx, -2200, 2200),
      y: clamp(previewDragRef.current.originY + dy, -2200, 2200),
    }));
  };

  const endPreviewDrag = (event) => {
    previewDragRef.current.active = false;
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePreviewWheel = (event) => {
    event.preventDefault();
    adjustPreviewZoom(event.deltaY < 0 ? 0.18 : -0.18);
  };

  useEffect(() => {
    if (!imagePreview) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closePreview();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreview(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToPreview(1);
        return;
      }
      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        adjustPreviewZoom(0.18);
        return;
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        adjustPreviewZoom(-0.18);
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        resetPreviewTransform();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [imagePreview, adjustPreviewZoom, closePreview, goToPreview, resetPreviewTransform]);

  /* ── AI request ── */
  const startRequestAI = async (imageId) => {
    setRequestAILoading(imageId);
    try {
      await aiService.requestImageAnalysis(id, imageId);
      await fetchAiData();
      const interval = setInterval(async () => {
        const currentRes = await aiService.getAnalysisForConsultation(id);
        const updated = currentRes.data.find(a => a.consultation_image_id === imageId);
        if (updated && updated.request_status !== "processing" && updated.request_status !== "queued") {
          setAiData(currentRes.data);
          clearInterval(interval);
        } else {
          setAiData(currentRes.data);
        }
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setRequestAILoading(null);
      setConfirmAiImageId(null);
    }
  };

  /* ── Review submit ── */
  const handleSubmitReview = async (requestId) => {
    setReviewSubmitting(true);
    try {
      await aiService.reviewAIResult(requestId, { review_status: reviewForm.status, review_note: reviewForm.note });
      setReviewingRequestId(null);
      await fetchAiData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setReviewSubmitting(false); }
  };

  /* ── Reply ── */
  const handleReplyAttachmentsChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setReplyError("");

    const availableSlots = Math.max(0, MAX_REPLY_ATTACHMENTS - replyAttachmentsRef.current.length);
    const acceptedFiles = files.slice(0, availableSlots);

    if (acceptedFiles.length < files.length) {
      setReplyError(t("doctor.consultationDetail.replyImageLimit", {
        defaultValue: `Chỉ được gửi tối đa ${MAX_REPLY_ATTACHMENTS} ảnh.`,
      }));
    }

    const nextAttachments = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setReplyAttachments((prev) => [...prev, ...nextAttachments]);
    event.target.value = "";
  };

  const removeReplyAttachment = (attachmentId) => {
    const target = replyAttachmentsRef.current.find((item) => item.id === attachmentId);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    setReplyAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
  };

  const handleReplySubmit = async (e, markComplete = false) => {
    e.preventDefault();
    const trimmedText = replyText.trim();
    const hasAttachments = replyAttachments.length > 0;
    if (!trimmedText && !hasAttachments) return;

    setIsSubmitting(true);
    setReplyError("");
    try {
      const payload = hasAttachments ? new FormData() : {};

      if (hasAttachments) {
        payload.append("content", trimmedText);
        payload.append("response_type", replyType);
        payload.append("complete", String(markComplete));
        replyAttachments.forEach((attachment) => {
          payload.append("attachments", attachment.file);
        });
      } else {
        payload.content = trimmedText;
        payload.response_type = replyType;
        payload.complete = markComplete;
      }

      await consultationService.addResponse(id, payload);
      setReplyText("");
      setReplyType("message");
      clearReplyAttachments();
      await fetchDetail();
    } catch (err) {
      setReplyError(err.response?.data?.message || err.message);
    } finally { setIsSubmitting(false); }
  };

  const handleSendAiImageToChat = async ({ imageUrl, caption }) => {
    if (!imageUrl) return;

    setIsSubmitting(true);
    setReplyError("");
    try {
      await consultationService.addResponse(id, {
        content: caption || t("doctor.consultationDetail.aiCaptionDefault", { defaultValue: "Ảnh AI" }),
        response_type: "message",
        complete: false,
        attachments: [imageUrl],
      });
      await fetchDetail();
    } catch (err) {
      setReplyError(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Reopen ── */
  const handleReopenCase = async () => {
    setReopenSubmitting(true);
    try {
      await consultationService.reopenConsultation(id);
      await fetchDetail();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setReopenSubmitting(false); }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-4">
        <Pulse className="h-10 w-48 mb-5" />
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4 space-y-4">
            <Pulse className="h-64 rounded-2xl" />
            <Pulse className="h-48 rounded-2xl" />
            <Pulse className="h-36 rounded-2xl" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <Pulse className="h-80 rounded-2xl" />
            <Pulse className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl p-4">
        <button onClick={() => navigate("/doctor/consultations")}
          className="inline-flex items-center gap-2 rounded-xl border border-border-main px-3.5 py-2 text-sm font-medium text-text-main transition hover:bg-bg-app">
          <ArrowLeft className="h-4 w-4" /> {t("common.back", { defaultValue: "Back" })}
        </button>
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-5 py-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  const st = C_STATUS[data.status] || C_STATUS.pending;
  const StIcon = st.icon;
  const completedAI = aiData.filter(a => a.request_status === "completed");
  const imageGridClass = data?.images?.length > 1
    ? "grid grid-cols-1 2xl:grid-cols-2 gap-5"
    : "grid grid-cols-1 gap-5";

  return (
    <div className="mx-auto max-w-7xl overflow-x-hidden p-4 pb-10">

      {/* ── COMPACT HERO BAR ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate("/doctor/consultations")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3 py-1.5 text-sm font-medium text-text-main transition hover:bg-bg-app">
            <ArrowLeft className="h-4 w-4" />
            {t("doctor.consultationDetail.backToList", { defaultValue: "All Consultations" })}
          </button>
          <span className="text-text-dim text-sm">/</span>
          <span className="font-mono text-sm font-bold text-text-main">#{data.id}</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${PILL[st.color] || ""}`}>
            <StIcon className="h-3.5 w-3.5" /> {sLabel(data.status)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-4 rounded-xl border border-border-main/50 bg-bg-surface/60 px-4 py-2 text-xs text-text-dim">
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-cyan-500" /><span className="font-semibold text-text-main">{data.patient_name}</span></span>
            <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5 text-indigo-500" /><span>{completedAI.length}/{data.images?.length || 0} AI</span></span>
            <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-emerald-500" /><span>{data.responses?.length || 0} {t("doctor.consultationDetail.messagesShort", { defaultValue: "msgs" })}</span></span>
            <span className="hidden sm:flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-amber-500" /><span>{fmtDateTime(data.created_at, lng)}</span></span>
          </div>
          <button onClick={() => { fetchDetail(); fetchAiData(); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-main/60 px-3 py-2 text-xs font-semibold text-text-dim transition hover:bg-bg-app">
            <RefreshCw className="h-3.5 w-3.5" /> {t("common.refresh", { defaultValue: "Refresh" })}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-5 py-4 text-sm text-red-700 backdrop-blur dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* ── MAIN 2-COLUMN LAYOUT ── */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 items-start">

        {/* ══ LEFT SIDEBAR (4/12) — STICKY ══ */}
        <div className="w-full lg:col-span-4 lg:sticky lg:top-4 space-y-4 mb-5 lg:mb-0">

          {/* Patient Info */}
          <div className={`${GLASS_CARD} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-bold text-text-main mb-4">
              <User className="h-4 w-4 text-cyan-500" />
              {t("doctor.consultationDetail.patientInfo", { defaultValue: "Patient Information" })}
            </h2>
            <div className="space-y-3">
              {[
                { label: t("doctor.consultationDetail.patientName", { defaultValue: "Name" }), value: data.patient_name },
                { label: t("doctor.consultationDetail.ageGender", { defaultValue: "Age / Gender" }), value: `${calcAge(data.date_of_birth)} ${t("doctor.consultationDetail.yearsOld", { defaultValue: "yrs" })} / ${data.gender || "—"}` },
                { label: t("doctor.consultationDetail.medicalHistory", { defaultValue: "Medical History" }), value: data.medical_history || t("doctor.consultationDetail.notAvailable", { defaultValue: "Not available" }) },
                { label: t("doctor.consultationDetail.allergies", { defaultValue: "Allergies" }), value: data.allergies || t("doctor.consultationDetail.notAvailable", { defaultValue: "Not available" }) },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">{row.label}</p>
                  <p className="text-sm font-semibold text-text-main">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chief Complaint & Symptoms */}
          <div className={`${GLASS_CARD} p-5`}>
            <h2 className="flex items-center gap-2 text-sm font-bold text-text-main mb-3">
              <Stethoscope className="h-4 w-4 text-rose-500" />
              {t("doctor.consultationDetail.symptoms", { defaultValue: "Chief Complaint" })}
            </h2>
            <div className="rounded-xl border-l-4 border-rose-400 bg-rose-50/50 p-3 dark:bg-rose-900/10 mb-3">
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{data.chief_complaint}</p>
            </div>
            {data.symptoms && (
              <div className="rounded-xl bg-bg-app/50 p-3 dark:bg-slate-800/50">
                <p className="text-xs leading-relaxed text-text-main whitespace-pre-line">{data.symptoms}</p>
              </div>
            )}
          </div>

          {/* Prescriptions (sidebar) */}
          {(role === "doctor" || role === "super_admin" || role === "admin") && (
            <div className={`${GLASS_CARD} overflow-hidden`}>
              <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-5 py-3 dark:from-emerald-900/20 dark:to-teal-900/20">
                <h2 className="flex items-center gap-2 text-sm font-bold text-text-main">
                  <Stethoscope className="h-4 w-4 text-emerald-500" />
                  {t("prescription.sectionTitle", { defaultValue: "Toa thuốc" })}
                  {prescriptions.length > 0 && (
                    <span className="ml-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">{prescriptions.length}</span>
                  )}
                </h2>
                {data.status !== "completed" && (
                  <button onClick={() => { setEditingRx(null); setShowRxForm(true); }}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-600">
                    <FileText className="h-3 w-3" />
                    {t("prescription.createBtn", { defaultValue: "Kê toa" })}
                  </button>
                )}
              </div>
              <div className="p-3 space-y-2">
                {prescriptions.length === 0 ? (
                  <p className="text-center text-xs text-text-dim py-3">
                    {t("prescription.empty", { defaultValue: "Chưa có toa thuốc nào." })}
                  </p>
                ) : (
                  prescriptions.map((rx) => (
                    <PrescriptionCard
                      key={rx.id}
                      prescription={rx}
                      showActions
                      onViewDetail={(p) => setViewRxDetail(p)}
                      onEdit={(p) => { setEditingRx(p); setShowRxForm(true); }}
                      onIssue={async (rxId) => {
                        try { await issuePrescriptionApi(rxId); await fetchPrescriptions(); } catch { /* silent */ }
                      }}
                      onCancel={async (rxId) => {
                        try { await cancelPrescriptionApi(rxId); await fetchPrescriptions(); } catch { /* silent */ }
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Linked Appointment */}
          {data.appointment_id && (
            <div className={`${GLASS_CARD} overflow-hidden`}>
              <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-5 py-3 dark:from-violet-900/20 dark:to-purple-900/20">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-main">
                  <Calendar className="h-3.5 w-3.5 text-violet-500" />
                  {t("doctor.consultationDetail.linkedAppointment", { defaultValue: "Linked Appointment" })}
                </h3>
              </div>
              <div className="p-4">
                <p className="text-xs text-text-dim mb-3">
                  {t("doctor.consultationDetail.appointmentRef", { defaultValue: "From appointment" })}{" "}
                  <span className="font-mono font-bold text-violet-600 dark:text-violet-400">#{data.appointment_id}</span>
                </p>
                <button onClick={() => navigate(`/doctor/appointments/${data.appointment_id}`)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-violet-500/20 transition hover:bg-violet-600">
                  {t("doctor.consultationDetail.viewAppointment", { defaultValue: "View Appointment" })}
                </button>
              </div>
            </div>
          )}

        </div>{/* end left sidebar */}

        {/* ══ RIGHT COLUMN (8/12) ══ */}
        <div className="w-full lg:col-span-8 space-y-5">

          {/* ── Clinical Images & AI Analysis ── */}
          {data.images && data.images.length > 0 && (
            <div className={`${GLASS_CARD} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-text-main">
                  <Image className="h-4 w-4 text-indigo-500" />
                  {t("doctor.consultationDetail.clinicalImages", { defaultValue: "Clinical Images" })}
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">{data.images.length}</span>
                </h2>
              </div>

              {/* Image Grid: image-first, wider cards */}
              <div className={imageGridClass}>
                {data.images.map((img, idx) => {
                  const aiResult = aiData?.find(a => a.consultation_image_id === img.id);
                  const isProcessing = aiResult?.request_status === "processing" || aiResult?.request_status === "queued";
                  const isCompleted = aiResult?.request_status === "completed";
                  const isFailed = aiResult?.request_status === "failed";
                  const reviewStatus = aiResult?.doctor_review_status || "pending_review";
                  const isExpanded = expandedImage === idx;
                  const aiVisionUrls = getAiVisionUrls(aiResult);
                  const currentView = aiViews[img.id] || "processed";
                  const displayUrl = aiVisionUrls[currentView] || aiVisionUrls.processed || null;
                  const sendableViews = [
                    { key: "processed", label: "Gửi processed", caption: getAiSendCaption("processed", t), url: aiVisionUrls.processed, icon: Sparkles, className: "from-violet-600 via-indigo-600 to-cyan-600 shadow-violet-500/25 hover:shadow-violet-500/35" },
                    { key: "edge", label: "Gửi edge", caption: getAiSendCaption("edge", t), url: aiVisionUrls.edge, icon: TrendingUp, className: "from-cyan-600 via-sky-600 to-blue-600 shadow-cyan-500/25 hover:shadow-cyan-500/35" },
                    { key: "mask", label: "Gửi mask", caption: getAiSendCaption("mask", t), url: aiVisionUrls.mask, icon: Shield, className: "from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-500/25 hover:shadow-emerald-500/35" },
                  ].filter((item) => Boolean(item.url));

                  return (
                    <div key={idx} className="overflow-hidden rounded-[1.75rem] border border-border-main/50 bg-bg-surface/30 shadow-sm shadow-black/[0.02] dark:border-slate-700/50">
                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b border-border-main/30 bg-bg-app/60 px-4 py-2.5 dark:bg-slate-800/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-text-dim">
                          {t("doctor.consultationDetail.imageNum", { defaultValue: "Image" })} #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {isProcessing && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-500">
                              <Loader2 className="h-3 w-3 animate-spin" /> {t("doctor.consultationDetail.aiAnalyzing", { defaultValue: "AI analyzing..." })}
                            </span>
                          )}
                          {isCompleted && <RiskBadge level={aiResult.risk_level} t={t} />}
                          {isFailed && <span className="text-[10px] font-semibold text-red-500">{t("doctor.consultationDetail.failed", { defaultValue: "Failed" })}</span>}
                        </div>
                      </div>

                      {/* Original image first, AI below */}
                      <div className="flex flex-col divide-y divide-border-main/30 dark:divide-slate-700/30">
                        {/* Original Image */}
                        <div className="relative group overflow-hidden">
                          <div className="absolute top-2 left-2 z-10">
                            <span className="rounded-full bg-black/50 backdrop-blur px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/90">
                              {t("doctor.consultationDetail.original", { defaultValue: "Original" })}
                            </span>
                          </div>
                          <ZoomPreviewButton
                            onClick={() => openPreviewByKey(`original-${img.id}`)}
                            label={t("common.zoomIn", { defaultValue: "Zoom in" })}
                          />
                          <div className="h-[520px] overflow-hidden bg-slate-950 xl:h-[620px]">
                            <img
                              src={resolveApiUrl(img.image_url)}
                              alt={`${t("doctor.consultationDetail.imageNum", { defaultValue: "Image" })} ${idx + 1}`}
                              onClick={() => openPreviewByKey(`original-${img.id}`)}
                              className="h-full w-full cursor-zoom-in object-contain transition-transform duration-500 group-hover:scale-[1.02]" />
                          </div>
                        </div>

                        {/* AI Vision Panel */}
                        <div className="flex min-h-[360px] flex-col bg-violet-50/10 dark:bg-violet-900/5 xl:min-h-[420px]">
                          {isCompleted && aiResult.result_payload ? (() => {
                            return (
                              <>
                                {/* AI Tab Bar */}
                                <div className="flex items-center justify-between border-b border-violet-500/20 bg-violet-500/10 px-3 py-2">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">{t("doctor.consultationDetail.aiVision", { defaultValue: "AI Vision" })}</span>
                                  <div className="flex gap-1">
                                    {['processed', 'edge', 'mask'].map(v => (
                                      <button key={v}
                                        onClick={() => setAiViews(prev => ({ ...prev, [img.id]: v }))}
                                        className={`rounded px-2 py-0.5 text-[8px] font-bold uppercase transition ${
                                          currentView === v
                                            ? "bg-violet-600 text-white"
                                            : "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300"
                                        }`}>
                                        {getAiViewLabel(v, t)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {/* AI Image */}
                                <div className="relative flex-1 overflow-hidden group">
                                  {displayUrl ? (
                                    <>
                                      <ZoomPreviewButton
                                        onClick={() => openPreviewByKey(`ai-${img.id}-${currentView}`)}
                                        label={t("common.zoomIn", { defaultValue: "Zoom in" })}
                                      />
                                      <img
                                        src={displayUrl}
                                        alt={`${t("doctor.consultationDetail.aiLabel", { defaultValue: "AI" })} ${getAiViewLabel(currentView, t)}`}
                                        onClick={() => openPreviewByKey(`ai-${img.id}-${currentView}`)}
                                        className="h-full w-full cursor-zoom-in object-contain transition-transform duration-500 group-hover:scale-[1.03]" />
                                    </>
                                  ) : (
                                    <div className="absolute inset-0 flex h-full flex-col items-center justify-center gap-1 text-[10px] text-text-dim italic">
                                      <AlertCircle className="h-4 w-4 text-amber-500/50" /> {t("doctor.consultationDetail.noVisualData", { defaultValue: "No visual data" })}
                                    </div>
                                  )}
                                  <div className="absolute bottom-2 right-2 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[8px] font-bold text-white/90 uppercase">
                                    {getAiViewLabel(currentView, t)}
                                  </div>
                                </div>
                              </>
                            );
                          })() : (
                            <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center gap-2 p-6 text-center xl:min-h-[420px]">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-800/50">
                                <Brain className={`h-6 w-6 text-violet-500 ${isProcessing ? "animate-pulse" : ""}`} />
                              </div>
                              <p className="text-xs font-bold text-violet-600 dark:text-violet-300">
                                {isProcessing
                                  ? t("doctor.consultationDetail.aiEngineRunning", { defaultValue: "AI Engine Running..." })
                                  : t("doctor.consultationDetail.cvAnalysisAvailable", { defaultValue: "Image analysis available" })}
                              </p>
                              {!isProcessing && !isCompleted && !isFailed && (
                                <button
                                  onClick={() => setConfirmAiImageId(img.id)}
                                  disabled={requestAILoading === img.id}
                                  className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-1.5 text-[10px] font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {requestAILoading === img.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                  {requestAILoading === img.id
                                    ? t("common.sending", { defaultValue: "Sending..." })
                                    : t("doctor.consultationDetail.analyzeNow", { defaultValue: "Analyze Now" })}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-main/30 bg-bg-app/30 px-4 py-2">
                        <div className="text-[10px] font-bold">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-0.5 rounded-md">
                              <CheckCircle className="h-3 w-3" /> {t("doctor.consultationDetail.aiComplete", { defaultValue: "AI complete" })}
                            </span>
                          ) : isFailed ? (
                            <span className="text-red-500 bg-red-50 dark:bg-red-900/10 px-2 py-0.5 rounded-md">{t("doctor.consultationDetail.failed", { defaultValue: "Failed" }).toUpperCase()}</span>
                          ) : (
                            <span className="text-text-dim uppercase tracking-tighter">{t("doctor.consultationDetail.idle", { defaultValue: "Idle" }).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {isCompleted && sendableViews.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-2.5 py-2 shadow-inner shadow-violet-500/5 dark:border-violet-800/40 dark:from-violet-900/20 dark:via-slate-900 dark:to-cyan-900/10">
                              <span className="hidden text-[9px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300 sm:inline-flex">
                                {t("doctor.consultationDetail.sendAiToChat", { defaultValue: "Send AI to chat" })}
                              </span>
                              {sendableViews.map((item) => (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => handleSendAiImageToChat({ imageUrl: item.url, caption: item.caption })}
                                  disabled={isSubmitting}
                                  className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r px-3 py-2 text-[10px] font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 ${item.className}`}
                                >
                                  <item.icon className="h-3.5 w-3.5" />
                                  {isSubmitting
                                    ? t("common.sending", { defaultValue: "Sending..." })
                                    : item.label}
                                </button>
                              ))}
                            </div>
                          )}
                          {isCompleted && (
                            <button onClick={() => {
                              setReviewingRequestId(aiResult.request_id);
                              setReviewForm({ status: reviewStatus === "pending_review" ? "approved" : reviewStatus, note: aiResult.review_note || "" });
                            }}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-100 transition">
                              <Eye className="h-3 w-3" />
                              {reviewStatus === "pending_review"
                                ? t("doctor.consultationDetail.addReview", { defaultValue: "Add Review" })
                                : t("doctor.consultationDetail.editReview", { defaultValue: "Edit Review" })}
                            </button>
                          )}
                          {isCompleted && (
                            <button onClick={() => setExpandedImage(isExpanded ? null : idx)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border-main/50 px-2.5 py-1 text-[10px] font-bold text-text-main hover:bg-bg-app transition">
                              <Brain className="h-3 w-3 text-purple-500" />
                              {isExpanded
                                ? t("doctor.consultationDetail.hideFindings", { defaultValue: "Hide" })
                                : t("doctor.consultationDetail.findings", { defaultValue: "Findings" })}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Findings */}
                      {isCompleted && isExpanded && (
                        <div className="border-t border-border-main/30 bg-indigo-50/20 dark:bg-indigo-950/20 p-4">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5">
                                {t("doctor.consultationDetail.finding", { defaultValue: "Finding" })}
                              </p>
                              <div className="rounded-xl bg-white/50 dark:bg-slate-900/50 p-3 border border-indigo-100 dark:border-indigo-900/30">
                                <p className="text-xs leading-relaxed text-text-main">{aiResult.result_summary}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
                                {t("doctor.consultationDetail.recommendation", { defaultValue: "Recommendation" })}
                              </p>
                              <div className="rounded-xl bg-white/50 dark:bg-slate-900/50 p-3 border border-emerald-100 dark:border-emerald-900/30">
                                <p className="text-xs leading-relaxed text-text-main">{aiResult.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Inline Review Panel */}
                      {reviewingRequestId === aiResult?.request_id && (
                        <div className="border-t border-border-main/30 bg-bg-app/50 p-4">
                          <p className="text-xs font-bold text-text-main mb-3">
                            {t("doctor.consultationDetail.reviewResult", { defaultValue: "Review AI Result" })}
                          </p>
                          <select value={reviewForm.status}
                            onChange={(e) => setReviewForm(p => ({ ...p, status: e.target.value }))}
                            className="w-full rounded-xl border border-border-main/60 bg-bg-surface px-3 py-2 text-xs text-text-main dark:bg-slate-800 mb-2">
                            {Object.keys(REVIEW_STATUS_CONFIG).map((k) => (
                              <option key={k} value={k}>{getReviewStatusLabel(k, t)}</option>
                            ))}
                          </select>
                          <textarea rows={2} value={reviewForm.note}
                            onChange={(e) => setReviewForm(p => ({ ...p, note: e.target.value }))}
                            placeholder={t("doctor.consultationDetail.reviewNote", { defaultValue: "Review note (optional)..." })}
                            className="w-full resize-none rounded-xl border border-border-main/60 bg-bg-surface px-3 py-2 text-xs text-text-main outline-none focus:ring-2 focus:ring-indigo-400/40 dark:bg-slate-800 mb-2" />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setReviewingRequestId(null)}
                              className="rounded-xl border border-border-main/60 px-3 py-1.5 text-xs font-semibold text-text-dim hover:bg-bg-app transition">
                              {t("common.cancel", { defaultValue: "Cancel" })}
                            </button>
                            <button onClick={() => handleSubmitReview(aiResult.request_id)} disabled={reviewSubmitting}
                              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-60">
                              {reviewSubmitting ? t("common.saving", { defaultValue: "Saving..." }) : t("common.save", { defaultValue: "Save Review" })}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── AI Summary Report ── */}
          {completedAI.length > 0 && (
            <div className={`${GLASS_CARD} overflow-hidden`}>
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-5 py-3.5 dark:from-indigo-900/20 dark:to-purple-900/20">
                <h2 className="flex items-center gap-2 text-sm font-bold text-text-main">
                  <Brain className="h-4 w-4 text-indigo-500" />
                  {t("doctor.consultationDetail.aiReport", { defaultValue: "AI Analysis Report" })}
                </h2>
                <p className="mt-0.5 text-[11px] text-text-dim">
                  {t("doctor.consultationDetail.aiReportDesc", { defaultValue: "Summary of AI model analysis across all images" })}
                </p>
              </div>
              <div className="p-4 space-y-3">
                {completedAI.map((res, i) => (
                  <div key={i} className="rounded-xl border border-border-main/50 bg-bg-app/40 p-3.5 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-text-main">
                        {t("doctor.consultationDetail.imageId", { defaultValue: "Image" })} #{res.consultation_image_id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-text-dim">{res.confidence_score}%</span>
                        <RiskBadge level={res.risk_level} t={t} />
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-text-main mb-2">
                      <span className="font-bold">{t("doctor.consultationDetail.finding", { defaultValue: "Finding" })}:</span> {res.result_summary}
                    </p>
                    <div className="rounded-lg bg-indigo-50/60 p-2.5 dark:bg-indigo-900/10">
                      <p className="text-xs leading-relaxed text-indigo-700 dark:text-indigo-300">
                        <span className="font-bold">{t("doctor.consultationDetail.suggestion", { defaultValue: "Suggestion" })}:</span> {res.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CHAT ── */}
          <div className={`${GLASS_CARD} flex flex-col overflow-hidden`} id="consultation-chat">
            <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 px-5 py-3.5 dark:from-cyan-900/20 dark:to-teal-900/20">
              <h2 className="flex items-center gap-2 text-sm font-bold text-text-main">
                <MessageSquare className="h-4 w-4 text-cyan-500" />
                {t("doctor.consultationDetail.chatTitle", { defaultValue: "Diagnosis & Consultation History" })}
              </h2>
            </div>

            {/* Messages with fixed height scroll */}
            <div className="overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
              {data.responses && data.responses.length > 0 ? (
                data.responses.map((resp) => {
                  const isDoctor = resp.responder_role === "doctor" || resp.responder_role === "admin" || resp.responder_role === "super_admin" || resp.responder_role === "clinic_owner";
                  const attachments = Array.isArray(resp.attachments) ? resp.attachments : [];
                  const messageText = typeof resp.content === "string" ? resp.content.trim() : "";
                  return (
                    <div key={resp.id} className={`flex flex-col max-w-[85%] ${isDoctor ? "ml-auto items-end" : "items-start"}`}>
                      <span className="text-[10px] text-text-dim mb-1 font-semibold">
                        {resp.responder_name} · {new Date(resp.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                        isDoctor
                          ? resp.response_type === "diagnosis"
                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm"
                          : "bg-bg-app text-text-main dark:bg-slate-700/60"
                      }`}>
                        {resp.response_type === "diagnosis" && (
                          <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-1">
                            <Activity className="h-3 w-3" /> {t("doctor.consultationDetail.msgType.diagnosis", { defaultValue: "Medical Conclusion" })}
                          </div>
                        )}
                        {messageText && <p className="whitespace-pre-line leading-relaxed">{messageText}</p>}
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
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-text-dim py-8">
                  <MessageSquare className="h-8 w-8 text-text-dim/30 mb-2" />
                  <p className="text-sm">{t("doctor.consultationDetail.noMessages", { defaultValue: "No messages yet." })}</p>
                </div>
              )}
            </div>

            {/* Reply Form */}
            {data.status !== "completed" ? (
              <form onSubmit={(e) => handleReplySubmit(e, false)} className="border-t border-border-main/40 bg-bg-app/40 p-4 dark:bg-slate-800/40">
                {replyError && (
                  <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/15 dark:text-rose-300">
                    {replyError}
                  </div>
                )}
                {(role === "doctor" || role === "super_admin" || role === "admin") && (
                  <div className="mb-2">
                    <select value={replyType} onChange={(e) => setReplyType(e.target.value)}
                      className="rounded-xl border border-border-main/60 bg-bg-surface px-3 py-1.5 text-xs font-medium text-text-main dark:bg-slate-800">
                      <option value="message">{t("doctor.consultationDetail.replyType.message", { defaultValue: "Message" })}</option>
                      <option value="diagnosis">{t("doctor.consultationDetail.replyType.diagnosis", { defaultValue: "Diagnosis" })}</option>
                      <option value="recommendation">{t("doctor.consultationDetail.replyType.recommendation", { defaultValue: "Recommendation" })}</option>
                      <option value="prescription_note">{t("doctor.consultationDetail.replyType.prescription", { defaultValue: "Prescription Note" })}</option>
                    </select>
                  </div>
                )}
                {(role === "doctor" || role === "super_admin" || role === "admin") && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <input
                      ref={replyFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleReplyAttachmentsChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => replyFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-800/40 dark:bg-cyan-900/15 dark:text-cyan-300"
                    >
                      <Image className="h-3.5 w-3.5" />
                      {t("doctor.consultationDetail.attachImages", { defaultValue: "Gửi ảnh" })}
                    </button>
                    {replyAttachments.length > 0 && (
                      <button
                        type="button"
                        onClick={clearReplyAttachments}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border-main/60 px-3 py-1.5 text-xs font-semibold text-text-dim transition hover:bg-bg-surface"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {t("doctor.consultationDetail.clearImages", { defaultValue: "Xóa ảnh đã chọn" })}
                      </button>
                    )}
                    {replyAttachments.length > 0 && (
                      <span className="text-[11px] font-medium text-text-dim">
                        {replyAttachments.length}/{MAX_REPLY_ATTACHMENTS}
                      </span>
                    )}
                  </div>
                )}
                {replyAttachments.length > 0 && (
                  <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {replyAttachments.map((attachment) => (
                      <div key={attachment.id} className="group relative overflow-hidden rounded-xl border border-border-main/60 bg-bg-surface">
                        <img
                          src={attachment.previewUrl}
                          alt={attachment.file.name}
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeReplyAttachment(attachment.id)}
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/70 text-white opacity-90 transition hover:bg-rose-600"
                          aria-label={t("common.remove", { defaultValue: "Remove" })}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    placeholder={role === "patient"
                      ? t("doctor.consultationDetail.patientPlaceholder", { defaultValue: "Type your question..." })
                      : t("doctor.consultationDetail.doctorPlaceholder", { defaultValue: "Type your response..." })
                    }
                    className="flex-1 resize-none rounded-xl border border-border-main/60 bg-bg-surface px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-cyan-400/40 dark:bg-slate-800" />
                </div>
                <div className="mt-2 flex gap-2 justify-end">
                  {(role === "doctor" || role === "super_admin" || role === "admin") && (
                    <button type="button" onClick={(e) => handleReplySubmit(e, true)}
                      disabled={isSubmitting || (!replyText.trim() && replyAttachments.length === 0)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {t("doctor.consultationDetail.sendComplete", { defaultValue: "Send & Complete" })}
                    </button>
                  )}
                  <button type="submit"
                    disabled={isSubmitting || (!replyText.trim() && replyAttachments.length === 0)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-600 disabled:opacity-50">
                    <Send className="h-3.5 w-3.5" />
                    {isSubmitting ? t("common.sending", { defaultValue: "Sending..." }) : t("doctor.consultationDetail.send", { defaultValue: "Send" })}
                  </button>
                </div>
              </form>
            ) : (
              <div className="border-t border-border-main/40 bg-emerald-50/50 p-4 dark:bg-emerald-900/10">
                <p className="text-center text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                  {t("doctor.consultationDetail.caseCompleted", { defaultValue: "This consultation has been marked as completed." })}
                </p>
                {(role === "doctor" || role === "super_admin" || role === "admin") && (
                  <div className="flex justify-center">
                    <button type="button" onClick={handleReopenCase} disabled={reopenSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50/60 px-5 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-900/15 dark:text-amber-300 disabled:opacity-50">
                      <RefreshCw className={`h-4 w-4 ${reopenSubmitting ? "animate-spin" : ""}`} />
                      {reopenSubmitting ? t("common.processing", { defaultValue: "Processing..." }) : t("doctor.consultationDetail.reopenCase", { defaultValue: "Reopen Case" })}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>{/* end right col */}
      </div>{/* end main grid */}

      {/* ── AI Confirm Modal ── */}
      <ConfirmModal
        isOpen={confirmAiImageId !== null}
        title={t("doctor.consultationDetail.aiConfirmTitle", { defaultValue: "Send image to Holora AI for analysis?" })}
        description={t("doctor.consultationDetail.aiConfirmDesc", { defaultValue: "This may take a few seconds as the image is sent to the AI model service for processing." })}
        badgeLabel="Holora AI"
        tone="info"
        confirmLabel={t("doctor.consultationDetail.aiConfirmBtn", { defaultValue: "Run Analysis" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        closeLabel={t("common.close", { defaultValue: "Close" })}
        onConfirm={() => startRequestAI(confirmAiImageId)}
        onClose={() => setConfirmAiImageId(null)}
      />

      {/* ── Prescription Form Modal ── */}
      <PrescriptionFormModal
        isOpen={showRxForm}
        onClose={() => { setShowRxForm(false); setEditingRx(null); }}
        patientName={data?.patient_name}
        initialData={editingRx}
        onSubmit={async (formData) => {
          try {
            if (editingRx) {
              await updatePrescriptionApi(editingRx.id, formData);
            } else {
              if (!data?.patient_id) {
                throw new Error(t("prescription.error.noPatientId", { defaultValue: "Không xác định được ID bệnh nhân." }));
              }
              await createPrescriptionApi({
                ...formData,
                consultation_id: Number(id),
                patient_id: Number(data.patient_id),
              });
            }
            await fetchPrescriptions();
          } catch (err) {
            console.error("Prescription error:", err);
            throw err;
          }
        }}
      />

      {/* ── Prescription Detail Modal ── */}
      <PrescriptionDetailModal
        isOpen={viewRxDetail !== null}
        onClose={() => setViewRxDetail(null)}
        prescriptionData={viewRxDetail}
      />

      {/* Image Preview Modal */}
      {currentPreview && imagePreview && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 px-3 py-4 backdrop-blur-sm"
          onClick={closePreview}
          role="presentation"
        >
          <div
            className="relative flex h-[92vh] w-full max-w-[1680px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={currentPreview.title}
          >
            <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-900/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-400">
                  {currentPreview.source}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-slate-100 sm:text-base">
                    {currentPreview.title}
                  </h3>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                    {currentPreviewIndex + 1} / {previewItems.length}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                    {previewZoom.scale.toFixed(1)}x
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {t("doctor.consultationDetail.previewHint", {
                    defaultValue: "Use left and right arrows to switch images, wheel to zoom, and drag to pan.",
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPreview(-1)}
                  disabled={previewItems.length <= 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t("common.previous", { defaultValue: "Previous" })}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={resetPreviewTransform}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/15"
                  aria-label={t("common.reset", { defaultValue: "Reset zoom" })}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("common.reset", { defaultValue: "Reset" })}
                </button>
                <button
                  type="button"
                  onClick={() => adjustPreviewZoom(-0.18)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/15"
                  aria-label={t("common.zoomOut", { defaultValue: "Zoom out" })}
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustPreviewZoom(0.18)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/15"
                  aria-label={t("common.zoomIn", { defaultValue: "Zoom in" })}
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goToPreview(1)}
                  disabled={previewItems.length <= 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={t("common.next", { defaultValue: "Next" })}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15 text-rose-200 transition hover:bg-rose-500/25"
                  aria-label={t("common.close", { defaultValue: "Close" })}
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative flex flex-1 overflow-hidden bg-black">
              <button
                type="button"
                onClick={() => goToPreview(-1)}
                disabled={previewItems.length <= 1}
                className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 disabled:hidden lg:inline-flex"
                aria-label={t("common.previous", { defaultValue: "Previous" })}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() => goToPreview(1)}
                disabled={previewItems.length <= 1}
                className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 disabled:hidden lg:inline-flex"
                aria-label={t("common.next", { defaultValue: "Next" })}
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <div className="absolute left-4 top-4 z-10 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
                {t("doctor.consultationDetail.previewDragHint", {
                  defaultValue: "Drag to pan or use the wheel to zoom",
                })}
              </div>

              <div className="absolute right-4 top-4 z-10 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
                {currentPreview.kind === "ai"
                  ? `${t("doctor.consultationDetail.aiLabel", { defaultValue: "AI" })} · ${getAiViewLabel(currentPreview.view, t)}`
                  : t("doctor.consultationDetail.originalLabel", { defaultValue: "Original" })}
              </div>

              <div
                className="flex h-full w-full items-center justify-center overflow-hidden px-4 py-4"
                onWheel={handlePreviewWheel}
                onPointerDown={handlePreviewPointerDown}
                onPointerMove={handlePreviewPointerMove}
                onPointerUp={endPreviewDrag}
                onPointerLeave={endPreviewDrag}
                onPointerCancel={endPreviewDrag}
                onDoubleClick={resetPreviewTransform}
              >
                <img
                  src={currentPreview.src}
                  alt={currentPreview.title}
                  className={`max-h-full max-w-full select-none object-contain will-change-transform transition-transform duration-75 ${
                    previewZoom.scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                  }`}
                  style={{
                    transform: `translate3d(${previewZoom.x}px, ${previewZoom.y}px, 0) scale(${previewZoom.scale})`,
                    transformOrigin: "center center",
                  }}
                  draggable="false"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorConsultationDetailPage;
