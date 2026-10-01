import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity, ArrowRight, Bot, Calendar, CalendarClock, CheckCircle2, Clock,
  Heart, Home, MapPin, MessageSquare, Sparkles, Stethoscope, UserCircle2, Users,
} from "lucide-react";
import { dashboardService } from "../../services/dashboardService";

/* ── Helpers ─────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (t) => { if (!t) return "—"; const s = String(t); return s.length >= 5 ? s.slice(0, 5) : s; };

const STATUS_CLS = {
  scheduled:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  checked_in:  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed:   "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  pending:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

/* ── Skeletons ─────────────────────────────── */
const SW = [75, 55, 40, 90, 60, 70, 50, 85];
const SkeletonCard = ({ i }) => (
  <div className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-5 dark:bg-slate-800">
    <div className="h-4 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
    <div className="mt-3 h-8 w-1/3 rounded-full bg-slate-200 dark:bg-slate-700" />
    <div className="mt-2 h-3 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[i % SW.length]}%` }} />
  </div>
);

/* ══════════════════════════════════════════════
   PatientDashboardPage — Patient Zone (rose)
   ══════════════════════════════════════════════ */
const PatientDashboardPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await dashboardService.getPatientDashboard();
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || t("common.loadError", { defaultValue: "Failed to load data" }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const patient = useMemo(() => data?.patient || {}, [data]);
  const stats = useMemo(() => data?.stats || {}, [data]);
  const nextAppt = data?.next_appointment || null;
  const recentAppointments = data?.recent_appointments || [];
  const recentConsultations = data?.recent_consultations || [];

  const quickLinks = useMemo(() => [
    {
      icon: Calendar, title: t("patient.myAppointments", { defaultValue: "My Appointments" }),
      desc: t("patient.dashboard.appointmentsDesc", { defaultValue: "{{count}} upcoming", count: stats.upcoming_appointments || 0 }),
      link: "/patient/appointments", accent: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
    },
    {
      icon: Stethoscope, title: t("patient.myConsultations", { defaultValue: "Consultations" }),
      desc: t("patient.dashboard.consultationsDesc", { defaultValue: "{{count}} pending", count: stats.pending_consultations || 0 }),
      link: "/patient/consultations", accent: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
    },
    {
      icon: Bot, title: t("patient.aiAssistant", { defaultValue: "AI Assistant" }),
      desc: t("patient.dashboard.aiDesc", { defaultValue: "Get instant health advice" }),
      link: "/patient/holoramind", accent: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300",
    },
    {
      icon: UserCircle2, title: t("patient.profile", { defaultValue: "My Profile" }),
      desc: t("patient.dashboard.profileDesc", { defaultValue: "{{percent}}% complete", percent: patient.profile_percent || 0 }),
      link: "/patient/profile", accent: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300",
    },
  ], [t, stats, patient]);

  return (
    <div className="space-y-6">

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── Hero ── */}
      {loading ? (
        <div className="animate-pulse rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 md:p-10">
          <div className="h-3 w-24 rounded bg-slate-700" />
          <div className="mt-4 h-8 w-72 rounded bg-slate-700" />
          <div className="mt-3 h-4 w-96 rounded bg-slate-700" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-white/5" />)}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-500/10 blur-2xl" />

          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    {t("patient.zone", { defaultValue: "Patient Zone" })}
                  </p>
                  <Link to="/" className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/20 transition">
                    <Home className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Homepage</span>
                  </Link>
                </div>
                <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  {t("patient.dashboard.heroTitle", { defaultValue: "Welcome, {{name}}", name: patient.full_name || "" })}
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  {t("patient.dashboard.heroSub", { defaultValue: "Your health journey at a glance" })}
                </p>
                {patient.patient_code && (
                  <span className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                    {patient.patient_code}
                  </span>
                )}
              </div>

              {!loading && (
                <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Sparkles className="h-4 w-4 text-rose-400" />
                    {t("patient.dashboard.overview", { defaultValue: "Overview" })}
                  </div>
                  <p className="mt-1 text-2xl font-bold text-white">{stats.total_appointments || 0}</p>
                  <p className="text-xs text-slate-400">{t("patient.dashboard.totalAppts", { defaultValue: "total appointments" })}</p>
                </div>
              )}
            </div>

            {/* Stat pills */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: t("patient.dashboard.upcoming", { defaultValue: "Upcoming" }), value: stats.upcoming_appointments || 0, color: "text-rose-400" },
                { label: t("patient.dashboard.totalAppts", { defaultValue: "Total Appts" }), value: stats.total_appointments || 0, color: "text-blue-400" },
                { label: t("patient.dashboard.pendingConsult", { defaultValue: "Pending Consult" }), value: stats.pending_consultations || 0, color: "text-amber-400" },
                { label: t("patient.dashboard.completedConsult", { defaultValue: "Completed" }), value: stats.completed_consultations || 0, color: "text-emerald-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Next Appointment Banner ── */}
      {!loading && nextAppt && (
        <Link to={`/patient/appointments/${nextAppt.id}`}
          className="group flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-rose-800 dark:bg-rose-900/20">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                {t("patient.dashboard.nextAppointment", { defaultValue: "Next Appointment" })}
              </p>
              <p className="mt-0.5 text-sm font-bold text-text-main">
                {fmtDate(nextAppt.appointment_date)} &middot; {fmtTime(nextAppt.start_time)} – {fmtTime(nextAppt.end_time)}
              </p>
              <p className="text-xs text-text-dim">
                {nextAppt.doctor_name && `Dr. ${nextAppt.doctor_name}`}
                {nextAppt.specialty_name && ` · ${nextAppt.specialty_name}`}
                {nextAppt.branch_name && ` · ${nextAppt.branch_name}`}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-rose-400 transition group-hover:translate-x-1" />
        </Link>
      )}

      {/* ── Quick Access Grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0,1,2,3].map(i => <SkeletonCard key={i} i={i} />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickLinks.map((q) => (
            <Link key={q.link} to={q.link}
              className="group rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm transition hover:shadow-md dark:bg-slate-800">
              <div className={`inline-flex rounded-xl p-2.5 ${q.accent}`}>
                <q.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-text-main">{q.title}</h3>
              <p className="mt-1 text-xs text-text-dim">{q.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-rose-500 transition group-hover:gap-2">
                {t("common.details", { defaultValue: "View" })} <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Two-Column: Recent Appointments + Recent Consultations ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent Appointments */}
        <section className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-border-main px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-text-main">
              <Calendar className="h-4 w-4 text-rose-500" />
              {t("patient.dashboard.recentAppointments", { defaultValue: "Recent Appointments" })}
            </h2>
            <Link to="/patient/appointments" className="text-xs font-semibold text-rose-500 hover:underline">
              {t("common.viewAll", { defaultValue: "View all" })}
            </Link>
          </div>
          <div className="divide-y divide-border-main">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="animate-pulse p-4"><div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" /><div className="mt-2 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" /></div>)
            ) : recentAppointments.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-text-dim">
                {t("patient.dashboard.noAppointments", { defaultValue: "No appointments yet" })}
              </div>
            ) : recentAppointments.map((a) => (
              <Link key={a.id} to={`/patient/appointments/${a.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-bg-app">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-900/20">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-main">
                    {a.appointment_code} &middot; {a.doctor_name && `Dr. ${a.doctor_name}`}
                  </p>
                  <p className="text-xs text-text-dim">
                    {fmtDate(a.appointment_date)} &middot; {fmtTime(a.start_time)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_CLS[a.status] || "bg-slate-100 text-slate-600"}`}>
                  {a.status}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Consultations */}
        <section className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-border-main px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-text-main">
              <Stethoscope className="h-4 w-4 text-emerald-500" />
              {t("patient.dashboard.recentConsultations", { defaultValue: "Recent Consultations" })}
            </h2>
            <Link to="/patient/consultations" className="text-xs font-semibold text-rose-500 hover:underline">
              {t("common.viewAll", { defaultValue: "View all" })}
            </Link>
          </div>
          <div className="divide-y divide-border-main">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="animate-pulse p-4"><div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" /><div className="mt-2 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" /></div>)
            ) : recentConsultations.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-text-dim">
                {t("patient.dashboard.noConsultations", { defaultValue: "No consultations yet" })}
              </div>
            ) : recentConsultations.map((c) => (
              <Link key={c.id} to={`/patient/consultations/${c.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-bg-app">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-main">{c.chief_complaint || "—"}</p>
                  <p className="text-xs text-text-dim">
                    {c.doctor_name ? `Dr. ${c.doctor_name}` : t("patient.dashboard.unassigned", { defaultValue: "Unassigned" })}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_CLS[c.status] || "bg-slate-100 text-slate-600"}`}>
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ── Bottom Row: Discovery + AI + Profile ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Discovery card */}
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <h3 className="flex items-center gap-2 text-sm font-bold text-text-main">
            <MapPin className="h-4 w-4 text-rose-500" />
            {t("patient.discovery", { defaultValue: "Discover" })}
          </h3>
          <div className="mt-4 space-y-2">
            <Link to="/patient/branches"
              className="flex items-center justify-between rounded-xl bg-bg-app p-3 transition hover:bg-slate-100 dark:hover:bg-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                  <Heart className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-text-main">{t("patient.browseBranches", { defaultValue: "Browse Branches" })}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-text-dim" />
            </Link>
            <Link to="/patient/doctors"
              className="flex items-center justify-between rounded-xl bg-bg-app p-3 transition hover:bg-slate-100 dark:hover:bg-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-text-main">{t("patient.browseDoctors", { defaultValue: "Browse Doctors" })}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-text-dim" />
            </Link>
          </div>
        </div>

        {/* AI card */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-white">
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl" />
          <div className="relative">
            <div className="inline-flex rounded-xl bg-rose-500 p-2.5 shadow-lg shadow-rose-500/30">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-bold">{t("patient.aiAssistant", { defaultValue: "MeDecode AI AI" })}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {t("patient.aiAssistantDescription", { defaultValue: "Get instant health insights from our AI assistant" })}
            </p>
            <Link to="/patient/holoramind"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-white">
              {t("patient.startChat", { defaultValue: "Start Chat" })} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="inline-flex rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-text-main">{t("patient.completeProfile", { defaultValue: "Complete Profile" })}</h3>
          <p className="mt-1 text-xs text-text-dim">{t("patient.completeProfileDesc", { defaultValue: "Keep your medical info up to date" })}</p>

          {/* Progress bar */}
          {!loading && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-dim">{t("patient.dashboard.completion", { defaultValue: "Completion" })}</span>
                <span className="font-bold text-rose-500">{patient.profile_percent || 0}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${patient.profile_percent || 0}%` }} />
              </div>
            </div>
          )}

          <Link to="/patient/profile"
            className="mt-4 block w-full rounded-xl bg-bg-app py-2.5 text-center text-sm font-bold text-text-main transition hover:bg-rose-500 hover:text-white dark:bg-slate-700">
            {t("common.editProfile", { defaultValue: "Edit Profile" })}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboardPage;
