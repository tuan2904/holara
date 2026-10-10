import React from "react";
import { useTranslation } from "react-i18next";

const VERSION_HISTORY = [
  {
    version: "v1.7.0",
    date: "2026-04-06",
    tag: { en: "UI & Build Optimization", vi: "Tối ưu giao diện & build" },
    highlights: [
      { en: "✨ Optimized Doctor Consultation UI (Desktop & Mobile)", vi: "✨ Tối ưu giao diện tư vấn của bác sĩ (máy tính & di động)" },
      { en: "💊 Fixed Prescription creation & detail logic", vi: "💊 Sửa logic tạo và xem chi tiết đơn thuốc" },
      { en: "🛠️ Resolved all Frontend Lint & Build blockers", vi: "🛠️ Khắc phục toàn bộ lỗi lint & build ở frontend" },
      { en: "🚀 Fixed CI/CD Pipeline (DigitalOcean path alignment)", vi: "🚀 Sửa pipeline CI/CD (đồng bộ đường dẫn DigitalOcean)" },
      { en: "📅 Implemented Recurring Appointment Module (Backend)", vi: "📅 Triển khai module lịch hẹn định kỳ (backend)" },
    ],
  },
  {
    version: "v1.6.0",
    date: "2025-07-01",
    tag: { en: "Performance & UX", vi: "Hiệu năng & trải nghiệm" },
    highlights: [
      { en: "Improved initial load time", vi: "Cải thiện thời gian tải ban đầu" },
      { en: "Optimized images and static assets", vi: "Tối ưu hình ảnh và tài nguyên tĩnh" },
      { en: "Fixed minor navigation bugs", vi: "Sửa các lỗi điều hướng nhỏ" },
    ],
  },
  {
    version: "v1.4.0",
    date: "2025-06-13",
    tag: { en: "Patient Zone", vi: "Khu vực bệnh nhân" },
    highlights: [
      { en: "Patient Dashboard with real-time data (9 API queries)", vi: "Bảng điều khiển bệnh nhân với dữ liệu thời gian thực (9 truy vấn API)" },
      { en: "Rose theme + i18n polish for all patient pages", vi: "Giao diện tông hồng + hoàn thiện đa ngôn ngữ cho mọi trang bệnh nhân" },
      { en: "PatientMyDoctorsPage, PatientMyBranchesPage full rewrite", vi: "Viết lại hoàn toàn trang Bác sĩ của tôi, Chi nhánh của tôi" },
      { en: "PatientAppointmentDetailPage + ConsultationHistoryPage polish", vi: "Hoàn thiện trang Chi tiết lịch hẹn và Lịch sử tư vấn" },
    ],
  },
  {
    version: "v1.3.0",
    date: "2025-06-12",
    tag: { en: "Doctor Zone", vi: "Khu vực bác sĩ" },
    highlights: [
      { en: "Doctor Dashboard with real data, cyan theme", vi: "Bảng điều khiển bác sĩ với dữ liệu thật, tông xanh cyan" },
      { en: "Doctor schedule page, appointments & consultations mobile polish", vi: "Tối ưu di động cho trang lịch làm việc, lịch hẹn và tư vấn của bác sĩ" },
      { en: "DoctorConsultationDetailPage with AI image analysis", vi: "Trang chi tiết tư vấn của bác sĩ có phân tích ảnh bằng AI" },
    ],
  },
  {
    version: "v1.2.0",
    date: "2025-06-11",
    tag: { en: "Billing & Clinic Owner", vi: "Thanh toán & Chủ phòng khám" },
    highlights: [
      { en: "Phase 1 — Billing History & Invoice", vi: "Giai đoạn 1 — Lịch sử thanh toán & Hóa đơn" },
      { en: "Clinic-owner appointments/consultations pages", vi: "Trang lịch hẹn/tư vấn cho chủ phòng khám" },
      { en: "Admin schedules management", vi: "Quản lý lịch làm việc cho quản trị viên" },
      { en: "Mobile optimizations across all roles", vi: "Tối ưu di động cho mọi vai trò" },
    ],
  },
  {
    version: "v1.1.0",
    date: "2025-06-09",
    tag: { en: "Mobile Optimization", vi: "Tối ưu di động" },
    highlights: [
      { en: "Full mobile optimization for admin pages", vi: "Tối ưu di động toàn diện cho các trang quản trị" },
      { en: "Color theme system for all admin pages", vi: "Hệ thống màu chủ đề cho mọi trang quản trị" },
      { en: "Permissions system implementation", vi: "Triển khai hệ thống phân quyền" },
      { en: "Patient consultation UI mobile optimization", vi: "Tối ưu di động cho giao diện tư vấn của bệnh nhân" },
    ],
  },
  {
    version: "v1.0.0",
    date: "2025-06-01",
    tag: { en: "Initial Release", vi: "Phát hành đầu tiên" },
    highlights: [
      { en: "Multi-branch booking system", vi: "Hệ thống đặt lịch đa chi nhánh" },
      { en: "Design system upgrade & login flow", vi: "Nâng cấp hệ thống thiết kế & luồng đăng nhập" },
      { en: "Docker Compose production deployment", vi: "Triển khai production bằng Docker Compose" },
      { en: "Core modules: Auth, Appointments, Consultations, Doctors, Patients", vi: "Các module lõi: Xác thực, Lịch hẹn, Tư vấn, Bác sĩ, Bệnh nhân" },
    ],
  },
];

