import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Building2, CalendarDays, Loader2, Mail, MapPin, MessageSquare, Phone, RefreshCw } from "lucide-react";
import { getMyBranchesApi } from "../services/patientService";

const fmtDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? `${value}`
    : date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

const buildBookingLink = (branchId) => `/patient/appointments?branchId=${branchId}`;

const BranchCard = ({ branch, type, t }) => {
  const isAppointment = type === "appointment";
  const count = isAppointment ? branch.appointment_count : branch.consultation_count;
  const lastDate = isAppointment ? branch.last_appointment_date : branch.last_consultation_date;

  return (
    <div className="rounded-2xl border border-border-main bg-bg-surface p-4 shadow-sm transition hover:shadow-md dark:bg-slate-800">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/20">
          <Building2 className="h-5 w-5 text-rose-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-text-main">{branch.name}</p>
          {branch.city && <p className="mt-0.5 text-xs font-medium text-rose-500">{branch.city}</p>}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
          {isAppointment ? <CalendarDays className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
          {count} {isAppointment ? t("patient.myBranches.appointments", { defaultValue: "appts" }) : t("patient.myBranches.consultations", { defaultValue: "consults" })}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 pl-1">
        {branch.address && (
          <div className="flex items-start gap-2 text-xs text-text-dim">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-dim" />
            <span>{branch.address}</span>
          </div>
        )}
        {branch.phone && (
          <div className="flex items-center gap-2 text-xs text-text-dim">
            <Phone className="h-3.5 w-3.5 shrink-0 text-text-dim" />
            <span>{branch.phone}</span>
          </div>
        )}
        {branch.email && (
          <div className="flex items-center gap-2 text-xs text-text-dim">
            <Mail className="h-3.5 w-3.5 shrink-0 text-text-dim" />
            <span className="truncate">{branch.email}</span>
          </div>
        )}
        <p className="pt-0.5 text-xs text-text-dim">
          {t("patient.myBranches.lastVisit", { defaultValue: "Last" })}: {fmtDate(lastDate)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={buildBookingLink(branch.id)}
          className="inline-flex items-center rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600"
        >
          {t("patient.myBranches.bookAppointment", { defaultValue: "Đặt lịch" })}
        </Link>
        <Link
          to={`/patient/branches/${branch.id}`}
          className="inline-flex items-center rounded-full border border-border-main bg-bg-app px-3 py-1.5 text-xs font-semibold text-text-main transition hover:border-rose-400 hover:text-rose-600 dark:bg-slate-900"
        >
          {t("patient.myBranches.viewDetail", { defaultValue: "Xem chi tiết" })}
        </Link>
      </div>
    </div>
  );
};

const Section = ({ title, icon: Icon, branches, type, emptyMsg, t }) => (
  <div>
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/20">
        <Icon className="h-4 w-4 text-rose-500" />
      </div>
      <h2 className="text-base font-bold text-text-main">{title}</h2>
      <span className="ml-auto rounded-full bg-bg-app px-2 py-0.5 text-xs font-medium text-text-dim dark:bg-slate-700">
        {branches.length}
      </span>
    </div>

    {branches.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-border-main bg-bg-app py-10 text-center text-sm text-text-dim">
        {emptyMsg}
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <BranchCard key={branch.id} branch={branch} type={type} t={t} />
        ))}
      </div>
    )}
  </div>
);

const PatientMyBranchesPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState({ appointments: [], consultations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getMyBranchesApi();
      setData(res.data || { appointments: [], consultations: [] });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t("common.loadError", { defaultValue: "Failed to load data" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{t("patient.myBranches.title", { defaultValue: "My Branches" })}</h1>
          </div>
          <p className="text-sm text-slate-400">
            {t("patient.myBranches.subtitle", { defaultValue: "Branches where you have used services" })}
          </p>
          {!loading && (
            <div className="mt-4 flex gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                <p className="text-lg font-bold text-white">{data.appointments.length}</p>
                <p className="text-xs text-slate-400">{t("patient.myBranches.byAppointment", { defaultValue: "Appointments" })}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                <p className="text-lg font-bold text-white">{data.consultations.length}</p>
                <p className="text-xs text-slate-400">{t("patient.myBranches.byConsultation", { defaultValue: "Consultations" })}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={fetchData} className="flex items-center gap-1 text-xs font-medium underline hover:no-underline">
            <RefreshCw className="h-3 w-3" />
            {t("common.retry", { defaultValue: "Retry" })}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-dim">
          <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
          <p className="text-sm">{t("common.loading", { defaultValue: "Loading..." })}</p>
        </div>
      ) : (
        <div className="space-y-8">
          <Section
            title={t("patient.myBranches.appointmentBranches", { defaultValue: "Appointment Branches" })}
            icon={CalendarDays}
            branches={data.appointments}
            type="appointment"
            emptyMsg={t("patient.myBranches.noAppointmentBranches", { defaultValue: "No branches from appointments yet" })}
            t={t}
          />
          <Section
            title={t("patient.myBranches.consultationBranches", { defaultValue: "Consultation Branches" })}
            icon={MessageSquare}
            branches={data.consultations}
            type="consultation"
            emptyMsg={t("patient.myBranches.noConsultationBranches", { defaultValue: "No branches from consultations yet" })}
            t={t}
          />
        </div>
      )}
    </div>
  );
};

export default PatientMyBranchesPage;
