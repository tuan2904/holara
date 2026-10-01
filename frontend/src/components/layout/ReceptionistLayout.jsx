import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import Logo from "../Logo";
import NotificationBadge from "../NotificationBadge";
import Breadcrumb from "../Breadcrumb";

const ReceptionistLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
            <Link to="/receptionist" className="flex items-center gap-2">
              <Logo size="sm" />
              <div>
                <div className="text-base font-bold text-[#E06666]">{t("receptionist.zone") || "Receptionist"}</div>
                <div className="text-xs text-text-dim">{t("common.holora") || "MeDecode"}</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4" onClick={() => setSidebarOpen(false)}>
            <NavLink to="/receptionist" end className={navClass}>
              <span>📋</span>
              <span>{t("receptionist.dashboard") || "Dashboard"}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("receptionist.appointments") || "Appointments"}
              </p>
            </div>

            <NavLink to="/receptionist/appointments" className={navClass}>
              <span>📅</span>
              <span>{t("receptionist.manageAppointments") || "Manage Appointments"}</span>
            </NavLink>

            <NavLink to="/receptionist/patients" className={navClass}>
              <span>👥</span>
              <span>{t("receptionist.patientList") || "Patient List"}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("receptionist.staff") || "Staff Management"}
              </p>
            </div>

            <NavLink to="/receptionist/check-in" className={navClass}>
              <span>✓</span>
              <span>{t("receptionist.checkIn") || "Check-In"}</span>
            </NavLink>

            <NavLink to="/receptionist/calls" className={navClass}>
              <span>☎️</span>
              <span>{t("receptionist.calls") || "Call Log"}</span>
            </NavLink>
          </nav>

          <div className="border-t border-border-main p-4 space-y-3">
            <p className="text-xs text-text-dim truncate">{user?.full_name || user?.email}</p>
            <p className="text-xs text-[#E06666] font-medium capitalize">{t("common.receptionist") || "Receptionist"}</p>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg bg-gray-100 dark:bg-slate-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
            >
              {t("common.logout")}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Topbar */}
          <header className="flex items-center justify-between bg-bg-surface dark:bg-slate-800 px-4 py-4 shadow-sm border-b border-border-main">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(v => !v)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 lg:hidden">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-text-main">{t("receptionist.zone") || "Receptionist Zone"}</h1>
                <p className="text-sm text-text-dim">
                  {t("admin.welcome")}, {user?.full_name || t("common.user")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBadge />
              <button
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E06666]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-slate-700 dark:text-yellow-400 dark:focus-visible:ring-offset-slate-900 dark:hover:bg-slate-600"
              >
                {theme === "light" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 5.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
              <LanguageSwitcher />
            </div>
          </header>

          {/* Breadcrumb */}
          <Breadcrumb />

          {/* Main content area */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistLayout;
