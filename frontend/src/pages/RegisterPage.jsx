import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { googleAuthApi, registerApi } from "../services/authService";
import { useAuth } from "../context/AuthContext";

const RegisterPage = ({ defaultAccountType = "patient" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const isVi = i18n.language === "vi";

  const accountType = useMemo(() => {
    const mode = searchParams.get("mode");
    if (mode === "provider") return "provider";
    return defaultAccountType === "provider" ? "provider" : "patient";
  }, [defaultAccountType, searchParams]);

  const isProviderRegister = accountType === "provider";

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const googleBtnRef = useRef(null);

  const handleGoogleCredential = useCallback(
    async (response) => {
      try {
        setErrorMessage("");
        setLoading(true);

        const data = await googleAuthApi({
          credential: response.credential,
        });

        login({
          token: data.token,
          refreshToken: data.refreshToken,
          user: data.user,
        });

        navigate("/");
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || t("auth.googleAuthFailed"));
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, t]
  );

  useEffect(() => {
    if (isProviderRegister) {
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId || !googleBtnRef.current || !window.google?.accounts?.id) {
      return;
    }

    googleBtnRef.current.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
    });

    const btnWidth = Math.min(340, Math.max(200, window.innerWidth - 100));
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: btnWidth,
    });
  }, [handleGoogleCredential, isProviderRegister]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) return t("auth.fullNameRequired");
    if (!formData.username.trim()) return t("auth.usernameRequired");
    if (!formData.email.trim()) return t("auth.emailRequired");
    if (!formData.password) return t("auth.passwordRequired");
    if (formData.password.length < 6) return t("auth.passwordMin");
    if (formData.password !== formData.confirmPassword) return t("auth.passwordNotMatch");
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        account_type: accountType,
      };

      const data = await registerApi(payload);
      setSuccessMessage(data.message || t("auth.registerSuccess"));

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || t("auth.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-white text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-[#E06666]/10 blur-3xl dark:bg-[#E06666]/12" />
        <div className="absolute bottom-[-120px] left-[-90px] h-[220px] w-[220px] rounded-full bg-[#F8C2C2]/30 blur-3xl dark:bg-[#402633]/35" />
        <div className="absolute bottom-[-100px] right-[-90px] h-[220px] w-[220px] rounded-full bg-[#FFDCD6]/30 blur-3xl dark:bg-[#28374E]/30" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-6xl items-center justify-center px-4 py-12 sm:px-6">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_560px] lg:gap-12">
          <div className="hidden lg:flex lg:flex-col lg:justify-center">
            <p className="inline-flex w-fit items-center rounded-full border border-[#E06666]/25 bg-[#FFF5F5] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#C14D4D] dark:border-[#E06666]/35 dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
              {isProviderRegister ? "Provider onboarding" : "Patient onboarding"}
            </p>
            <h1 className="mt-6 max-w-lg text-5xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
              {isProviderRegister
                ? isVi
                  ? "Tạo tài khoản để mở chi nhánh và vận hành hệ thống"
                  : "Create an account to open branches and operate your system"
                : isVi
                ? "Tạo tài khoản để bắt đầu đặt lịch và tư vấn"
                : "Create an account to start booking and consultation"}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-gray-600 dark:text-slate-400">
              {isProviderRegister
                ? isVi
                  ? "Dành cho bác sĩ và chủ chi nhánh muốn bắt đầu vận hành trên MeDecode."
                  : "For doctors and branch owners who want to start operating on MeDecode."
                : isVi
                ? "Dành cho bệnh nhân muốn quản lý lịch hẹn và gửi yêu cầu tư vấn trong một luồng đơn giản."
                : "For patients who want to manage appointments and request consultations in one simple flow."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-slate-500">
              <Link to="/pricing" className="transition hover:text-[#E06666] dark:hover:text-[#F29A9A]">
                {isVi ? "Bảng giá" : "Pricing"}
              </Link>
              <span>•</span>
              <Link to="/holoramind" className="transition hover:text-[#E06666] dark:hover:text-[#F29A9A]">
                MeDecode AI
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-[#141B29] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="mb-8">
              <p className="inline-flex items-center rounded-full border border-[#E06666]/20 bg-[#FFF5F5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C14D4D] dark:border-[#E06666]/30 dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
                {isProviderRegister ? "Provider account" : "Patient account"}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                {isProviderRegister ? "Create Provider Account" : t("auth.createAccount")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-slate-400">
                {isProviderRegister
                  ? isVi
                    ? "Hoàn tất thông tin cơ bản để khởi tạo tài khoản provider."
                    : "Complete the basic information to initialize your provider account."
                  : isVi
                  ? "Tạo tài khoản mới để bắt đầu dùng MeDecode."
                  : "Create a new account to start using MeDecode."}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600 dark:border-green-400/20 dark:bg-green-500/10 dark:text-green-200">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("auth.fullName")}
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    placeholder={t("auth.fullNamePlaceholder")}
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-gray-900 outline-none transition focus:border-[#E06666]/50 focus:ring-4 focus:ring-[#E06666]/10 dark:border-slate-700 dark:bg-[#0F141F] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#E06666]/60 dark:focus:ring-[#E06666]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("auth.username")}
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder={t("auth.usernamePlaceholder")}
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-gray-900 outline-none transition focus:border-[#E06666]/50 focus:ring-4 focus:ring-[#E06666]/10 dark:border-slate-700 dark:bg-[#0F141F] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#E06666]/60 dark:focus:ring-[#E06666]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("auth.phone")}
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder={t("auth.phonePlaceholder")}
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-gray-900 outline-none transition focus:border-[#E06666]/50 focus:ring-4 focus:ring-[#E06666]/10 dark:border-slate-700 dark:bg-[#0F141F] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#E06666]/60 dark:focus:ring-[#E06666]/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("auth.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-gray-900 outline-none transition focus:border-[#E06666]/50 focus:ring-4 focus:ring-[#E06666]/10 dark:border-slate-700 dark:bg-[#0F141F] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#E06666]/60 dark:focus:ring-[#E06666]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("auth.password")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder={t("auth.passwordPlaceholder")}
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-gray-900 outline-none transition focus:border-[#E06666]/50 focus:ring-4 focus:ring-[#E06666]/10 dark:border-slate-700 dark:bg-[#0F141F] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#E06666]/60 dark:focus:ring-[#E06666]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? (isVi ? "Ẩn mật khẩu" : "Hide password") : (isVi ? "Hiện mật khẩu" : "Show password")}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 transition hover:text-[#E06666] dark:text-slate-500 dark:hover:text-[#F29A9A]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("auth.confirmPassword")}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder={t("auth.confirmPasswordPlaceholder")}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-gray-900 outline-none transition focus:border-[#E06666]/50 focus:ring-4 focus:ring-[#E06666]/10 dark:border-slate-700 dark:bg-[#0F141F] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#E06666]/60 dark:focus:ring-[#E06666]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? (isVi ? "Ẩn xác nhận mật khẩu" : "Hide confirm password") : (isVi ? "Hiện xác nhận mật khẩu" : "Show confirm password")}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 transition hover:text-[#E06666] dark:text-slate-500 dark:hover:text-[#F29A9A]"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#E06666] py-3.5 text-sm font-semibold text-white transition hover:bg-[#D55555] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "..." : t("auth.submitRegister")}
              </button>

              <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-slate-500">
                <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
                <span>{t("auth.orContinueWith")}</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
              </div>

              <div className="flex justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 dark:border-slate-700 dark:bg-[#0F141F]">
                {isProviderRegister ? (
                  <p className="text-center text-xs leading-6 text-gray-500 dark:text-slate-400">
                    Google signup currently creates patient accounts only.
                  </p>
                ) : (
                  <div ref={googleBtnRef} />
                )}
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
              {t("auth.haveAccount")}{" "}
              <Link to="/login" className="font-semibold text-[#E06666] transition hover:underline dark:text-[#F29A9A]">
                {t("auth.signIn")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
