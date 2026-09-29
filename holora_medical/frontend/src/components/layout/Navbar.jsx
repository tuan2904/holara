import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import Logo from "../Logo";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Calculator,
  CreditCard,
  Home,
  LogIn,
  LogOut,
  MapPinned,
  Moon,
  MessageSquare,
  Shield,
  Sparkles,
  Stethoscope,
  Sun,
  UserPlus,
  UserRound,
} from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = role === "super_admin" || role === "admin";
  const isDoctor = role === "doctor";
  const isPatient = role === "patient";
  const isClinicOwner = role === "clinic_owner";
  const displayName = isAuthenticated
    ? (user?.full_name || user?.username || user?.email || t("common.user"))
    : t("common.guest", { defaultValue: "Guest" });
  const avatarInitial = displayName?.charAt(0)?.toUpperCase() || "G";
  const themeLabel = theme === "light"
    ? t("common.darkMode", { defaultValue: "Dark Mode" })
    : t("common.lightMode", { defaultValue: "Light Mode" });

  const menuLinkClass = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-[#E06666] dark:text-slate-200 dark:hover:bg-slate-800";
  const subLinkClass = "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-[#E06666] dark:text-slate-400 dark:hover:bg-slate-800";

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const onEsc = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <nav className="relative z-[100] overflow-visible border-b border-[#E06666]/15 bg-white/95 shadow-sm backdrop-blur dark:bg-slate-900/95 dark:border-slate-700">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 overflow-visible px-3 py-2.5 md:px-5">
        <Link to="/" className="flex items-center gap-2.5 transition hover:opacity-85">
          <Logo size="md" />
          <span className="text-base font-semibold tracking-tight text-[#E06666] sm:text-lg">
            HoloraMed
          </span>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <Link to="/" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
            {t("navbar.home")}
          </Link>
          <Link to="/doctors" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
            {t("navbar.doctors")}
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
            {t("navbar.pricing")}
          </Link>
          <Link to="/branches" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
            {t("navbar.branches") || "Branches"}
          </Link>
          <Link to="/holoramind" className="text-sm font-medium text-gray-700 transition hover:text-[#E06666] dark:text-slate-200">
            HoloraMind
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-lg bg-[#E06666]/10 px-3 py-1.5 text-sm font-semibold text-[#E06666] transition hover:bg-[#E06666]/20"
            >
              {t("navbar.adminPanel")}
            </Link>
          )}

          {isDoctor && (
            <Link
              to="/doctor"
              className="rounded-lg bg-blue-100/40 px-3 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100/60 dark:text-blue-300"
            >
              {t("navbar.doctorZone")}
            </Link>
          )}

          {isPatient && (
            <Link
              to="/patient"
              className="rounded-lg bg-green-100/40 px-3 py-1.5 text-sm font-semibold text-green-600 transition hover:bg-green-100/60 dark:text-green-300"
            >
              {t("navbar.patientZone")}
            </Link>
          )}

          {isClinicOwner && (
            <Link
              to="/clinic-owner"
              className="rounded-lg bg-purple-100/40 px-3 py-1.5 text-sm font-semibold text-purple-600 transition hover:bg-purple-100/60 dark:text-purple-300"
            >
              {t("navbar.clinicZone")}
            </Link>
          )}

          {role === "receptionist" && (
            <Link
              to="/receptionist"
              className="rounded-lg bg-teal-100/40 px-3 py-1.5 text-sm font-semibold text-teal-600 transition hover:bg-teal-100/60 dark:text-teal-300"
            >
              {t("receptionist.zone") || "Receptionist Zone"}
            </Link>
          )}

          {role === "accountant" && (
            <Link
              to="/accountant"
              className="rounded-lg bg-amber-100/40 px-3 py-1.5 text-sm font-semibold text-amber-600 transition hover:bg-amber-100/60 dark:text-amber-300"
            >
              {t("accountant.zone") || "Accountant Zone"}
            </Link>
          )}
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#E06666]/40 hover:text-[#E06666] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E06666]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus-visible:ring-offset-slate-900"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E06666] text-xs font-bold uppercase text-white shadow-sm">
              {avatarInitial}
            </span>
            <span className="max-w-[140px] truncate text-sm font-medium">{displayName}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-[120] mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 space-y-1 md:hidden">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-slate-500">
                  {t("navbar.navigation") || "Navigation"}
                </p>
                <Link to="/" onClick={() => setMenuOpen(false)} className={menuLinkClass}>
                  <Home className="h-4 w-4 shrink-0" />
                  <span>{t("navbar.home")}</span>
                </Link>
                <Link to="/doctors" onClick={() => setMenuOpen(false)} className={menuLinkClass}>
                  <Stethoscope className="h-4 w-4 shrink-0" />
                  <span>{t("navbar.doctors")}</span>
                </Link>
                <Link to="/pricing" onClick={() => setMenuOpen(false)} className={menuLinkClass}>
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span>{t("navbar.pricing")}</span>
                </Link>
                <Link to="/branches" onClick={() => setMenuOpen(false)} className={menuLinkClass}>
                  <MapPinned className="h-4 w-4 shrink-0" />
                  <span>{t("navbar.branches") || "Branches"}</span>
                </Link>
                <Link to="/holoramind" onClick={() => setMenuOpen(false)} className={menuLinkClass}>
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>HoloraMind</span>
                </Link>
                <div className="mt-2 border-t border-gray-100 dark:border-slate-700" />
              </div>

              {isAuthenticated && (
                <div className="mb-3 rounded-xl bg-gray-50 p-3 dark:bg-slate-800">
                  <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">
                    {user?.full_name || user?.username || t("common.user")}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                    {user?.email || role}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 transition hover:border-[#E06666]/40 hover:text-[#E06666] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E06666]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus-visible:ring-offset-slate-900 dark:hover:border-[#E06666]/40 dark:hover:text-[#F8B4B4]"
                >
                  <span className="flex items-center gap-3">
                    {theme === "light" ? (
                      <Moon className="h-4 w-4 shrink-0" />
                    ) : (
                      <Sun className="h-4 w-4 shrink-0 text-yellow-400" />
                    )}
                    <span className="font-medium">{themeLabel}</span>
                  </span>
                  <span className={`relative h-5 w-9 rounded-full transition-colors ${theme === "dark" ? "bg-[#E06666]" : "bg-gray-200"}`}>
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        theme === "dark" ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </span>
                </button>

                <LanguageSwitcher variant="menu" className="w-full" />
              </div>

              <div className="my-3 border-t border-gray-100 dark:border-slate-700" />

              <div className="space-y-2">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#E06666]/40 hover:text-[#E06666] dark:border-slate-700 dark:text-slate-200"
                    >
                      <LogIn className="h-4 w-4 shrink-0" />
                      <span>{t("navbar.login")}</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg bg-[#E06666] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#D55555]"
                    >
                      <UserPlus className="h-4 w-4 shrink-0" />
                      <span>{t("navbar.register")}</span>
                    </Link>
                  </>
                ) : (
                  <>
                    {role === "patient" && (
                      <Link
                        to="/patient"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl bg-[#E06666] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D55555]"
                      >
                        <span className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 shrink-0" />
                          <span>{t("navbar.patientZone") || "Patient Zone"}</span>
                        </span>
                      </Link>
                    )}

                    {role === "doctor" && (
                      <Link
                        to="/doctor"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <span className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 shrink-0" />
                          <span>{t("navbar.doctorZone") || "Doctor Zone"}</span>
                        </span>
                      </Link>
                    )}

                    {role === "clinic_owner" && (
                      <Link
                        to="/clinic-owner"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl bg-purple-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
                      >
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span>{t("navbar.clinicZone") || "Clinic Zone"}</span>
                        </span>
                      </Link>
                    )}

                    {role === "receptionist" && (
                      <Link
                        to="/receptionist"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl bg-teal-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                      >
                        <span className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 shrink-0" />
                          <span>{t("receptionist.zone") || "Receptionist Zone"}</span>
                        </span>
                      </Link>
                    )}

                    {role === "accountant" && (
                      <Link
                        to="/accountant"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
                      >
                        <span className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 shrink-0" />
                          <span>{t("accountant.zone") || "Accountant Zone"}</span>
                        </span>
                      </Link>
                    )}

                    {(role === "admin" || role === "super_admin") && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl bg-gray-800 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600"
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4 shrink-0" />
                          <span>{t("navbar.adminPanel") || "Admin Panel"}</span>
                        </span>
                      </Link>
                    )}

                    {role === "patient" && (
                      <div className="space-y-1 pt-1">
                        <Link to="/patient/appointments" onClick={() => setMenuOpen(false)} className={subLinkClass}>
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          <span>{t("patient.myAppointments")}</span>
                        </Link>
                        <Link to="/patient/consultations" onClick={() => setMenuOpen(false)} className={subLinkClass}>
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span>{t("patient.myConsultations")}</span>
                        </Link>
                        <Link to="/patient/profile" onClick={() => setMenuOpen(false)} className={subLinkClass}>
                          <UserRound className="h-4 w-4 shrink-0" />
                          <span>{t("patient.profile")}</span>
                        </Link>
                      </div>
                    )}

                    {role === "doctor" && (
                      <div className="space-y-1 pt-1">
                        <Link to="/doctor/appointments" onClick={() => setMenuOpen(false)} className={subLinkClass}>
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          <span>{t("navbar.appointments")}</span>
                        </Link>
                        <Link to="/doctor/consultations" onClick={() => setMenuOpen(false)} className={subLinkClass}>
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span>{t("navbar.consultations")}</span>
                        </Link>
                        <Link to="/doctor/schedule" onClick={() => setMenuOpen(false)} className={subLinkClass}>
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          <span>{t("navbar.schedule")}</span>
                        </Link>
                        <Link to="/doctor/profile" onClick={() => setMenuOpen(false)} className={subLinkClass}>
                          <UserRound className="h-4 w-4 shrink-0" />
                          <span>{t("navbar.profile")}</span>
                        </Link>
                      </div>
                    )}

                    {role === "clinic_owner" && (
                      <div className="space-y-1 pt-1">
                        <Link to="/clinic-owner/doctors" onClick={() => setMenuOpen(false)} className={subLinkClass}>
                          <Stethoscope className="h-4 w-4 shrink-0" />
                          <span>{t("navbar.doctors")}</span>
                        </Link>
                        <Link to="/clinic-owner/branches" onClick={() => setMenuOpen(false)} className={subLinkClass}>
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span>{t("navbar.branches")}</span>
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-gray-100 pt-2 dark:border-slate-700" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg bg-gray-100 px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>{t("navbar.logout")}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
