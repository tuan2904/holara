import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, ImagePlus, Loader2, Send, Stethoscope, UserCheck, X } from "lucide-react";
import { consultationService } from "../services/consultationService";
import { uploadService } from "../services/uploadService";
import branchService from "../services/branchService";
import api from "../services/api";

const MAX_FILES = 3;


const PatientConsultationRequestPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const fromAppointmentId = searchParams.get("appointmentId") || null;
  const fromBranchId = searchParams.get("branchId") || null;
  const fromDoctorId = searchParams.get("doctorId") || null;

  // Whether this form was opened from an appointment (locks branch+doctor)
  const isFromAppointment = Boolean(fromAppointmentId && fromBranchId && fromDoctorId);

  const [formData, setFormData] = useState({ chief_complaint: "", symptoms: "" });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Branch & Doctor selection
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  // Load branches on mount
  useEffect(() => {
    branchService.getAllBranches()
      .then((res) => setBranches(res.data || []))
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false));
  }, []);

  // When branches are loaded and fromBranchId is set → auto-select branch & load doctors
  useEffect(() => {
    if (fromBranchId && branches.length > 0 && selectedBranchId === "") {
      setSelectedBranchId(fromBranchId);
      setLoadingDoctors(true);
      api.get(`/doctors/search?branch_id=${fromBranchId}&status=active&limit=50`)
        .then((res) => setDoctors(res.data?.data || []))
        .catch(() => setDoctors([]))
        .finally(() => setLoadingDoctors(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromBranchId, branches]);

  // When doctors are loaded and fromDoctorId is set → auto-select doctor
  useEffect(() => {
    if (fromDoctorId && doctors.length > 0 && selectedDoctorId === "") {
      setSelectedDoctorId(fromDoctorId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDoctorId, doctors]);

  // Load doctors when branch changes
  const handleBranchChange = async (branchId) => {
    setSelectedBranchId(branchId);
    setSelectedDoctorId("");
    setDoctors([]);
    if (!branchId) return;
    setLoadingDoctors(true);
    try {
      const res = await api.get(`/doctors/search?branch_id=${branchId}&status=active&limit=50`);
      setDoctors(res.data?.data || []);
    } catch {
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > MAX_FILES) {
      setError(t("patient.consultationRequestPage.errors.tooManyFiles", { max: MAX_FILES }));
      return;
    }
    setError(null);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setSelectedFiles((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (idx) => {
    URL.revokeObjectURL(previewUrls[idx]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let attachmentUrls = [];
      if (selectedFiles.length > 0) {
        const uploadData = new FormData();
        selectedFiles.forEach((file) => uploadData.append("attachments", file));
        const uploadRes = await uploadService.uploadImages(uploadData);
        attachmentUrls = uploadRes.urls;
      }

      await consultationService.createRequest({
        ...formData,
        attachments: attachmentUrls,
        doctor_id: selectedDoctorId ? Number(selectedDoctorId) : null,
        ...(fromAppointmentId ? { appointment_id: Number(fromAppointmentId) } : {}),
      });
      setSuccess(true);
      setTimeout(() => navigate("/patient/consultations"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("patient.consultationRequestPage.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-text-main">{t("patient.consultationRequestPage.successTitle")}</h2>
        <p className="text-sm text-text-dim">{t("patient.consultationRequestPage.successSubtitle")}</p>
        <Loader2 className="h-5 w-5 animate-spin text-[#E06666]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-0 pb-10 sm:px-2">
      {/* Hero header */}
      <section className="overflow-hidden rounded-[24px] bg-gradient-to-br from-[#E06666] to-[#C04444] p-6 text-white shadow-lg sm:p-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("patient.consultationRequestPage.backButton")}
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              {t("patient.zone") || "Patient Zone"}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {t("patient.consultationRequestPage.heroTitle")}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {t("patient.consultationRequestPage.heroSubtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Appointment link banner */}
      {fromAppointmentId && (
        <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/10 p-4 text-sm text-violet-700 dark:text-violet-400">
          <span className="text-lg">🔗</span>
          <span>
            Tư vấn này sẽ được liên kết với{" "}
            <strong>lịch hẹn #{fromAppointmentId}</strong>.{" "}
            <button
              type="button"
              onClick={() => navigate(`/patient/appointments/${fromAppointmentId}`)}
              className="underline hover:no-underline"
            >
              Xem lịch hẹn
            </button>
          </span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Step 0: Branch */}
        <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="border-b border-border-main bg-bg-app px-4 py-3 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              {t("patient.consultationRequestPage.stepBranchLabel") || "Bước 1 — Chọn chi nhánh"}  <span className="text-[#E06666]">*</span>
              {isFromAppointment && (
                <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                  Tự động điền
                </span>
              )}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            {isFromAppointment ? (
              /* Read-only display when pre-filled from appointment */
              <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-800/40 dark:bg-violet-900/10">
                <Building2 className="h-4 w-4 flex-shrink-0 text-violet-500" />
                <div>
                  <p className="text-sm font-semibold text-text-main">
                    {branches.find((b) => String(b.id) === String(fromBranchId))?.name || `Chi nhánh #${fromBranchId}`}
                  </p>
                  <p className="text-xs text-text-dim">Lấy từ lịch hẹn · Không thể thay đổi</p>
                </div>
              </div>
            ) : loadingBranches ? (
              <div className="flex items-center gap-2 text-sm text-text-dim">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh sách chi nhánh...
              </div>
            ) : (
              <select
                required
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/50 dark:bg-slate-900"
              >
                <option value="">{t("patient.consultationRequestPage.branchPlaceholder") || "-- Chọn chi nhánh bạn muốn đăng ký khám --"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}{b.city ? ` — ${b.city}` : ""}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Step 0b: Doctor */}
        <div className={`overflow-hidden rounded-2xl border bg-bg-surface shadow-sm dark:bg-slate-800 transition-opacity ${
          selectedBranchId ? "border-border-main opacity-100" : "border-border-main/40 opacity-50 pointer-events-none"
        }`}>
          <div className="border-b border-border-main bg-bg-app px-4 py-3 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5" />
              {t("patient.consultationRequestPage.stepDoctorLabel") || "Bước 2 — Chọn bác sĩ"} <span className="text-[#E06666]">*</span>
              {isFromAppointment && (
                <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                  Tự động điền
                </span>
              )}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            {isFromAppointment && selectedDoctorId ? (
              /* Read-only display when pre-filled from appointment */
              (() => {
                const doc = doctors.find((d) => String(d.id) === String(selectedDoctorId));
                return (
                  <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-800/40 dark:bg-violet-900/10">
                    <UserCheck className="h-4 w-4 flex-shrink-0 text-violet-500" />
                    <div>
                      <p className="text-sm font-semibold text-text-main">
                        {doc ? doc.full_name : `Bác sĩ #${selectedDoctorId}`}
                      </p>
                      {doc?.specialty_name && (
                        <p className="text-xs text-text-dim">{doc.specialty_name}</p>
                      )}
                      <p className="text-xs text-text-dim">Lấy từ lịch hẹn · Không thể thay đổi</p>
                    </div>
                  </div>
                );
              })()
            ) : isFromAppointment && loadingDoctors ? (
              <div className="flex items-center gap-2 text-sm text-text-dim">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải thông tin bác sĩ...
              </div>
            ) : loadingDoctors ? (
              <div className="flex items-center gap-2 text-sm text-text-dim">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh sách bác sĩ...
              </div>
            ) : !selectedBranchId ? (
              <p className="text-sm text-text-dim italic">{t("patient.consultationRequestPage.selectBranchFirst") || "Vui lòng chọn chi nhánh trước."}</p>
            ) : doctors.length === 0 ? (
              <p className="text-sm text-amber-600">{t("patient.consultationRequestPage.noDoctorsInBranch") || "Chi nhánh này hiện chưa có bác sĩ hoạt động."}</p>
            ) : (
              <>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/50 dark:bg-slate-900"
                >
                  <option value="">{t("patient.consultationRequestPage.doctorPlaceholder") || "-- Chọn bác sĩ phụ trách --"}</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}{d.specialty_name ? ` — ${d.specialty_name}` : ""}
                    </option>
                  ))}
                </select>
                {selectedDoctorId && (() => {
                  const doc = doctors.find(d => String(d.id) === String(selectedDoctorId));
                  return doc ? (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-900/15">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{doc.full_name}</p>
                        {doc.specialty_name && <p className="text-xs text-emerald-600 dark:text-emerald-400">{doc.specialty_name}</p>}
                      </div>
                    </div>
                  ) : null;
                })()}
              </>
            )}
          </div>
        </div>

        {/* Chief complaint */}
        <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="border-b border-border-main bg-bg-app px-4 py-3 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">
              {t("patient.consultationRequestPage.step1Label")}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <label className="mb-1.5 block text-sm font-medium text-text-main">
              {t("patient.consultationRequestPage.chiefComplaintLabel")} <span className="text-[#E06666]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={formData.chief_complaint}
              onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
              placeholder={t("patient.consultationRequestPage.chiefComplaintPlaceholder")}
              className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-main outline-none transition placeholder:text-text-dim focus:ring-2 focus:ring-[#E06666]/50 dark:bg-slate-900"
            />
            <p className="mt-1.5 text-xs text-text-dim">{t("patient.consultationRequestPage.charCount", { count: formData.chief_complaint.length })}</p>
          </div>
        </div>

        {/* Symptoms */}
        <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="border-b border-border-main bg-bg-app px-4 py-3 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">
              {t("patient.consultationRequestPage.step2Label")}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <label className="mb-1.5 block text-sm font-medium text-text-main">
              {t("patient.consultationRequestPage.symptomsLabel")} <span className="text-[#E06666]">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder={t("patient.consultationRequestPage.symptomsPlaceholder")}
              className="w-full resize-none rounded-xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-main outline-none transition placeholder:text-text-dim focus:ring-2 focus:ring-[#E06666]/50 dark:bg-slate-900"
            />
          </div>
        </div>

        {/* Attachments */}
        <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="border-b border-border-main bg-bg-app px-4 py-3 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-dim">
              {t("patient.consultationRequestPage.step3Label", { max: MAX_FILES })}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            {/* Upload button */}
            <label className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition
              ${selectedFiles.length >= MAX_FILES
                ? "cursor-not-allowed border-border-main bg-bg-app opacity-50"
                : "border-[#E06666]/30 bg-[#FFF5F5] text-[#E06666] hover:border-[#E06666]/60 hover:bg-[#FFECEC] dark:bg-[#E06666]/5 dark:hover:bg-[#E06666]/10"
              }`}
            >
              <ImagePlus className="h-5 w-5" />
              <span className="font-medium">
                {selectedFiles.length >= MAX_FILES ? t("patient.consultationRequestPage.uploadLimitReached") : t("patient.consultationRequestPage.uploadButton")}
              </span>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={selectedFiles.length >= MAX_FILES}
                onChange={handleFileChange}
              />
            </label>

            {/* Previews */}
            {previewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-border-main bg-bg-app shadow-sm">
                    <img src={url} alt={`preview-${idx}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <p className="mt-2 text-xs text-text-dim">{t("patient.consultationRequestPage.selectedCount", { count: selectedFiles.length, max: MAX_FILES })}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !selectedBranchId || !selectedDoctorId}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E06666] px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#D55555] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("patient.consultationRequestPage.submitting")}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {t("patient.consultationRequestPage.submitButton")}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PatientConsultationRequestPage;
