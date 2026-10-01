import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getAllUsersApi,
  createUserApi,
  updateUserApi,
} from "../../services/userService";

const UserFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const isEdit = !!userId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    avatar_url: "",
    gender: "",
    date_of_birth: "",
    status: "active",
  });

  // Fetch user data if editing
  useEffect(() => {
    if (isEdit) {
      const fetchUser = async () => {
        try {
          const res = await getAllUsersApi();
          const user = res.data.find((u) => u.id === parseInt(userId));
          if (user) {
            setFormData({
              full_name: user.full_name || "",
              username: user.username || "",
              email: user.email || "",
              password: "",
              confirm_password: "",
              phone: user.phone || "",
              avatar_url: user.avatar_url || "",
              gender: user.gender || "",
              date_of_birth: user.date_of_birth
                ? user.date_of_birth.split("T")[0]
                : "",
              status: user.status || "active",
            });
          }
        } catch (err) {
          console.error("Error fetching user:", err);
          setError(t("admin.errorLoadingUser"));
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [userId, isEdit, t]);

  const validateForm = () => {
    if (!formData.full_name?.trim()) {
      setError(t("admin.fullNameRequired"));
      return false;
    }
    if (!formData.username?.trim()) {
      setError(t("admin.usernameRequired"));
      return false;
    }
    if (!formData.email?.trim()) {
      setError(t("admin.emailRequired"));
      return false;
    }
    if (!isEdit) {
      if (!formData.password?.trim()) {
        setError(t("admin.passwordRequired"));
        return false;
      }
      if (formData.password.length < 6) {
        setError(t("admin.passwordMin", { min: 6 }));
        return false;
      }
      if (formData.password !== formData.confirm_password) {
        setError(t("admin.passwordNotMatch"));
        return false;
      }
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
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        status: formData.status,
      };

      if (!isEdit) {
        submitData.password = formData.password;
      }

      if (isEdit) {
        await updateUserApi(userId, submitData);
        setSuccessMessage(t("admin.userUpdatedSuccess"));
        setTimeout(() => navigate("/admin/users"), 1500);
      } else {
        await createUserApi(submitData);
        setSuccessMessage(t("admin.userCreatedSuccess"));
        setTimeout(() => navigate("/admin/users"), 1500);
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || t("admin.errorSubmittingForm");
      setError(errorMsg);
      console.error("Error submitting form:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
          {isEdit ? t("admin.editUser") : t("admin.addNewUser")}
        </h2>
        <p className="text-text-dim">
          {isEdit ? t("admin.updateUserInfo") : t("admin.fillFormToAddUser")}
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
        {/* Section 1: Account Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              1
            </span>
            {t("admin.accountInformation")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t("admin.fullName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition dark:bg-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t("admin.username")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="johndoe"
                disabled={isEdit}
                className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition disabled:bg-bg-app disabled:cursor-not-allowed dark:bg-slate-700"
              />
              {isEdit && (
                <p className="text-xs text-text-dim mt-1">
                  {t("admin.usernameCannotChange")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t("admin.email")} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition dark:bg-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t("admin.phone")}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+84 812 345 6789"
                className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition dark:bg-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Password (Create only) */}
        {!isEdit && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
                2
              </span>
              {t("admin.passwordInformation")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">
                  {t("admin.password")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition dark:bg-slate-700"
                />
                <p className="text-xs text-text-dim mt-1">
                  {t("admin.passwordMin", { min: 6 })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">
                  {t("admin.confirmPassword")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition dark:bg-slate-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Personal Information */}
        <div className={`mb-8 ${isEdit ? "" : ""}`}>
          <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              {isEdit ? "2" : "3"}
            </span>
            {t("admin.personalInformation")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t("admin.gender")}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition dark:bg-slate-700"
              >
                <option value="">Select Gender</option>
                <option value="male">{t("admin.genderMale")}</option>
                <option value="female">{t("admin.genderFemale")}</option>
                <option value="other">{t("admin.genderOther")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t("admin.dateOfBirth")}
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition dark:bg-slate-700"
              />
            </div>

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
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">
                {t("admin.avatarUrl")}
              </label>
              <input
                type="url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleInputChange}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-2.5 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 focus:border-transparent transition dark:bg-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-border-main pt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
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

export default UserFormPage;
