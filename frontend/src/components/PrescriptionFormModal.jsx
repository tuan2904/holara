import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Trash2, Pill, ClipboardList } from "lucide-react";

const GLASS = "backdrop-blur-xl bg-white/60 dark:bg-slate-900/50 border border-white/30 dark:border-slate-700/40 shadow-lg shadow-black/[0.03]";

const emptyItem = () => ({
  medication_name: "",
  dosage: "",
  frequency: "",
  duration: "",
  quantity: "",
  unit: "viên",
  route: "Uống",
  instructions: "",
});

const ROUTE_OPTIONS = ["Uống", "Tiêm", "Bôi", "Nhỏ", "Xịt", "Đặt", "Ngậm", "Hít"];
const UNIT_OPTIONS = ["viên", "gói", "ống", "chai", "tuýp", "lọ", "ml", "mg"];

const getRouteOptionLabel = (value, t) => ({
  "Uống": t("prescription.routeOptions.oral", { defaultValue: "Oral" }),
  "Tiêm": t("prescription.routeOptions.injection", { defaultValue: "Injection" }),
  "Bôi": t("prescription.routeOptions.topical", { defaultValue: "Topical" }),
  "Nhỏ": t("prescription.routeOptions.drop", { defaultValue: "Drops" }),
  "Xịt": t("prescription.routeOptions.spray", { defaultValue: "Spray" }),
  "Đặt": t("prescription.routeOptions.insert", { defaultValue: "Insert" }),
  "Ngậm": t("prescription.routeOptions.sublingual", { defaultValue: "Sublingual" }),
  "Hít": t("prescription.routeOptions.inhalation", { defaultValue: "Inhalation" }),
}[value] || value);

const getUnitOptionLabel = (value, t) => ({
  "viên": t("prescription.unitOptions.tablet", { defaultValue: "tablet" }),
  "gói": t("prescription.unitOptions.pack", { defaultValue: "pack" }),
  "ống": t("prescription.unitOptions.ampoule", { defaultValue: "ampoule" }),
  "chai": t("prescription.unitOptions.bottle", { defaultValue: "bottle" }),
  "tuýp": t("prescription.unitOptions.tube", { defaultValue: "tube" }),
  "lọ": t("prescription.unitOptions.vial", { defaultValue: "vial" }),
  ml: t("prescription.unitOptions.ml", { defaultValue: "ml" }),
  mg: t("prescription.unitOptions.mg", { defaultValue: "mg" }),
}[value] || value);

