import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, ShieldCheck, KeyRound, Stethoscope,
  Building2, UserCog, UserRound, Calendar, CalendarClock,
  MessageSquare, ClipboardList, GitBranch, FileText, Star,
} from "lucide-react";
import Logo from "../Logo";
import NotificationBadge from "../NotificationBadge";
import Breadcrumb from "../Breadcrumb";
import UserDropdown from "../UserDropdown";

const AdminLayout = ({ children }) => {
  const { user, role } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navClass = ({ isActive }) =>
    isActive
      ? "flex items-center gap-3 rounded-lg bg-[#E06666] px-4 py-2.5 text-white font-medium shadow-md shadow-[#E06666]/20 transition"
      : "flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-[#FFF5F5] dark:hover:bg-slate-800 hover:text-[#E06666] transition";

  // Kiểm tra quyền hiển thị menu item
  const canViewUsers = role === "super_admin" || role === "admin";
  const canViewRoles = role === "super_admin" || role === "admin";
  const canViewPermissions = role === "super_admin" || role === "admin";
  const canViewSpecialties = role === "super_admin" || role === "admin";
  const canViewBranches = role === "super_admin" || role === "admin";
  const canViewDoctors = role === "super_admin" || role === "admin";
  const canViewPatients = role === "super_admin" || role === "admin" || role === "doctor";
  const canViewAppointments = role === "super_admin" || role === "admin";
  const canViewDoctorAppointments = role === "doctor";
  const canViewSchedules = role === "super_admin" || role === "admin" || role === "doctor";
  const canViewConsultations = role === "super_admin" || role === "admin" || role === "doctor";
  const canViewDoctorRequests = role === "doctor" || role === "admin" || role === "super_admin";

  return (
    <div className="min-h-screen bg-bg-app transition-colors duration-200">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-bg-surface border-r border-border-main shadow-md transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="border-b border-border-main px-6 py-5">
            <Link to="/admin" className="flex items-center gap-2">
              <Logo size="sm" />
              <div>
                <div className="text-base font-bold text-[#E06666]">Holora Admin</div>
                <div className="text-xs text-text-dim">{t("admin.medicalDashboard")}</div>
              </div>
            </Link>
          </div>

          <nav className="space-y-1 p-4 overflow-y-auto flex-1" onClick={() => setSidebarOpen(false)}>
            <NavLink to="/admin" end className={navClass}>
              <LayoutDashboard className="w-5 h-5" />
              <span>{t("admin.dashboard")}</span>
            </NavLink>

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("admin.userAccessSection", { defaultValue: "User & Access" })}
              </p>
            </div>

            {canViewUsers && (
              <NavLink to="/admin/users" className={navClass}>
                <Users className="w-5 h-5" />
                <span>{t("admin.users")}</span>
              </NavLink>
            )}

            {canViewRoles && (
              <NavLink to="/admin/roles" className={navClass}>
                <ShieldCheck className="w-5 h-5" />
                <span>{t("admin.rolesManagement")}</span>
              </NavLink>
            )}

            {canViewPermissions && (
              <NavLink to="/admin/permissions" className={navClass}>
                <KeyRound className="w-5 h-5" />
                <span>{t("admin.permissionsManagement")}</span>
              </NavLink>
            )}

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("admin.clinicSection", { defaultValue: "Clinic" })}
              </p>
            </div>

            {canViewSpecialties && (
              <NavLink to="/admin/specialties" className={navClass}>
                <Stethoscope className="w-5 h-5" />
                <span>{t("specialty.managementTitle")}</span>
              </NavLink>
            )}

            {canViewBranches && (
              <NavLink to="/admin/branches" className={navClass}>
                <Building2 className="w-5 h-5" />
                <span>{t("branch.managementTitle")}</span>
              </NavLink>
            )}

            {canViewDoctors && (
              <NavLink to="/admin/doctors" className={navClass}>
                <UserCog className="w-5 h-5" />
                <span>{t("admin.doctorsManagement")}</span>
              </NavLink>
            )}

            {canViewPatients && (
              <NavLink to="/admin/patients" className={navClass}>
                <UserRound className="w-5 h-5" />
                <span>{t("admin.patients")}</span>
              </NavLink>
            )}

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("admin.operationsSection", { defaultValue: "Operations" })}
              </p>
            </div>

            {canViewAppointments && (
              <NavLink to="/admin/appointments" className={navClass}>
                <Calendar className="w-5 h-5" />
                <span>{t("admin.appointments")}</span>
              </NavLink>
            )}
            {canViewDoctorAppointments && (
              <NavLink to="/doctor/appointments" className={navClass}>
                <Calendar className="w-5 h-5" />
                <span>{t("admin.myAppointments")}</span>
              </NavLink>
            )}

            {canViewSchedules && (
              <NavLink to="/admin/schedules" className={navClass}>
                <CalendarClock className="w-5 h-5" />
                <span>{t("admin.scheduleManagement")}</span>
              </NavLink>
            )}

            {canViewConsultations && (
              <NavLink to="/admin/consultations" className={navClass}>
                <MessageSquare className="w-5 h-5" />
                <span>{t("admin.consultations")}</span>
              </NavLink>
            )}

            {canViewDoctorRequests && (
              <NavLink to="/doctor/consultations" className={navClass}>
                <ClipboardList className="w-5 h-5" />
                <span>{t("admin.patientConsultations")}</span>
              </NavLink>
            )}

            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-text-dim">
                {t("admin.systemSection", { defaultValue: "System" })}
              </p>
            </div>

            <NavLink to="/admin/version" className={navClass}>
              <GitBranch className="w-5 h-5" />
              <span>{t("admin.versionHistory", { defaultValue: "Version History" })}</span>
            </NavLink>

            {canViewUsers && (
              <NavLink to="/admin/audit-logs" className={navClass}>
                <FileText className="w-5 h-5" />
                <span>{t("admin.auditLogs", { defaultValue: "Audit Logs" })}</span>
              </NavLink>
            )}

            {canViewUsers && (
              <NavLink to="/admin/reviews" className={navClass}>
                <Star className="w-5 h-5" />
                <span>{t("admin.reviews", { defaultValue: "Reviews" })}</span>
              </NavLink>
            )}
          </nav>

          <div className="border-t border-border-main p-4">
            <div className="flex items-center gap-2 px-1 opacity-60">
              <span className="text-xs font-bold uppercase tracking-widest text-[#E06666]">{t("admin.adminZone", { defaultValue: "Admin Zone" })}</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Topbar */}
          <header className="flex items-center justify-between bg-bg-surface px-4 py-3 shadow-sm border-b border-border-main">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setSidebarOpen(v => !v)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 lg:hidden shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-text-main truncate">
                  {t("admin.adminDashboard")}
                </h1>
                <p className="text-xs text-text-dim truncate hidden sm:block">
                  {t("admin.welcome")}, {user?.full_name || t("common.user")} ({role})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <NotificationBadge />
              <UserDropdown profilePath="/admin/profile" showTheme showLanguage />
            </div>
          </header>

          {/* Breadcrumb */}
          <Breadcrumb />

          <main className="flex-1 p-3 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;