import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { changePasswordApi } from "../../services/authService";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t("auth.passwords_do_not_match") || "Mật khẩu xác nhận không khớp");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error(t("auth.password_too_short") || "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      await changePasswordApi(formData.currentPassword, formData.newPassword);
      toast.success(t("auth.change_password_success") || "Đổi mật khẩu thành công!");
      onClose();
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || t("auth.change_password_failed") || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="w-full max-w-md scale-in-center rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <h2 className="mb-6 text-2xl font-bold text-slate-800 dark:text-white">
          {t("auth.change_password")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("auth.current_password")}
            </label>
            <input
              type="password"
              name="currentPassword"
              required
              value={formData.currentPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("auth.new_password")}
            </label>
            <input
              type="password"
              name="newPassword"
              required
              value={formData.newPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              {t("auth.confirm_password")}
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                t("auth.update_password")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
