import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { User, LogOut, Shield, Moon, Sun, Globe, Stethoscope, Building2, ClipboardList, Calculator } from "lucide-react";

const UserDropdown = ({ profilePath = "/patient/profile", showTheme = false, showLanguage = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E06666]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
      >
        <div className="w-9 h-9 rounded-full bg-[#E06666] flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {getInitials(user?.full_name)}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-text-main leading-tight truncate max-w-[120px]">
            {user?.full_name || t("common.user")}
          </p>
          <p className="text-[11px] text-text-dim leading-tight capitalize">
            {t(`admin.role${role.charAt(0).toUpperCase() + role.slice(1)}`) || role}
          </p>
        </div>
        <svg className={`w-4 h-4 text-text-dim transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-700 mb-1">
            <p className="text-sm font-bold text-text-main truncate">{user?.full_name}</p>
            <p className="text-xs text-text-dim truncate">{user?.email}</p>
          </div>

          <div className="px-2 space-y-1">
            <Link
              to={profilePath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-[#FFF5F5] dark:hover:bg-slate-700 hover:text-[#E06666] transition-colors"
            >
              <User className="w-4 h-4" />
              <span>{t("patient.myProfile")}</span>
            </Link>

            {role === "doctor" && (
              <Link to="/doctor" onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-[#FFF5F5] dark:hover:bg-slate-700 hover:text-[#E06666] transition-colors">
                <Stethoscope className="w-4 h-4" />
                <span>{t("doctor.zone") || "Doctor Zone"}</span>
              </Link>
            )}
            {role === "clinic_owner" && (
              <Link to="/clinic-owner" onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-[#FFF5F5] dark:hover:bg-slate-700 hover:text-[#E06666] transition-colors">
                <Building2 className="w-4 h-4" />
                <span>{t("clinicOwner.zone") || "Clinic Zone"}</span>
              </Link>
            )}
            {role === "receptionist" && (
              <Link to="/receptionist" onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-[#FFF5F5] dark:hover:bg-slate-700 hover:text-[#E06666] transition-colors">
                <ClipboardList className="w-4 h-4" />
                <span>{t("receptionist.zone") || "Receptionist Zone"}</span>
              </Link>
            )}
            {role === "accountant" && (
              <Link to="/accountant" onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-[#FFF5F5] dark:hover:bg-slate-700 hover:text-[#E06666] transition-colors">
                <Calculator className="w-4 h-4" />
                <span>{t("accountant.zone") || "Accountant Zone"}</span>
              </Link>
            )}
            {["admin", "super_admin"].includes(role) && (
              <Link to="/admin" onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-main hover:bg-[#FFF5F5] dark:hover:bg-slate-700 hover:text-[#E06666] transition-colors">
                <Shield className="w-4 h-4" />
                <span>{t("navbar.adminPanel")}</span>
              </Link>
            )}
          </div>

          {(showTheme || showLanguage) && (
            <>
              <div className="my-2 border-t border-gray-50 dark:border-slate-700" />
              <div className="px-2 space-y-1">
                {showTheme && (
                  <button
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm text-text-main transition-colors hover:bg-[#FFF5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E06666]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                      <span>{theme === "light" ? t("common.darkMode") || "Dark Mode" : t("common.lightMode") || "Light Mode"}</span>
                    </div>
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${theme === "dark" ? "bg-[#E06666]" : "bg-gray-200"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${theme === "dark" ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                  </button>
                )}
                {showLanguage && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-3 text-sm text-text-main">
                      <Globe className="w-4 h-4" />
                      <span>{t("common.language") || "Language"}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleLanguage("vi")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                          i18n.language === "vi" ? "bg-[#E06666] text-white" : "bg-gray-100 dark:bg-slate-700 text-text-dim hover:bg-gray-200 dark:hover:bg-slate-600"
                        }`}
                      >VI</button>
                      <button
                        onClick={() => toggleLanguage("en")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                          i18n.language === "en" ? "bg-[#E06666] text-white" : "bg-gray-100 dark:bg-slate-700 text-text-dim hover:bg-gray-200 dark:hover:bg-slate-600"
                        }`}
                      >EN</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="my-2 border-t border-gray-50 dark:border-slate-700" />

          <div className="px-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t("common.logout")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