const PrescriptionFormModal = ({ isOpen, onClose, onSubmit, patientName, initialData }) => {
  const { t } = useTranslation();
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDiagnosis(initialData.diagnosis || "");
        setNotes(initialData.notes || "");
        setItems(initialData.items?.length ? initialData.items.map((it) => ({ ...emptyItem(), ...it })) : [emptyItem()]);
      } else {
        setDiagnosis("");
        setNotes("");
        setItems([emptyItem()]);
      }
      setError("");
    }
  }, [isOpen, initialData]);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validItems = items.filter((it) => it.medication_name.trim());
    if (validItems.length === 0) {
      setError(t("prescription.form.errorNoItems", { defaultValue: "Cần ít nhất 1 dòng thuốc." }));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        diagnosis,
        notes,
        items: validItems.map((it, idx) => ({ ...it, sort_order: idx })),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("prescription.form.errorCreate", { defaultValue: "Failed to create prescription" }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl ${GLASS} p-0`}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-border-main/40 bg-emerald-50/80 px-6 py-4 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">
                {initialData ? t("prescription.form.titleEdit", { defaultValue: "Sửa toa thuốc" }) : t("prescription.form.titleNew", { defaultValue: "Kê toa thuốc" })}
              </h2>
              {patientName && <p className="text-xs text-text-dim">{t("prescription.form.forPatient", { defaultValue: "Bệnh nhân" })}: {patientName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-text-dim hover:bg-black/5 dark:hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Diagnosis */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text-main">
              {t("prescription.form.diagnosis", { defaultValue: "Chẩn đoán" })}
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-border-main/60 bg-bg-surface px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-emerald-400/40 dark:bg-slate-800"
              placeholder={t("prescription.form.diagnosisPlaceholder", { defaultValue: "Nhập chẩn đoán bệnh..." })}
            />
          </div>

          {/* Medication Items */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold text-text-main flex items-center gap-2">
                <Pill className="h-4 w-4 text-emerald-500" />
                {t("prescription.form.medications", { defaultValue: "Danh sách thuốc" })}
              </label>
              <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-400">
                <Plus className="h-3.5 w-3.5" />
                {t("prescription.form.addMed", { defaultValue: "Thêm thuốc" })}
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-border-main/50 bg-bg-surface/50 p-4 dark:bg-slate-800/40">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Row 1: Name + Dosage */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                        {t("prescription.form.medName", { defaultValue: "Tên thuốc" })} *
                      </label>
                        <input
                          type="text"
                          value={item.medication_name}
                          onChange={(e) => updateItem(idx, "medication_name", e.target.value)}
                          className="w-full rounded-lg border border-border-main/60 bg-white px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-emerald-400/40 dark:bg-slate-800 dark:border-slate-600"
                          placeholder={t("prescription.form.exampleMedName", { defaultValue: "e.g. Paracetamol 500mg" })}
                          required
                        />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                        {t("prescription.form.dosage", { defaultValue: "Liều lượng" })}
                      </label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => updateItem(idx, "dosage", e.target.value)}
                          className="w-full rounded-lg border border-border-main/60 bg-white px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-emerald-400/40 dark:bg-slate-800 dark:border-slate-600"
                          placeholder={t("prescription.form.exampleDosage", { defaultValue: "e.g. 500mg" })}
                        />
                    </div>
                  </div>

                  {/* Row 2: Frequency + Duration + Quantity */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                        {t("prescription.form.frequency", { defaultValue: "Tần suất" })}
                      </label>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => updateItem(idx, "frequency", e.target.value)}
                          className="w-full rounded-lg border border-border-main/60 bg-white px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-emerald-400/40 dark:bg-slate-800 dark:border-slate-600"
                          placeholder={t("prescription.form.exampleFrequency", { defaultValue: "e.g. 3 times/day" })}
                        />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                        {t("prescription.form.duration", { defaultValue: "Thời gian" })}
                      </label>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => updateItem(idx, "duration", e.target.value)}
                          className="w-full rounded-lg border border-border-main/60 bg-white px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-emerald-400/40 dark:bg-slate-800 dark:border-slate-600"
                          placeholder={t("prescription.form.exampleDuration", { defaultValue: "e.g. 7 days" })}
                        />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                        {t("prescription.form.quantity", { defaultValue: "Số lượng" })}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          className="w-20 rounded-lg border border-border-main/60 bg-white px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-emerald-400/40 dark:bg-slate-800 dark:border-slate-600"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(idx, "unit", e.target.value)}
                          className="flex-1 rounded-lg border border-border-main/60 bg-white px-2 py-2 text-sm text-text-main dark:bg-slate-800 dark:border-slate-600"
                        >
                          {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{getUnitOptionLabel(u, t)}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Route + Instructions */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                        {t("prescription.form.route", { defaultValue: "Đường dùng" })}
                      </label>
                      <select
                        value={item.route}
                        onChange={(e) => updateItem(idx, "route", e.target.value)}
                        className="w-full rounded-lg border border-border-main/60 bg-white px-3 py-2 text-sm text-text-main dark:bg-slate-800 dark:border-slate-600"
                      >
                        {ROUTE_OPTIONS.map((r) => <option key={r} value={r}>{getRouteOptionLabel(r, t)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-dim">
                        {t("prescription.form.instructions", { defaultValue: "Ghi chú" })}
                      </label>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) => updateItem(idx, "instructions", e.target.value)}
                        className="w-full rounded-lg border border-border-main/60 bg-white px-3 py-2 text-sm text-text-main outline-none focus:ring-2 focus:ring-emerald-400/40 dark:bg-slate-800 dark:border-slate-600"
                        placeholder={t("prescription.form.exampleInstructions", { defaultValue: "e.g. Take after meals" })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-text-main">
              {t("prescription.form.notes", { defaultValue: "Ghi chú chung" })}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-border-main/60 bg-bg-surface px-4 py-3 text-sm text-text-main outline-none focus:ring-2 focus:ring-emerald-400/40 dark:bg-slate-800"
              placeholder={t("prescription.form.notesPlaceholder", { defaultValue: "Lời dặn, lưu ý cho bệnh nhân..." })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-border-main/30 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-border-main/60 px-5 py-2.5 text-sm font-semibold text-text-dim transition hover:bg-black/5 dark:hover:bg-white/5">
              {t("common.cancel", { defaultValue: "Hủy" })}
            </button>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-50">
              <ClipboardList className="h-4 w-4" />
              {submitting
                ? t("common.saving", { defaultValue: "Đang lưu..." })
                : initialData
                  ? t("prescription.form.update", { defaultValue: "Cập nhật toa" })
                  : t("prescription.form.save", { defaultValue: "Lưu toa thuốc" })
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionFormModal;
