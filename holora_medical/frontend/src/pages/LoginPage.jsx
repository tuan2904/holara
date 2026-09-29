import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { googleAuthApi, loginApi } from "../services/authService";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef(null);
  const isVi = i18n.language === "vi";

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

        // Redirect to appropriate zone based on role
        const userRole = data.user?.role;
        switch (userRole) {
          case "patient":
            navigate("/patient");
            break;
          case "doctor":
            navigate("/doctor");
            break;
          case "clinic_owner":
            navigate("/clinic-owner");
            break;
            case "receptionist":
              navigate("/receptionist");
              break;
            case "accountant":
              navigate("/accountant");
              break;
          case "admin":
          case "super_admin":
            navigate("/admin");
            break;
          default:
            navigate("/");
        }
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || t("auth.googleAuthFailed"));
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, t]
  );

  useEffect(() => {
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
  }, [handleGoogleCredential]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const data = await loginApi(formData);

      login({
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
      });

      // Redirect to appropriate zone based on role
      const userRole = data.user?.role;
      switch (userRole) {
        case "patient":
          navigate("/patient");
          break;
        case "doctor":
          navigate("/doctor");
          break;
        case "clinic_owner":
          navigate("/clinic-owner");
          break;
          case "receptionist":
            navigate("/receptionist");
            break;
          case "accountant":
            navigate("/accountant");
            break;
        case "admin":
        case "super_admin":
          navigate("/admin");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || t("auth.loginFailed"));
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
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_460px] lg:gap-12">
          <div className="hidden lg:flex lg:flex-col lg:justify-center">
            <p className="inline-flex w-fit items-center rounded-full border border-[#E06666]/25 bg-[#FFF5F5] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#C14D4D] dark:border-[#E06666]/35 dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
              {isVi ? "Holora Access" : "Holora Access"}
            </p>
            <h1 className="mt-6 max-w-lg text-5xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
              {isVi 
                ? "Đăng nhập một chạm, kết nối ngay không gian làm việc chuyên biệt" 
                : "Single sign-in, instant access to your dedicated workspace"
              }
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-gray-600 dark:text-slate-400">
              {isVi
                ? "Trải nghiệm quy trình xác thực tối giản dành riêng cho từng nhóm người dùng, loại bỏ mọi bước trung gian rườm rà."
                : "An ultra-streamlined authentication flow tailored for each user role, eliminating all unnecessary friction."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-slate-500">
              <Link to="/pricing" className="transition hover:text-[#E06666] dark:hover:text-[#F29A9A]">
                {isVi ? "Bảng giá" : "Pricing"}
              </Link>
              <span>•</span>
              <Link to="/holoramind" className="transition hover:text-[#E06666] dark:hover:text-[#F29A9A]">
                HoloraMind
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-[#141B29] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="mb-8">
              <p className="inline-flex items-center rounded-full border border-[#E06666]/20 bg-[#FFF5F5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C14D4D] dark:border-[#E06666]/30 dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
                {isVi ? "Sign in" : "Sign in"}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                {t("auth.signIn")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-slate-400">
                {isVi
                  ? "Nhập thông tin tài khoản để tiếp tục sử dụng Holora Medical."
                  : "Enter your account details to continue with Holora Medical."}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
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
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t("auth.password")}
                  </label>
                  <Link to="/forgot-password" className="text-sm font-medium text-[#E06666] transition hover:underline dark:text-[#F29A9A]">
                    {isVi ? "Quên mật khẩu?" : "Forgot password?"}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#E06666] py-3.5 text-sm font-semibold text-white transition hover:bg-[#D55555] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "..." : t("auth.submitLogin")}
              </button>

              <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-slate-500">
                <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
                <span>{t("auth.orContinueWith")}</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
              </div>

              <div className="flex justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 dark:border-slate-700 dark:bg-[#0F141F]">
                <div ref={googleBtnRef} />
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="font-semibold text-[#E06666] transition hover:underline dark:text-[#F29A9A]">
                {t("auth.signUp")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
