import { useTranslation } from "react-i18next";
import { ClipboardList, Pill, Clock, CheckCircle, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  draft:     { label: "Nháp",       icon: Clock,       cls: "bg-amber-100/80 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/25 dark:text-amber-300 dark:ring-amber-700/40" },
  issued:    { label: "Đã phát hành", icon: CheckCircle, cls: "bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/25 dark:text-emerald-300 dark:ring-emerald-700/40" },
  cancelled: { label: "Đã hủy",     icon: XCircle,     cls: "bg-red-100/80 text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/25 dark:text-red-300 dark:ring-red-700/40" },
};

const formatDate = (v, lng) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString(lng === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
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

const PrescriptionCard = ({ prescription, onViewDetail, onIssue, onCancel, onEdit, showActions = false, compact = false }) => {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const p = prescription;
  const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
  const StatusIcon = status.icon;
  const statusLabel = getPrescriptionStatusLabel(p.status, t);

  if (compact) {
    return (
      <div
        onClick={() => onViewDetail?.(p)}
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/40 px-4 py-3 transition hover:bg-emerald-50/70 dark:border-emerald-800/30 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <ClipboardList className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-main">{p.prescription_code}</p>
          <p className="text-xs text-text-dim">{p.items?.length || 0} {t("prescription.card.items", { defaultValue: "thuốc" })} · {formatDate(p.created_at, lng)}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.cls}`}>
          <StatusIcon className="h-3 w-3" />
          {statusLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200/50 bg-white/70 shadow-sm dark:border-emerald-800/30 dark:bg-slate-900/40">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-main/30 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-main">{p.prescription_code}</p>
            <p className="text-xs text-text-dim">
              {p.doctor_name && `${t("prescription.card.doctor", { defaultValue: "BS" })}: ${p.doctor_name} · `}
              {formatDate(p.created_at, lng)}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.cls}`}>
          <StatusIcon className="h-3 w-3" />
          {statusLabel}
        </span>
      </div>

      {/* Diagnosis */}
      {p.diagnosis && (
        <div className="border-b border-border-main/20 px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-dim mb-1">
            {t("prescription.card.diagnosis", { defaultValue: "Chẩn đoán" })}
          </p>
          <p className="text-sm text-text-main leading-relaxed">{p.diagnosis}</p>
        </div>
      )}

      {/* Items table */}
      {p.items && p.items.length > 0 && (
        <div className="px-5 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-main/30 text-left text-[10px] font-bold uppercase tracking-wider text-text-dim">
                <th className="pb-2 pr-2">#</th>
                <th className="pb-2 pr-2">{t("prescription.card.medName", { defaultValue: "Thuốc" })}</th>
                <th className="pb-2 pr-2 hidden sm:table-cell">{t("prescription.card.dosage", { defaultValue: "Liều" })}</th>
                <th className="pb-2 pr-2 hidden sm:table-cell">{t("prescription.card.freq", { defaultValue: "Tần suất" })}</th>
                <th className="pb-2 pr-2 hidden md:table-cell">{t("prescription.card.qty", { defaultValue: "SL" })}</th>
                <th className="pb-2 hidden md:table-cell">{t("prescription.card.route", { defaultValue: "Đường dùng" })}</th>
              </tr>
            </thead>
            <tbody>
              {p.items.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-border-main/10 last:border-b-0">
                  <td className="py-2 pr-2 text-text-dim">{idx + 1}</td>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-1.5">
                      <Pill className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-text-main">{item.medication_name}</span>
                    </div>
                    {item.instructions && (
                      <p className="mt-0.5 text-[10px] italic text-text-dim pl-4.5">{item.instructions}</p>
                    )}
                    {/* Mobile-only extra info */}
                    <div className="mt-0.5 text-[10px] text-text-dim sm:hidden">
                      {[item.dosage, item.frequency, item.quantity && `${item.quantity} ${getPrescriptionUnitLabel(item.unit, t)}`].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="py-2 pr-2 text-text-main hidden sm:table-cell">{item.dosage || "—"}</td>
                  <td className="py-2 pr-2 text-text-main hidden sm:table-cell">{item.frequency || "—"}</td>
                  <td className="py-2 pr-2 text-text-main hidden md:table-cell">{item.quantity ? `${item.quantity} ${getPrescriptionUnitLabel(item.unit, t)}` : "—"}</td>
                  <td className="py-2 text-text-main hidden md:table-cell">{getPrescriptionRouteLabel(item.route, t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {p.notes && (
        <div className="border-t border-border-main/20 px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-dim mb-1">
            {t("prescription.card.notes", { defaultValue: "Ghi chú" })}
          </p>
          <p className="text-xs text-text-main italic leading-relaxed">{p.notes}</p>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 border-t border-border-main/30 px-5 py-3">
          {onViewDetail && (
            <button onClick={() => onViewDetail(p)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
              {t("prescription.card.viewDetail", { defaultValue: "Xem chi tiết" })}
            </button>
          )}
          {p.status === "draft" && onEdit && (
            <button onClick={() => onEdit(p)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-cyan-600 transition hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20">
              {t("prescription.card.edit", { defaultValue: "Sửa" })}
            </button>
          )}
          {p.status === "draft" && onIssue && (
            <button onClick={() => onIssue(p.id)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600">
              {t("prescription.card.issue", { defaultValue: "Phát hành" })}
            </button>
          )}
          {p.status !== "cancelled" && onCancel && (
            <button onClick={() => onCancel(p.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
              {t("prescription.card.cancel", { defaultValue: "Hủy toa" })}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionCard;
