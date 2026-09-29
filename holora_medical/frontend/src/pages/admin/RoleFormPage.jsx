import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAllRolesApi, createRoleApi, updateRoleApi } from "../../services/roleService";

const RoleFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roleId } = useParams();
  const isEdit = !!roleId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    is_system_role: false,
    status: "active",
  });

  // Fetch role data if editing
  useEffect(() => {
    if (isEdit) {
      const fetchRole = async () => {
        try {
          const res = await getAllRolesApi();
          const role = res.data.find((r) => r.id === parseInt(roleId));
          if (role) {
            setFormData({
              name: role.name || "",
              code: role.code || "",
              description: role.description || "",
              is_system_role: role.is_system_role || false,
              status: role.status || "active",
            });
          }
        } catch (err) {
          console.error("Error fetching role:", err);
          setError(t("admin.errorLoadingRole"));
        } finally {
          setLoading(false);
        }
      };
      fetchRole();
    }
  }, [roleId, isEdit, t]);

  const validateForm = () => {
    if (!formData.name?.trim()) {
      setError(t("admin.nameRequired"));
      return false;
    }
    if (!formData.code?.trim()) {
      setError(t("admin.codeRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const submitData = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        is_system_role: formData.is_system_role,
        status: formData.status,
      };

      if (isEdit) {
        await updateRoleApi(roleId, submitData);
        setSuccessMessage(t("admin.roleUpdatedSuccess"));
        setTimeout(() => navigate("/admin/roles"), 1500);
      } else {
        await createRoleApi(submitData);
        setSuccessMessage(t("admin.roleCreatedSuccess"));
        setTimeout(() => navigate("/admin/roles"), 1500);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || t("admin.errorSubmittingForm");
      setError(errorMsg);
      console.error("Error submitting form:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-bg-surface p-6 shadow-sm text-center dark:bg-slate-800">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-[#E06666] border-r-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-bg-surface p-8 shadow-sm dark:bg-slate-800">
      {/* Header */}
      <div className="border-b border-border-main pb-6 mb-6">
        <h2 className="text-3xl font-bold text-[#E06666] mb-2">
          {isEdit ? t("admin.editRole") : t("admin.addNewRole")}
        </h2>
        <p className="text-text-dim">
          {isEdit ? t("admin.updateRoleInfo") : t("admin.fillFormToAddRole")}
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg flex items-start gap-3 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
          <span className="text-xl flex-shrink-0">✓</span>
          <div>
            <p className="font-semibold">{t("common.success")}</p>
            <p className="text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          <span className="text-xl flex-shrink-0">!</span>
          <div>
            <p className="font-semibold">{t("common.error")}</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              1
            </span>
            {t("admin.basicInformation")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t("admin.name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Administrator, Editor"
                className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition dark:bg-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t("admin.code")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., admin, editor"
                disabled={isEdit}
                className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition disabled:bg-bg-app disabled:cursor-not-allowed dark:bg-slate-700"
              />
              {isEdit && (
                <p className="text-xs text-text-dim mt-1">
                  {t("admin.codeCannotChange")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Configuration */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              2
            </span>
            {t("admin.configuration")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t("admin.status")}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition dark:bg-slate-700"
              >
                <option value="active">{t("admin.statusActive")}</option>
                <option value="inactive">{t("admin.statusInactive")}</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_system_role"
                  checked={formData.is_system_role}
                  onChange={handleInputChange}
                  disabled={isEdit}
                  className="w-5 h-5 text-[#E06666] rounded focus:ring-2 focus:ring-[#E06666] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-semibold text-text-main">
                  {t("admin.systemRole")}
                </span>
              </label>
              {isEdit && formData.is_system_role && (
                <p className="text-xs text-amber-600 ml-auto">
                  {t("admin.systemRoleWarning")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Description */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              3
            </span>
            {t("admin.description")}
          </h3>
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">
              {t("admin.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t("admin.descriptionPlaceholder")}
              rows="4"
              className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition resize-none dark:bg-slate-700"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border-main pt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/roles")}
            disabled={submitting}
            className="px-6 py-2.5 border border-border-main text-text-main rounded-lg hover:bg-bg-app transition disabled:opacity-50 disabled:cursor-not-allowed font-medium dark:hover:bg-slate-700"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#E06666] text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin"></div>
                {t("common.saving")}
              </>
            ) : (
              <>
                ✓ {isEdit ? t("common.update") : t("common.save")}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleFormPage;
