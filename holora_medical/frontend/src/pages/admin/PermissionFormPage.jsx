import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, ArrowLeft, CheckCircle2, Key, Loader2, Save,
} from "lucide-react";
import { getAllPermissionsApi, createPermissionApi, updatePermissionApi } from "../../services/permissionService";

const PermissionFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { permissionId } = useParams();
  const isEdit = !!permissionId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    module_name: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (isEdit) {
      const fetchPermission = async () => {
        try {
          const res = await getAllPermissionsApi();
          const permission = res.data.find((p) => p.id === parseInt(permissionId));
          if (permission) {
            setFormData({
              name: permission.name || "",
              code: permission.code || "",
              module_name: permission.module_name || "",
              description: permission.description || "",
              status: permission.status || "active",
            });
          }
        } catch (err) {
          console.error("Error fetching permission:", err);
          setError(t("admin.errorLoadingPermission"));
        } finally {
          setLoading(false);
        }
      };
      fetchPermission();
    }
  }, [permissionId, isEdit, t]);

  useEffect(() => {
    if (!successMessage) return;
    const id = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(id);
  }, [successMessage]);

  const validateForm = () => {
    if (!formData.name?.trim()) { setError(t("admin.nameRequired")); return false; }
    if (!formData.code?.trim()) { setError(t("admin.codeRequired")); return false; }
    if (!formData.module_name?.trim()) { setError(t("admin.moduleNameRequired")); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccessMessage("");
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const submitData = { name: formData.name, code: formData.code, module_name: formData.module_name, description: formData.description, status: formData.status };
      if (isEdit) {
        await updatePermissionApi(permissionId, submitData);
        setSuccessMessage(t("admin.permissionUpdatedSuccess"));
      } else {
        await createPermissionApi(submitData);
        setSuccessMessage(t("admin.permissionCreatedSuccess"));
      }
      setTimeout(() => navigate("/admin/permissions"), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.errorSubmittingForm"));
    } finally { setSubmitting(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-r-transparent" />
        <p className="mt-3 text-sm text-text-dim">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Hero Header ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
        <div className="relative">
          <button onClick={() => navigate("/admin/permissions")}
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />{t("admin.permissionsManagement")}
          </button>
          <div className="flex items-center gap-2">
            <Key className="h-6 w-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold">
              {isEdit ? t("admin.editPermission") : t("admin.addNewPermission")}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            {isEdit ? t("admin.updatePermissionInfo") : t("admin.fillFormToAddPermission")}
          </p>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────── */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{successMessage}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Form Card ───────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Basic Information */}
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 sm:p-6 dark:bg-slate-800">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-text-main">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">1</span>
            {t("admin.basicInformation")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                {t("admin.name")} <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                placeholder="e.g., Create User, Edit Role"
                className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-amber-500/40 dark:bg-slate-900" />
            </div>
            {/* Code */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                {t("admin.code")} <span className="text-red-500">*</span>
              </label>
              <input type="text" name="code" value={formData.code} onChange={handleInputChange}
                placeholder="e.g., create_user, edit_role" disabled={isEdit}
                className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-amber-500/40 disabled:bg-bg-app disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900" />
              {isEdit && <p className="mt-1 text-xs text-text-dim">{t("admin.codeCannotChange")}</p>}
            </div>
            {/* Module */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                {t("admin.moduleName")} <span className="text-red-500">*</span>
              </label>
              <input type="text" name="module_name" value={formData.module_name} onChange={handleInputChange}
                placeholder="e.g., users, roles, permissions"
                className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-amber-500/40 dark:bg-slate-900" />
            </div>
            {/* Status */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">{t("admin.status")}</label>
              <select name="status" value={formData.status} onChange={handleInputChange}
                className="w-full appearance-none rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-amber-500/40 dark:bg-slate-900">
                <option value="active">{t("admin.statusActive")}</option>
                <option value="inactive">{t("admin.statusInactive")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Description */}
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 sm:p-6 dark:bg-slate-800">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-text-main">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">2</span>
            {t("admin.description")}
          </h3>
          <textarea name="description" value={formData.description} onChange={handleInputChange}
            placeholder={t("admin.descriptionPlaceholder")} rows="4"
            className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-amber-500/40 resize-none dark:bg-slate-900" />
        </div>

        {/* ── Sticky Action Bar ─────────────────────── */}
        <div className="sticky bottom-0 z-10 -mx-1 rounded-2xl border border-border-main bg-bg-surface/80 px-5 py-4 shadow-lg backdrop-blur dark:bg-slate-800/80">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <button type="button" onClick={() => navigate("/admin/permissions")} disabled={submitting}
              className="w-full sm:w-auto rounded-xl border border-border-main px-5 py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-50">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 disabled:opacity-50">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{t("common.saving")}</>
              ) : (
                <><Save className="h-4 w-4" />{isEdit ? t("common.update") : t("common.save")}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PermissionFormPage;
