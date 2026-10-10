import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Users, Phone, CheckCircle, AlertCircle, Home } from "lucide-react";

const ReceptionistDashboardPage = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "en" ? "en-US" : "vi-VN";
  const todayStats = {
    appointments: 12,
    checkIns: 8,
    pending: 4,
    calls: 25,
  };

  const quickLinks = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: t("receptionistDashboard.manageAppointments"),
      description: t("receptionistDashboard.todayCount", { count: todayStats.appointments }),
      link: "/receptionist/appointments",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: t("receptionistDashboard.patientCheckIn"),
      description: t("receptionistDashboard.checkedInCount", { count: todayStats.checkIns }),
      link: "/receptionist/check-in",
      color: "bg-green-50 text-green-600",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t("receptionistDashboard.patientList"),
      description: t("receptionistDashboard.todayPatients"),
      link: "/receptionist/patients",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: t("receptionistDashboard.callLog"),
      description: t("receptionistDashboard.callsCount", { count: todayStats.calls }),
      link: "/receptionist/calls",
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#E06666] to-[#D85555] rounded-lg shadow-md p-8 text-white">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-bold mb-2">{t("receptionistDashboard.welcome", { name: user?.full_name })} 👋</h1>
          <Link to="/" className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/25 transition shrink-0">
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("common.homepage")}</span>
          </Link>
        </div>
        <p className="text-white/90 text-lg">{t("receptionistDashboard.subtitle")}</p>
        <div className="mt-4 flex gap-3 text-sm text-white/80">
          <span>📅 {new Date().toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm font-medium">{t("receptionistDashboard.todayAppointments")}</p>
              <p className="text-3xl font-bold text-text-main mt-2">{todayStats.appointments}</p>
            </div>
            <Calendar className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm font-medium">{t("receptionistDashboard.checkedIn")}</p>
              <p className="text-3xl font-bold text-text-main mt-2">{todayStats.checkIns}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm font-medium">{t("receptionistDashboard.pendingAppointments")}</p>
              <p className="text-3xl font-bold text-text-main mt-2">{todayStats.pending}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm font-medium">{t("receptionistDashboard.totalCalls")}</p>
              <p className="text-3xl font-bold text-text-main mt-2">{todayStats.calls}</p>
            </div>
            <Phone className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-text-main mb-4">{t("receptionistDashboard.quickAccess")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              to={link.link}
              className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-border-main hover:border-[#E06666]/30"
            >
              <div className={`w-12 h-12 rounded-lg ${link.color} flex items-center justify-center mb-4`}>
                {link.icon}
              </div>
              <h3 className="font-semibold text-text-main mb-1">{link.title}</h3>
              <p className="text-sm text-text-dim">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Appointments Preview */}
      <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-md p-6 border border-border-main">
        <h3 className="text-lg font-semibold text-text-main mb-4">{t("receptionistDashboard.upcomingAppointments")}</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-bg-app p-3 dark:bg-slate-700/50">
              <div>
                <p className="font-medium text-text-main">{t("receptionistDashboard.samplePatient")}</p>
                <p className="text-xs text-text-dim">{t("receptionistDashboard.sampleDoctor")} • 10:30 - 11:00</p>
              </div>
              <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-medium rounded">
                {t("receptionistDashboard.checkIn")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboardPage;
