import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../Logo";
import NotificationBadge from "../NotificationBadge";
import Breadcrumb from "../Breadcrumb";
import UserDropdown from "../UserDropdown";
import { 
  Home, 
  Hospital, 
  Users, 
  Calendar, 
  Stethoscope, 
  Bot, 
  User,
  Layout,
  Shield
} from "lucide-react";

const PatientLayout = ({ children }) => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navClass = ({ isActive }) =>
    isActive
      ? "flex items-center gap-3 rounded-lg bg-rose-500 px-4 py-2.5 text-white font-medium transition"
      : "flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-500 transition";

  return (
    <div className="min-h-screen bg-bg-app dark:bg-slate-900 transition-colors duration-200">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-bg-surface dark:bg-slate-800 shadow-md border-r border-border-main transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="border-b border-border-main px-6 py-5">
            <Link to="/patient" className="flex items-center gap-2">
              <Logo size="sm" />
              <div>
                <div className="text-base font-bold text-rose-500">{t("patient.zone") || "My Zone"}</div>
                <div className="text-xs text-text-dim">{t("common.holora") || "MeDecode"}</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4" onClick={() => setSidebarOpen(false)}>
            <NavLink to="/patient" end className={navClass}>
              <Home className="w-5 h-5" />
              <span>{t("patient.dashboard")}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("patient.discovery")}
              </p>
            </div>

            <NavLink to="/patient/branches" className={navClass}>
              <Hospital className="w-5 h-5" />
              <span>{t("patient.browseBranches")}</span>
            </NavLink>

            <NavLink to="/patient/doctors" className={navClass}>
              <Users className="w-5 h-5" />
              <span>{t("patient.browseDoctors")}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("patient.myActivity")}
              </p>
            </div>

            <NavLink to="/patient/appointments" className={navClass}>
              <Calendar className="w-5 h-5" />
              <span>{t("patient.myAppointments")}</span>
            </NavLink>

            <NavLink to="/patient/consultations" className={navClass}>
              <Stethoscope className="w-5 h-5" />
              <span>{t("patient.myConsultations")}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("patient.tools")}
              </p>
            </div>

            <NavLink to="/patient/holoramind" className={navClass}>
              <Bot className="w-5 h-5 text-rose-500" />
              <span className="font-semibold text-rose-500">{t("patient.aiAssistant")}</span>
            </NavLink>

            <NavLink to="/patient/profile" className={navClass}>
              <User className="w-5 h-5" />
              <span>{t("patient.profile")}</span>
            </NavLink>
          </nav>

          <div className="border-t border-border-main p-4">
            <div className="flex items-center gap-3 px-4 py-2 opacity-60">
               <Shield className="w-4 h-4 text-rose-500" />
               <span className="text-xs font-bold uppercase tracking-widest text-rose-500">{t("patient.zone")}</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <header className="flex h-16 items-center justify-between bg-bg-surface dark:bg-slate-800 px-6 shadow-sm border-b border-border-main z-40">
            <div className="flex items-center gap-4">
               <button onClick={() => setSidebarOpen(v => !v)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 lg:hidden">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
               </button>
               <h1 className="text-lg font-bold text-text-main flex items-center gap-2">
                 <Layout className="w-5 h-5 text-rose-500" />
                 {t("patient.myZone")}
               </h1>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBadge />
              <UserDropdown profilePath="/patient/profile" showTheme showLanguage />
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

export default PatientLayout;
