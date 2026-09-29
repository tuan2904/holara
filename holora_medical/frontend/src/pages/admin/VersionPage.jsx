import React from "react";
import { useTranslation } from "react-i18next";

const VERSION_HISTORY = [
  {
    version: "v1.7.0",
    date: "2026-04-06",
    tag: "UI & Build Optimization",
    highlights: [
      "✨ Optimized Doctor Consultation UI (Desktop & Mobile)",
      "💊 Fixed Prescription creation & detail logic",
      "🛠️ Resolved all Frontend Lint & Build blockers",
      "🚀 Fixed CI/CD Pipeline (DigitalOcean path alignment)",
      "📅 Implemented Recurring Appointment Module (Backend)",
    ],
  },
  {
    version: "v1.6.0",
    date: "2025-07-01",
    tag: "Performance & UX",
    highlights: [
      "Improved initial load time",
      "Optimized images and static assets",
      "Fixed minor navigation bugs",
    ],
  },
  {
    version: "v1.4.0",
    date: "2025-06-13",
    tag: "Patient Zone",
    highlights: [
      "Patient Dashboard with real-time data (9 API queries)",
      "Rose theme + i18n polish for all patient pages",
      "PatientMyDoctorsPage, PatientMyBranchesPage full rewrite",
      "PatientAppointmentDetailPage + ConsultationHistoryPage polish",
    ],
  },
  {
    version: "v1.3.0",
    date: "2025-06-12",
    tag: "Doctor Zone",
    highlights: [
      "Doctor Dashboard with real data, cyan theme",
      "Doctor schedule page, appointments & consultations mobile polish",
      "DoctorConsultationDetailPage with AI image analysis",
    ],
  },
  {
    version: "v1.2.0",
    date: "2025-06-11",
    tag: "Billing & Clinic Owner",
    highlights: [
      "Phase 1 — Billing History & Invoice",
      "Clinic-owner appointments/consultations pages",
      "Admin schedules management",
      "Mobile optimizations across all roles",
    ],
  },
  {
    version: "v1.1.0",
    date: "2025-06-09",
    tag: "Mobile Optimization",
    highlights: [
      "Full mobile optimization for admin pages",
      "Color theme system for all admin pages",
      "Permissions system implementation",
      "Patient consultation UI mobile optimization",
    ],
  },
  {
    version: "v1.0.0",
    date: "2025-06-01",
    tag: "Initial Release",
    highlights: [
      "Multi-branch booking system",
      "Design system upgrade & login flow",
      "Docker Compose production deployment",
      "Core modules: Auth, Appointments, Consultations, Doctors, Patients",
    ],
  },
];

const CURRENT = VERSION_HISTORY[0];

const VersionPage = () => {
  const { t } = useTranslation();

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
            <p className="text-violet-100 mt-1">{CURRENT.tag}</p>
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
                  {ver.tag}
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
                  {h}
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