const CURRENT = VERSION_HISTORY[0];

const VersionPage = () => {
  const { t, i18n } = useTranslation();
  const tr = (text) => (i18n.language === "en" ? text.en : text.vi);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Current Version Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-violet-200 text-xs font-semibold uppercase tracking-widest mb-1">
              {t("version.currentVersion", { defaultValue: "Current Version" })}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{CURRENT.version}</h1>
            <p className="text-violet-100 mt-1">{tr(CURRENT.tag)}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-violet-200 text-xs font-medium uppercase tracking-wider">
              {t("version.deployed", { defaultValue: "Deployed" })}
            </p>
            <p className="text-lg font-semibold">{CURRENT.date}</p>
            <p className="text-violet-200 text-xs mt-1">165.22.241.56</p>
          </div>
        </div>
      </div>

      {/* System Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: t("version.frontend", { defaultValue: "Frontend" }), value: "React 19 + Vite" },
          { label: t("version.backend", { defaultValue: "Backend" }), value: "PHP 8 / Laravel" },
          { label: t("version.database", { defaultValue: "Database" }), value: "MySQL 8.0" },
          { label: t("version.infra", { defaultValue: "Infrastructure" }), value: "Docker Compose" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-bg-surface dark:bg-slate-800 border border-border-main p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1">{item.label}</p>
            <p className="text-sm font-semibold text-text-main">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Version Timeline */}
      <h2 className="text-lg font-bold text-text-main mb-4">
        {t("version.history", { defaultValue: "Version History" })}
      </h2>

      <div className="space-y-4">
        {VERSION_HISTORY.map((ver, idx) => (
          <div
            key={ver.version}
            className={`rounded-xl border p-5 transition ${
              idx === 0
                ? "bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800"
                : "bg-bg-surface dark:bg-slate-800 border-border-main"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
              <div className="flex items-center gap-3">
                <span className={`text-lg font-extrabold ${idx === 0 ? "text-violet-600 dark:text-violet-400" : "text-text-main"}`}>
                  {ver.version}
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-text-dim">
                  {tr(ver.tag)}
                </span>
                {idx === 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {t("version.latest", { defaultValue: "Latest" })}
                  </span>
                )}
              </div>
              <span className="text-xs text-text-dim">{ver.date}</span>
            </div>
            <ul className="space-y-1.5">
              {ver.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${idx === 0 ? "bg-violet-500" : "bg-gray-300 dark:bg-slate-600"}`} />
                  {tr(h)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionPage;
