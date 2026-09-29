import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, ClipboardList, Pill, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getPrescriptionByIdApi } from "../services/prescriptionService";

const GLASS = "backdrop-blur-xl bg-white/60 dark:bg-slate-900/50 border border-white/30 dark:border-slate-700/40 shadow-lg shadow-black/[0.03]";

const STATUS_CONFIG = {
  draft:     { label: "Nháp",       icon: Clock,       cls: "bg-amber-100/80 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300" },
  issued:    { label: "Đã phát hành", icon: CheckCircle, cls: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300" },
  cancelled: { label: "Đã hủy",     icon: XCircle,     cls: "bg-red-100/80 text-red-700 dark:bg-red-900/25 dark:text-red-300" },
};

const formatDateTime = (v, lng) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString(lng === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const getPrescriptionStatusLabel = (status, t) => ({
  draft: t("prescription.status.draft", { defaultValue: "Draft" }),
  issued: t("prescription.status.issued", { defaultValue: "Issued" }),
  cancelled: t("prescription.status.cancelled", { defaultValue: "Cancelled" }),
}[status] || status);

const getPrescriptionRouteLabel = (route, t) => ({
  "Uống": t("prescription.routeOptions.oral", { defaultValue: "Oral" }),
  oral: t("prescription.routeOptions.oral", { defaultValue: "Oral" }),
  "Tiêm": t("prescription.routeOptions.injection", { defaultValue: "Injection" }),
  injection: t("prescription.routeOptions.injection", { defaultValue: "Injection" }),
  "Bôi": t("prescription.routeOptions.topical", { defaultValue: "Topical" }),
  topical: t("prescription.routeOptions.topical", { defaultValue: "Topical" }),
  "Nhỏ": t("prescription.routeOptions.drop", { defaultValue: "Drops" }),
  drop: t("prescription.routeOptions.drop", { defaultValue: "Drops" }),
  "Xịt": t("prescription.routeOptions.spray", { defaultValue: "Spray" }),
  spray: t("prescription.routeOptions.spray", { defaultValue: "Spray" }),
  "Đặt": t("prescription.routeOptions.insert", { defaultValue: "Insert" }),
  insert: t("prescription.routeOptions.insert", { defaultValue: "Insert" }),
  "Ngậm": t("prescription.routeOptions.sublingual", { defaultValue: "Sublingual" }),
  sublingual: t("prescription.routeOptions.sublingual", { defaultValue: "Sublingual" }),
  "Hít": t("prescription.routeOptions.inhalation", { defaultValue: "Inhalation" }),
  inhalation: t("prescription.routeOptions.inhalation", { defaultValue: "Inhalation" }),
}[route] || route || "—");

const getPrescriptionUnitLabel = (unit, t) => ({
  "viên": t("prescription.unitOptions.tablet", { defaultValue: "tablet" }),
  tablet: t("prescription.unitOptions.tablet", { defaultValue: "tablet" }),
  "gói": t("prescription.unitOptions.pack", { defaultValue: "pack" }),
  pack: t("prescription.unitOptions.pack", { defaultValue: "pack" }),
  "ống": t("prescription.unitOptions.ampoule", { defaultValue: "ampoule" }),
  ampoule: t("prescription.unitOptions.ampoule", { defaultValue: "ampoule" }),
  "chai": t("prescription.unitOptions.bottle", { defaultValue: "bottle" }),
  bottle: t("prescription.unitOptions.bottle", { defaultValue: "bottle" }),
  "tuýp": t("prescription.unitOptions.tube", { defaultValue: "tube" }),
  tube: t("prescription.unitOptions.tube", { defaultValue: "tube" }),
  "lọ": t("prescription.unitOptions.vial", { defaultValue: "vial" }),
  vial: t("prescription.unitOptions.vial", { defaultValue: "vial" }),
  ml: t("prescription.unitOptions.ml", { defaultValue: "ml" }),
  mg: t("prescription.unitOptions.mg", { defaultValue: "mg" }),
}[unit] || unit || "—");

const PrescriptionDetailModal = ({ isOpen, onClose, prescriptionId, prescriptionData }) => {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPrescription = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await getPrescriptionByIdApi(id);
      setFetchedData(res.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || prescriptionData || !prescriptionId) return;
    fetchPrescription(prescriptionId);
  }, [isOpen, prescriptionId, prescriptionData, fetchPrescription]);

  if (!isOpen) return null;

  const p = prescriptionData || fetchedData;
  const status = p ? STATUS_CONFIG[p.status] || STATUS_CONFIG.draft : null;
  const StatusIcon = status?.icon;
  const statusLabel = p ? getPrescriptionStatusLabel(p.status, t) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl ${GLASS} p-0`}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-border-main/40 bg-emerald-50/80 px-6 py-4 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">
                {t("prescription.detail.title", { defaultValue: "Chi tiết toa thuốc" })}
              </h2>
              {p && <p className="text-xs text-text-dim font-mono">{p.prescription_code}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-text-dim hover:bg-black/5 dark:hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : !p ? (
          <div className="p-8 text-center text-sm text-text-dim">
            {t("prescription.detail.notFound", { defaultValue: "Không tìm thấy toa thuốc." })}
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim">{t("prescription.detail.status", { defaultValue: "Trạng thái" })}</p>
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.cls}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusLabel}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim">{t("prescription.detail.createdAt", { defaultValue: "Ngày tạo" })}</p>
                <p className="mt-1 text-sm text-text-main">{formatDateTime(p.created_at, lng)}</p>
              </div>
              {p.issued_at && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim">{t("prescription.detail.issuedAt", { defaultValue: "Ngày phát hành" })}</p>
                  <p className="mt-1 text-sm text-text-main">{formatDateTime(p.issued_at, lng)}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim">{t("prescription.detail.doctor", { defaultValue: "Bác sĩ" })}</p>
                <p className="mt-1 text-sm font-semibold text-text-main">{p.doctor_name || "—"}</p>
              </div>
            </div>

            {p.patient_name && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim">{t("prescription.detail.patient", { defaultValue: "Bệnh nhân" })}</p>
                <p className="mt-1 text-sm font-semibold text-text-main">{p.patient_name}</p>
              </div>
            )}

            {/* Diagnosis */}
            {p.diagnosis && (
              <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/40 p-4 dark:border-emerald-800/30 dark:bg-emerald-900/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                  {t("prescription.detail.diagnosis", { defaultValue: "Chẩn đoán" })}
                </p>
                <p className="text-sm text-text-main leading-relaxed">{p.diagnosis}</p>
              </div>
            )}

            {/* Items */}
            {p.items && p.items.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim mb-3 flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-emerald-500" />
                  {t("prescription.detail.medications", { defaultValue: "Danh sách thuốc" })} ({p.items.length})
                </p>
                <div className="space-y-2">
                  {p.items.map((item, idx) => (
                    <div key={item.id || idx} className="rounded-xl border border-border-main/40 bg-bg-surface/50 p-4 dark:bg-slate-800/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-bold text-text-main">{item.medication_name}</span>
                        </div>
                        {item.dosage && (
                          <span className="shrink-0 rounded-full bg-cyan-100/80 px-2.5 py-0.5 text-[10px] font-bold text-cyan-700 dark:bg-cyan-900/25 dark:text-cyan-300">
                            {item.dosage}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        {item.frequency && (
                          <div>
                            <span className="text-text-dim">{t("prescription.detail.freq", { defaultValue: "Tần suất" })}:</span>
                            <span className="ml-1 font-semibold text-text-main">{item.frequency}</span>
                          </div>
                        )}
                        {item.duration && (
                          <div>
                            <span className="text-text-dim">{t("prescription.detail.duration", { defaultValue: "Thời gian" })}:</span>
                            <span className="ml-1 font-semibold text-text-main">{item.duration}</span>
                          </div>
                        )}
                        {item.quantity && (
                          <div>
                            <span className="text-text-dim">{t("prescription.detail.qty", { defaultValue: "Số lượng" })}:</span>
                            <span className="ml-1 font-semibold text-text-main">{item.quantity} {getPrescriptionUnitLabel(item.unit, t)}</span>
                          </div>
                        )}
                        {item.route && (
                          <div>
                            <span className="text-text-dim">{t("prescription.detail.route", { defaultValue: "Đường dùng" })}:</span>
                            <span className="ml-1 font-semibold text-text-main">{getPrescriptionRouteLabel(item.route, t)}</span>
                          </div>
                        )}
                      </div>
                      {item.instructions && (
                        <p className="mt-2 text-xs italic text-text-dim border-t border-border-main/20 pt-2">
                          📝 {item.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {p.notes && (
              <div className="rounded-xl border border-amber-200/50 bg-amber-50/40 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                  {t("prescription.detail.notes", { defaultValue: "Ghi chú" })}
                </p>
                <p className="text-sm text-text-main italic leading-relaxed">{p.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDetailModal;
