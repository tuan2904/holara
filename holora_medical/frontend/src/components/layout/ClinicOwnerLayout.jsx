import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import Logo from "../Logo";
import NotificationBadge from "../NotificationBadge";
import Breadcrumb from "../Breadcrumb";
import UserDropdown from "../UserDropdown";

const ClinicOwnerLayout = ({ children }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navClass = ({ isActive }) =>
    isActive
      ? "flex items-center gap-3 rounded-lg bg-[#E06666] px-4 py-2.5 text-white font-medium transition"
      : "flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-[#FFF5F5] dark:hover:bg-slate-800 hover:text-[#E06666] transition";

  return (
    <div className="min-h-screen bg-bg-app dark:bg-slate-900 transition-colors duration-200">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-bg-surface dark:bg-slate-800 shadow-md border-r border-border-main transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="border-b border-border-main px-6 py-5">
            <Link to="/clinic-owner" className="flex items-center gap-2">
              <Logo size="sm" />
              <div>
                <div className="text-base font-bold text-[#E06666]">{t("clinicOwner.portal") || "Provider Portal"}</div>
                <div className="text-xs text-text-dim">{t("common.holora") || "Holora Medical"}</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4" onClick={() => setSidebarOpen(false)}>
            <NavLink to="/clinic-owner" end className={navClass}>
              <span>🏠</span>
              <span>{t("clinicOwner.dashboard") || "Dashboard"}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("clinicOwner.myClinic") || "My Clinic"}
              </p>
            </div>

            <NavLink to="/clinic-owner/branches" className={navClass}>
              <span>🏥</span>
              <span>{t("clinicOwner.myBranches") || "My Branches"}</span>
            </NavLink>

            <NavLink to="/clinic-owner/doctors" className={navClass}>
              <span>👨‍⚕️</span>
              <span>{t("clinicOwner.myDoctors") || "My Doctors"}</span>
            </NavLink>

            <NavLink to="/clinic-owner/patients" className={navClass}>
              <span>🧑‍⚕️</span>
              <span>{t("clinicOwner.myPatients") || "My Patients"}</span>
            </NavLink>

            <NavLink to="/clinic-owner/appointments" className={navClass}>
              <span>📅</span>
              <span>{t("clinicOwner.myAppointments") || "Appointments"}</span>
            </NavLink>

            <NavLink to="/clinic-owner/consultations" className={navClass}>
              <span>💬</span>
              <span>{t("clinicOwner.myConsultations") || "Consultations"}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("clinicOwner.billing") || "Billing"}
              </p>
            </div>

            <NavLink to="/clinic-owner/subscription" className={navClass}>
              <span>💳</span>
              <span>{t("clinicOwner.subscription") || "Subscription"}</span>
            </NavLink>
          </nav>

          <div className="border-t border-border-main p-4">
            <p className="text-xs font-semibold text-[#E06666] capitalize">{t("clinicOwner.role") || "Clinic Owner"}</p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Topbar */}
          <header className="flex items-center justify-between bg-bg-surface dark:bg-slate-800 px-4 py-3 shadow-sm border-b border-border-main">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setSidebarOpen(v => !v)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 lg:hidden shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-text-main truncate">{t("clinicOwner.portal") || "Provider Portal"}</h1>
                <p className="text-xs text-text-dim truncate hidden sm:block">
                  {t("admin.welcome")}, {user?.full_name || t("common.user")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <NotificationBadge />
              <UserDropdown profilePath="/clinic-owner/profile" showTheme showLanguage />
            </div>
          </header>

          {/* Breadcrumb */}
          <Breadcrumb />

          {/* Main content area */}
          <main className="flex-1 p-3 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default ClinicOwnerLayout;
