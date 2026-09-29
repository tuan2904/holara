import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import branchService from "../../services/branchService";

const BranchFormPage = ({ returnPath = "/admin/branches" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branchId } = useParams();
  const isEditMode = !!branchId;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    description: "",
    status: "active",
  });
  const [originalFormData, setOriginalFormData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"
  const [errors, setErrors] = useState({});

  const fetchBranch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await branchService.getBranchById(branchId);
      const branch = response.data;
      const normalizedBranch = {
        name: branch.name || "",
        code: branch.code || "",
        phone: branch.phone || "",
        email: branch.email || "",
        address: branch.address || "",
        city: branch.city || "",
        description: branch.description || "",
        status: branch.status || "active",
      };
      setFormData(normalizedBranch);
      setOriginalFormData(normalizedBranch);
    } catch (err) {
      setMessage(err?.response?.data?.message || t("branch.fetchError"));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [branchId, t]);

  const generateCodeForNewBranch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await branchService.getNextBranchCode();
      setFormData((prev) => ({ ...prev, code: response?.data?.code || "" }));
    } catch (err) {
      console.error("Error generating branch code:", err);
      setMessage(err?.response?.data?.message || t("branch.saveError"));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isEditMode) {
      fetchBranch();
    } else {
      generateCodeForNewBranch();
    }
  }, [isEditMode, fetchBranch, generateCodeForNewBranch]);

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = t("branch.nameRequired");
    }

    if (!formData.code.trim()) {
      nextErrors.code = t("branch.codeRequired");
    }

    if (formData.code.trim() && !/^[A-Z0-9_]+$/.test(formData.code.trim())) {
      nextErrors.code = t("branch.codeInvalid");
    }

    if (!formData.address.trim()) {
      nextErrors.address = t("branch.addressRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      setMessage(t("common.pleaseFixErrors"));
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };

      if (isEditMode) {
        await branchService.updateBranch(branchId, payload);
        setMessage(t("branch.updateSuccess"));
        setMessageType("success");
      } else {
        await branchService.createBranch(payload);
        setMessage(t("branch.createSuccess"));
        setMessageType("success");
      }

      setTimeout(() => {
        navigate(returnPath);
      }, 1000);
    } catch (err) {
      setMessage(err?.response?.data?.message || t("branch.saveError"));
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const isClinicOwnerMode = returnPath.includes("/clinic-owner/");
  const inputClassName =
    "w-full rounded-xl border border-border-main bg-bg-app dark:bg-slate-900 px-4 py-3 text-sm text-text-main placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-[#E06666]";
  const cardClassName =
    "rounded-2xl border border-border-main bg-bg-surface dark:bg-slate-800 shadow-sm";
  const reviewFields = [
    { key: "name", label: t("branch.name") },
    { key: "phone", label: t("branch.phone") },
    { key: "email", label: t("branch.email") },
    { key: "address", label: t("branch.address") },
    { key: "city", label: t("branch.city") },
    { key: "description", label: t("branch.description") },
    { key: "status", label: t("branch.status") },
  ];
  const formatFieldValue = (key, value) => {
    if (key === "status") {
      if (value === "active") return t("branch.statusActive");
      if (value === "inactive") return t("branch.statusInactive");
    }

    const text = `${value || ""}`.trim();
    return text || `(${t("common.empty")})`;
  };
  const changedFields =
    isEditMode && originalFormData
      ? reviewFields
          .map((field) => {
            const before = formatFieldValue(field.key, originalFormData[field.key]);
            const after = formatFieldValue(field.key, formData[field.key]);
            return {
              ...field,
              before,
              after,
              changed: before !== after,
            };
          })
          .filter((field) => field.changed)
      : [];

  if (loading) {
    return (
      <div className="rounded-2xl border border-border-main bg-bg-surface dark:bg-slate-800 p-8 text-center shadow-sm">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#E06666] border-r-transparent"></div>
        <p className="mt-4 text-sm text-text-dim">
          {t("branch.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-[#f0c9c2] bg-[linear-gradient(135deg,#fff7f2_0%,#ffe6dc_52%,#fff0ea_100%)] p-6 shadow-sm dark:border-[#7a3d3b] dark:bg-[linear-gradient(135deg,rgba(127,29,29,0.30)_0%,rgba(51,65,85,0.92)_56%,rgba(15,23,42,1)_100%)] lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B85757] dark:text-[#F2B4A8]">
              {isClinicOwnerMode ? t("branch.workspaceClinicOwner") : t("branch.workspaceAdmin")}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-text-main lg:text-4xl">
              {isEditMode ? t("branch.editTitle") : t("branch.addTitle")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-text-dim lg:text-base">
              {isEditMode
                ? t("branch.editSubtitle")
                : t("branch.addSubtitleAuto")}
            </p>
          </div>

          <div className="w-full lg:min-w-[280px] lg:w-auto rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/50">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-dim">
              {t("branch.code")}
            </p>
            <p className="mt-3 break-all font-mono text-lg font-semibold text-text-main">
              {formData.code || "HLR_MED_ddmmyyyy_BR0001"}
            </p>
            <p className="mt-3 text-sm text-text-dim">
              {isEditMode
                ? t("branch.codeFixedAfterCreate")
                : t("branch.codeAutoGenerated")}
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className={cardClassName}>
            <div className="border-b border-border-main px-6 py-5">
              <h2 className="text-lg font-semibold text-text-main">{t("branch.basicInfo")}</h2>
              <p className="mt-1 text-sm text-text-dim">{t("branch.basicInfoSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 px-6 py-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-main">
                  {t("branch.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("branch.namePlaceholder")}
                  className={`${inputClassName} ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-main">
                  {t("branch.code")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-3 font-mono text-sm text-text-dim cursor-not-allowed dark:bg-slate-900"
                />
                <p className="mt-2 text-xs text-text-dim">
                  {isEditMode ? t("branch.codeCannotChange") : t("branch.codeFormat")}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-main">{t("branch.phone")}</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t("branch.phonePlaceholder")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-main">{t("branch.email")}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("branch.emailPlaceholder")}
                  className={inputClassName}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-text-main">
                  {t("branch.address")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t("branch.addressPlaceholder")}
                  className={`${inputClassName} ${errors.address ? "border-red-500" : ""}`}
                />
                {errors.address && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.address}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-main">{t("branch.city")}</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder={t("branch.cityPlaceholder")}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-main">{t("branch.status")}</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClassName}
                >
                  <option value="active">{t("branch.statusActive")}</option>
                  <option value="inactive">{t("branch.statusInactive")}</option>
                </select>
              </div>
            </div>
          </section>

          <section className={cardClassName}>
            <div className="border-b border-border-main px-6 py-5">
              <h2 className="text-lg font-semibold text-text-main">{t("branch.description")}</h2>
              <p className="mt-1 text-sm text-text-dim">{t("branch.descriptionSubtitle")}</p>
            </div>
            <div className="px-6 py-6">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t("branch.descriptionPlaceholder")}
                rows="5"
                className={`${inputClassName} resize-none`}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Snapshot — desktop only */}
          <section className={`${cardClassName} p-6 hidden lg:block`}>
            <h2 className="text-base font-semibold text-text-main">{t("branch.snapshot")}</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("branch.snapshotName")}</p>
                <p className="mt-1 font-medium text-text-main">{formData.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("branch.snapshotCity")}</p>
                <p className="mt-1 font-medium text-text-main">{formData.city || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("branch.snapshotStatus")}</p>
                <p className="mt-1 font-medium text-text-main">
                  {formData.status === "active" ? t("branch.statusActive") : t("branch.statusInactive")}
                </p>
              </div>
            </div>
          </section>

          {isEditMode && (
            <section className={`${cardClassName} p-6 hidden lg:block`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-text-main">{t("branch.reviewChanges")}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    changedFields.length > 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {changedFields.length > 0
                    ? t("branch.reviewChangedCount", { count: changedFields.length })
                    : t("branch.reviewNoChanges")}
                </span>
              </div>

              {changedFields.length === 0 ? (
                <p className="mt-3 text-sm text-text-dim">
                  {t("branch.reviewNoChangesHint")}
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {changedFields.map((field) => (
                    <div
                      key={field.key}
                      className="rounded-xl border border-border-main bg-bg-app p-3 dark:bg-slate-900"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-dim">
                        {field.label}
                      </p>
                      <div className="mt-2 space-y-2 text-xs">
                        <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                          <span className="font-semibold">{t("branch.reviewBefore")}</span> {field.before}
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                          <span className="font-semibold">{t("branch.reviewAfter")}</span> {field.after}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className={`${cardClassName} p-6`}>
            <h2 className="text-base font-semibold text-text-main">{t("branch.actions")}</h2>
            <p className="mt-2 text-sm text-text-dim">
              {t("branch.reviewBeforeSave")}
            </p>
            <div className="mt-5 space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E06666] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#D55555] disabled:bg-gray-400"
              >
                {saving ? t("common.saving") : isEditMode ? t("common.update") : t("common.create")}
              </button>
              <button
                type="button"
                onClick={() => navigate(returnPath)}
                disabled={saving}
                className="w-full rounded-xl border border-border-main px-4 py-3 text-sm font-medium text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700 disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
};

export default BranchFormPage;
