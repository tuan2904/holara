import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

const HomePage = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, role } = useAuth();
  const isVi = i18n.language === "vi";
  const [rolePrompt, setRolePrompt] = useState(null);

  const getZonePath = () => {
    switch (role) {
      case "patient":
        return "/patient";
      case "doctor":
        return "/doctor";
      case "clinic_owner":
        return "/clinic-owner";
      case "admin":
      case "super_admin":
        return "/admin";
      case "receptionist":
        return "/receptionist";
      case "accountant":
        return "/accountant";
      default:
        return "/";
    }
  };

  const patientEntryPath = user ? getZonePath() : "/register";
  const providerEntryPath = user ? getZonePath() : "/register/provider";

  const patientEntryLabel = user
    ? isVi
      ? "Đi tới khu vực của bạn"
      : "Go to your zone"
    : isVi
    ? "Đi tới đăng ký Patient"
    : "Go to patient registration";

  const providerEntryLabel = user
    ? isVi
      ? "Đi tới khu vực của bạn"
      : "Go to your zone"
    : isVi
    ? "Đi tới đăng ký Provider"
    : "Go to provider registration";

  const getRoleLabel = () => {
    switch (role) {
      case "patient":
        return isVi ? "patient" : "patient";
      case "doctor":
        return isVi ? "doctor" : "doctor";
      case "clinic_owner":
        return isVi ? "clinic owner" : "clinic owner";
      case "admin":
      case "super_admin":
        return isVi ? "admin" : "admin";
      case "receptionist":
        return isVi ? "receptionist" : "receptionist";
      case "accountant":
        return isVi ? "accountant" : "accountant";
      default:
        return isVi ? "user" : "user";
    }
  };

  const getZoneLabel = () => {
    switch (role) {
      case "patient":
        return isVi ? "Patient Zone" : "Patient Zone";
      case "doctor":
        return isVi ? "Doctor Zone" : "Doctor Zone";
      case "clinic_owner":
        return isVi ? "Provider Zone" : "Provider Zone";
      case "admin":
      case "super_admin":
        return isVi ? "Admin Panel" : "Admin Panel";
      case "receptionist":
        return isVi ? "Receptionist Zone" : "Receptionist Zone";
      case "accountant":
        return isVi ? "Accountant Zone" : "Accountant Zone";
      default:
        return isVi ? "khu vực của bạn" : "your zone";
    }
  };

  const openWrongCardPrompt = (entryType) => {
    setRolePrompt({
      entryType,
      zonePath: getZonePath(),
      zoneLabel: getZoneLabel(),
      roleLabel: getRoleLabel(),
    });
  };

  const handlePatientEntry = (event) => {
    if (!user) return;

    if (role === "patient") return;

    event.preventDefault();
    openWrongCardPrompt("patient");
  };

  const handleProviderEntry = (event) => {
    if (!user) return;

    if (role === "doctor" || role === "clinic_owner") return;

    event.preventDefault();
    openWrongCardPrompt("provider");
  };

  const handleConfirmZoneRedirect = () => {
    if (!rolePrompt?.zonePath) return;
    navigate(rolePrompt.zonePath);
    setRolePrompt(null);
  };

  const promptTitle = isVi
    ? "Tài khoản hiện tại không phù hợp với lựa chọn này"
    : "This selection does not match your current account";

  const promptDescription = rolePrompt
    ? isVi
      ? `Bạn đang đăng nhập bằng tài khoản ${rolePrompt.roleLabel}. Nếu tiếp tục, hệ thống sẽ đưa bạn về ${rolePrompt.zoneLabel} để làm việc đúng theo quyền hiện tại.`
      : `You are currently signed in with a ${rolePrompt.roleLabel} account. If you continue, the system will take you to ${rolePrompt.zoneLabel}, which matches your current permissions.`
    : "";

  const promptSelectionLabel = rolePrompt
    ? rolePrompt.entryType === "provider"
      ? isVi
        ? "Bạn vừa chọn khu vực Provider"
        : "You selected the Provider area"
      : isVi
      ? "Bạn vừa chọn khu vực Patient"
      : "You selected the Patient area"
    : "";

  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-white text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#E06666]/10 blur-3xl dark:bg-[#E06666]/12" />
        <div className="absolute bottom-[-120px] left-[-120px] h-[260px] w-[260px] rounded-full bg-[#F6B4B4]/25 blur-3xl dark:bg-[#4B2A34]/35" />
        <div className="absolute bottom-[-100px] right-[-110px] h-[250px] w-[250px] rounded-full bg-[#FFDAD4]/30 blur-3xl dark:bg-[#2E3C55]/30" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl flex-col items-center justify-center px-6 py-14">
        <p className="inline-flex items-center rounded-full border border-[#E06666]/25 bg-[#FFF5F5] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#C14D4D] dark:border-[#E06666]/35 dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
          {isVi ? "Holora AI Native" : "Holora AI Native"}
        </p>

        <h1 className="mt-7 text-center text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-slate-100">
          {isVi ? "HoloraMed - Nâng tầm y tế kỹ thuật số" : "HoloraMed - Empowering Digital Health"}
        </h1>

        <p className="mt-4 text-center text-lg text-gray-500 max-w-xl mx-auto dark:text-slate-400">
          {isVi 
            ? "Hệ sinh thái y khoa thông minh, kết nối bảo mật giữa người bệnh và các cơ sở y tế hàng đầu." 
            : "A smart medical ecosystem seamlessly connecting patients with leading healthcare providers."
          }
        </p>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to={patientEntryPath}
            onClick={handlePatientEntry}
            className="group flex min-h-[230px] flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#E06666]/40 hover:shadow-lg dark:border-slate-700 dark:bg-[#141B29] dark:hover:border-[#E06666]/50 dark:hover:shadow-[0_18px_35px_rgba(0,0,0,0.35)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E06666] dark:text-[#F29A9A]">
              {isVi ? "Dành cho bệnh nhân" : "For Patients"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-slate-100">
              {isVi ? "Bệnh nhân" : "Patients"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-400">
              {isVi
                ? "Chủ động đặt lịch, quản lý lịch khám và kết nối bác sĩ trong một trải nghiệm liền mạch."
                : "Seamlessly book appointments, manage your health schedule, and connect with doctors in one unified experience."}
            </p>
            <p className="mt-auto pt-5 text-sm font-semibold text-[#C14D4D] transition group-hover:translate-x-1 dark:text-[#F29A9A]">
              {patientEntryLabel} →
            </p>
          </Link>

          <Link
            to={providerEntryPath}
            onClick={handleProviderEntry}
            className="group flex min-h-[230px] flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#E06666]/40 hover:shadow-lg dark:border-slate-700 dark:bg-[#141B29] dark:hover:border-[#E06666]/50 dark:hover:shadow-[0_18px_35px_rgba(0,0,0,0.35)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E06666] dark:text-[#F29A9A]">
              {isVi ? "Dành cho Bác sĩ & Chủ chi nhánh" : "For Doctors & Branch Owners"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-slate-100">
              {isVi ? "Bác sĩ / Chủ chi nhánh" : "Doctors / Branch Owners"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-400">
              {isVi
                ? "Mở rộng quy mô, quản trị đội ngũ chuyên gia và tối ưu hóa hiệu suất vận hành trên một nền tảng số."
                : "Scale clinical operations, manage expert teams, and optimize workflow efficiency in a single workspace."}
            </p>
            <p className="mt-auto pt-5 text-sm font-semibold text-[#C14D4D] transition group-hover:translate-x-1 dark:text-[#F29A9A]">
              {providerEntryLabel} →
            </p>
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-slate-500">
          <Link to="/login" className="transition hover:text-[#E06666] dark:hover:text-[#F29A9A]">
            {isVi ? "Đăng nhập" : "Sign in"}
          </Link>
          <span className="text-gray-300 dark:text-slate-600">•</span>
          <Link to="/pricing" className="transition hover:text-[#E06666] dark:hover:text-[#F29A9A]">
            {isVi ? "Bảng giá" : "Pricing"}
          </Link>
          <span className="text-gray-300 dark:text-slate-600">•</span>
          <Link to="/holoramind" className="text-xs uppercase tracking-[0.14em] transition hover:text-[#E06666] dark:hover:text-[#F29A9A]">
            HoloraMind
          </Link>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(rolePrompt)}
        title={promptTitle}
        description={promptDescription}
        badgeLabel={promptSelectionLabel}
        tone="default"
        confirmLabel={isVi ? "Đi tới đúng khu vực" : "Go to the correct zone"}
        cancelLabel={isVi ? "Ở lại trang này" : "Stay on this page"}
        closeLabel={isVi ? "Đóng" : "Close"}
        onConfirm={handleConfirmZoneRedirect}
        onClose={() => setRolePrompt(null)}
      >
        <div className="rounded-2xl border border-[#F0D6D1] bg-[#FFF8F6] p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {isVi ? "Tài khoản hiện tại" : "Current account"}
          </p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {user?.full_name || (isVi ? "Người dùng" : "User")}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {isVi ? "Vai trò" : "Role"}: {rolePrompt?.roleLabel || ""}
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
              {rolePrompt?.zoneLabel || ""}
            </span>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
};

export default HomePage;
