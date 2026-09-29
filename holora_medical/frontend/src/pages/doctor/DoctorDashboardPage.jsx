import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity, ArrowRight, Calendar, CalendarClock, CheckCircle2, Clock,
  Home, MessageSquare, Sparkles, Stethoscope, UserCircle2, Users,
} from "lucide-react";
import { dashboardService } from "../../services/dashboardService";
import { earningsService } from "../../services/earningsService";
import { useAuth } from "../../context/AuthContext";

/* ── Helpers ─────────────────────────────── */
const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const formatTime = (t) => {
  if (!t) return "—";
  const s = String(t);
  return s.length >= 5 ? s.slice(0, 5) : s;
};

const STATUS_CLS = {
  scheduled:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  checked_in:  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  no_show:     "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  active:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive:    "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

/* ── Skeleton ──────────────────────────────── */
const SW = [75, 55, 40, 90, 60, 70, 50, 85];
const SkeletonCard = ({ i }) => (
  <div className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-5 dark:bg-slate-800">
    <div className="h-4 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
    <div className="mt-3 h-8 w-1/3 rounded-full bg-slate-200 dark:bg-slate-700" />
    <div className="mt-2 h-3 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[i % SW.length]}%` }} />
  </div>
);

/* ══════════════════════════════════════════════
   DoctorDashboardPage
   ══════════════════════════════════════════════ */
const DoctorDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [dashboardRes, earningsRes] = await Promise.all([
        dashboardService.getDoctorDashboard(),
        user?.id ? earningsService.getDoctorEarnings(user.id) : Promise.resolve(null)
      ]);
      setData(dashboardRes);
      setEarnings(earningsRes);
    } catch (err) {
      setError(err?.response?.data?.message || t("common.loadError", { defaultValue: "Failed to load data" }));
    } finally {
      setLoading(false);
    }
  }, [t, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const doctor = data?.doctor || {};
  const stats = useMemo(() => data?.stats || {}, [data]);
  const upcomingSchedules = data?.upcoming_schedules || [];
  const recentAppointments = data?.recent_appointments || [];

  const quickLinks = useMemo(() => [
    {
      icon: Calendar, title: t("doctor.myAppointments", { defaultValue: "My Appointments" }),
      desc: t("doctor.dashboard.appointmentsDesc", { defaultValue: "{{count}} today", count: stats.today_appointments || 0 }),
      link: "/doctor/appointments", accent: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
    },
    {
      icon: Stethoscope, title: t("doctor.consultationRequests", { defaultValue: "Consultations" }),
      desc: t("doctor.dashboard.consultationsDesc", { defaultValue: "{{count}} pending", count: stats.pending_consultations || 0 }),
      link: "/doctor/consultations", accent: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
    },
    {
      icon: CalendarClock, title: t("doctor.schedule", { defaultValue: "Work Schedule" }),
      desc: t("doctor.dashboard.scheduleDesc", { defaultValue: "Manage your availability" }),
      link: "/doctor/schedule", accent: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300",
    },
    {
      icon: Users, title: t("doctor.myPatients", { defaultValue: "My Patients" }),
      desc: t("doctor.dashboard.patientsDesc", { defaultValue: "{{count}} total", count: stats.total_patients || 0 }),
      link: "/doctor/patients", accent: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300",
    },
    {
      icon: CheckCircle2, title: t("doctor.earningsReport", { defaultValue: "Earnings Report" }),
      desc: t("doctor.earningsReportDesc", { defaultValue: "View all earnings history" }),
      link: "/doctor/earnings", accent: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-300",
    },
  ], [t, stats]);

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl" />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {t("doctor.zone", { defaultValue: "Doctor Zone" })}
                </p>
                <Link to="/" className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/20 transition">
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Homepage</span>
                </Link>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                {loading ? t("common.loading", { defaultValue: "Loading..." }) : t("doctor.dashboard.heroTitle", { defaultValue: "Welcome, Dr. {{name}}", name: doctor.full_name || "" })}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {t("doctor.dashboard.heroSub", { defaultValue: "Your workspace at a glance" })}
              </p>
              {!loading && (doctor.specialty_name || doctor.branch_names?.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {doctor.specialty_name && (
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                      {doctor.specialty_name}
                    </span>
                  )}
                  {doctor.branch_names?.map((b) => (
                    <span key={b} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {!loading && (
              <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  {t("doctor.dashboard.todayGlance", { defaultValue: "Today at a Glance" })}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.today_appointments || 0}</p>
                    <p className="text-xs text-slate-400">{t("doctor.dashboard.appointmentsShort", { defaultValue: "Appointments" })}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.pending_consultations || 0}</p>
                    <p className="text-xs text-slate-400">{t("doctor.dashboard.pendingShort", { defaultValue: "Pending" })}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats bar + Earnings */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
            {(loading ? Array.from({ length: 6 }) : [
              { label: t("doctor.dashboard.todayAppts", { defaultValue: "Today" }), value: stats.today_appointments, icon: Clock, accent: "text-cyan-400" },
              { label: t("doctor.dashboard.totalAppts", { defaultValue: "Appointments" }), value: stats.total_appointments, icon: Calendar, accent: "text-blue-400" },
              { label: t("doctor.dashboard.pendingConsult", { defaultValue: "Pending" }), value: stats.pending_consultations, icon: MessageSquare, accent: "text-amber-400" },
              { label: t("doctor.dashboard.totalConsult", { defaultValue: "Consultations" }), value: stats.total_consultations, icon: Stethoscope, accent: "text-emerald-400" },
              { label: t("doctor.dashboard.patients", { defaultValue: "Patients" }), value: stats.total_patients, icon: Users, accent: "text-rose-400" },
              { label: t("doctor.dashboard.earnings", { defaultValue: "Earnings" }), value: earnings?.totalEarnings, icon: CheckCircle2, accent: "text-cyan-500" },
            ]).map((s, i) => loading ? (
              <div key={i} className="animate-pulse rounded-xl bg-white/5 px-4 py-3">
                <div className="h-3 w-16 rounded bg-slate-700" />
                <div className="mt-2 h-6 w-10 rounded bg-slate-700" />
              </div>
            ) : (
              <div key={s.label} className="rounded-xl bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.accent}`} />
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
                <p className="mt-1 text-lg font-bold text-white">{s.label === t("doctor.dashboard.earnings", { defaultValue: "Earnings" }) ? (earnings ? earnings.totalEarnings?.toLocaleString("vi-VN") + " ₫" : 0) : (s.value ?? 0)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Access ── */}
      <div>
        <h2 className="text-lg font-bold text-text-main mb-4">
          {t("doctor.quickAccess", { defaultValue: "Quick Access" })}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.link}
              to={link.link}
              className="group rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800 sm:p-5"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${link.accent}`}>
                <link.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-text-main">{link.title}</h3>
              <p className="mt-1 text-xs text-text-dim">{link.desc}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 transition group-hover:gap-2">
                {t("common.open", { defaultValue: "Open" })}
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Appointments + Upcoming Schedule ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent appointments */}
        <div className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-border-main px-5 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="text-base font-semibold text-text-main">
                {t("doctor.dashboard.recentAppointments", { defaultValue: "Recent Appointments" })}
              </h3>
            </div>
            <Link to="/doctor/appointments" className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
              {t("common.viewAll", { defaultValue: "View all" })}
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} i={i} />)}
            </div>
          ) : recentAppointments.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-sm text-text-dim">
              <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
              {t("doctor.dashboard.noAppointments", { defaultValue: "No appointments yet" })}
            </div>
          ) : (
            <div className="divide-y divide-border-main">
              {recentAppointments.map((a) => (
                <Link key={a.id} to={`/doctor/appointments/${a.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{a.appointment_code}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLS[a.status] || ""}`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-text-main truncate">{a.patient_name || "—"}</p>
                    <p className="text-xs text-text-dim">{a.reason || "—"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-text-main">{formatDate(a.appointment_date)}</p>
                    <p className="text-xs text-text-dim">{formatTime(a.start_time)} – {formatTime(a.end_time)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming schedules */}
        <div className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-border-main px-5 py-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-semibold text-text-main">
                {t("doctor.dashboard.upcomingSchedule", { defaultValue: "Upcoming Schedule" })}
              </h3>
            </div>
            <Link to="/doctor/schedule" className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
              {t("common.manage", { defaultValue: "Manage" })}
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} i={i} />)}
            </div>
          ) : upcomingSchedules.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-sm text-text-dim">
              <CalendarClock className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
              {t("doctor.dashboard.noSchedule", { defaultValue: "No upcoming schedule" })}
            </div>
          ) : (
            <div className="divide-y divide-border-main">
              {upcomingSchedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-text-main">{formatDate(s.work_date)}</p>
                    <p className="text-xs text-text-dim">{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLS[s.status] || ""}`}>
                      {s.status}
                    </span>
                    <p className="mt-0.5 text-xs text-text-dim">{s.slot_duration}{t("common.minShort", { defaultValue: "min" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom cards ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Link
          to="/doctor/profile"
          className="group rounded-2xl border border-border-main bg-gradient-to-br from-slate-50 to-cyan-50/50 p-6 shadow-sm transition hover:shadow-md dark:from-slate-800 dark:to-cyan-900/10 dark:border-slate-700"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-main">{t("doctor.updateProfile", { defaultValue: "Update Profile" })}</h3>
              <p className="mt-1 text-xs text-text-dim">{t("doctor.updateProfileDesc", { defaultValue: "Keep your profile up to date for better visibility" })}</p>
            </div>
          </div>
        </Link>
        <Link
          to="/doctor/schedule"
          className="group rounded-2xl border border-border-main bg-gradient-to-br from-slate-50 to-amber-50/50 p-6 shadow-sm transition hover:shadow-md dark:from-slate-800 dark:to-amber-900/10 dark:border-slate-700"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-main">{t("doctor.setAvailability", { defaultValue: "Set Availability" })}</h3>
              <p className="mt-1 text-xs text-text-dim">{t("doctor.setAvailabilityDesc", { defaultValue: "Configure your working schedule so patients can book" })}</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
