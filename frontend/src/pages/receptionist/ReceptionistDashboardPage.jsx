import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Users, Phone, CheckCircle, AlertCircle, Home } from "lucide-react";

const ReceptionistDashboardPage = () => {
  const { user } = useAuth();
  const todayStats = {
    appointments: 12,
    checkIns: 8,
    pending: 4,
    calls: 25,
  };

  const quickLinks = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Manage Appointments",
      description: `${todayStats.appointments} today`,
      link: "/receptionist/appointments",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Patient Check-In",
      description: `${todayStats.checkIns} checked in`,
      link: "/receptionist/check-in",
      color: "bg-green-50 text-green-600",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Patient List",
      description: "Today's patients",
      link: "/receptionist/patients",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Call Log",
      description: `${todayStats.calls} calls`,
      link: "/receptionist/calls",
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#E06666] to-[#D85555] rounded-lg shadow-md p-8 text-white">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.full_name}! 👋</h1>
          <Link to="/" className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/25 transition shrink-0">
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Homepage</span>
          </Link>
        </div>
        <p className="text-white/90 text-lg">Today's reception overview and quick access to key tasks.</p>
        <div className="mt-4 flex gap-3 text-sm text-white/80">
          <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm font-medium">Today's Appointments</p>
              <p className="text-3xl font-bold text-text-main mt-2">{todayStats.appointments}</p>
            </div>
            <Calendar className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm font-medium">Checked In</p>
              <p className="text-3xl font-bold text-text-main mt-2">{todayStats.checkIns}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm font-medium">Pending Appointments</p>
              <p className="text-3xl font-bold text-text-main mt-2">{todayStats.pending}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-sm font-medium">Total Calls</p>
              <p className="text-3xl font-bold text-text-main mt-2">{todayStats.calls}</p>
            </div>
            <Phone className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-text-main mb-4">Quick Access</h2>
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
        <h3 className="text-lg font-semibold text-text-main mb-4">Upcoming Appointments</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-bg-app p-3 dark:bg-slate-700/50">
              <div>
                <p className="font-medium text-text-main">Patient Name</p>
                <p className="text-xs text-text-dim">Doctor Name • 10:30 AM - 11:00 AM</p>
              </div>
              <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-medium rounded">
                Check In
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboardPage;
