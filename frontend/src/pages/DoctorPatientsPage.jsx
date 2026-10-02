import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Calendar,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  Stethoscope,
  Phone,
  Mail,
  ClipboardList,
  UserCheck,
} from "lucide-react";
import { getMyDoctorPatientsApi } from "../services/doctorService";

const formatDate = (dateStr, locale) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "-";
  }
};

const GenderPill = ({ gender, t }) => {
  if (!gender) return null;
  const label =
    gender === "male"
      ? t("admin.genderMale")
      : gender === "female"
      ? t("admin.genderFemale")
      : t("admin.genderOther");
  const cls =
    gender === "male"
      ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
      : gender === "female"
      ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
};

const DoctorPatientsPage = () => {
  const { t, i18n } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyDoctorPatientsApi();
      setPatients(res.data || []);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          t("doctor.patientsPage.errors.loadFailed")
      );
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const kw = searchTerm.toLowerCase();
    return patients.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(kw) ||
        p.phone?.toLowerCase().includes(kw) ||
        p.email?.toLowerCase().includes(kw) ||
        p.patient_code?.toLowerCase().includes(kw)
    );
  }, [patients, searchTerm]);

  const stats = useMemo(() => ({
    total: patients.length,
    activeThisMonth: patients.filter(
      (p) =>
        p.last_appointment_date &&
        new Date(p.last_appointment_date).getMonth() === new Date().getMonth() &&
        new Date(p.last_appointment_date).getFullYear() === new Date().getFullYear()
    ).length,
    withAppointments: patients.filter((p) => p.appointment_count > 0).length,
    withConsultations: patients.filter((p) => p.consultation_count > 0).length,
  }), [patients]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">

      {/* â”€â”€ Hero â”€â”€ */}
      <section className="overflow-hidden rounded-[24px] bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] p-4 text-white shadow-lg sm:p-8 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">{t("doctor.zone")}</p>
            <h1 className="mt-2 text-xl font-bold tracking-tight sm:mt-3 sm:text-3xl md:text-4xl">
              {t("doctor.patientsPage.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85 sm:mt-3 md:text-base">
              {t("doctor.patientsPage.heroDescription")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-4 w-4" />
              {t("doctor.patientsPage.summaryTitle")}
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-white/75">{t("doctor.patientsPage.totalLabel")}</p>
          </div>
        </div>
      </section>

      {/* â”€â”€ Stats â”€â”€ */}
      <section className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-main bg-bg-surface p-3 shadow-sm sm:p-5 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-medium text-text-dim sm:text-sm">{t("doctor.patientsPage.stats.total")}</p>
            <Users className="hidden h-5 w-5 flex-shrink-0 text-blue-500 sm:block" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-text-main sm:mt-2 sm:text-3xl">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-3 shadow-sm sm:p-5 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-medium text-text-dim sm:text-sm">{t("doctor.patientsPage.stats.activeThisMonth")}</p>
            <Calendar className="hidden h-5 w-5 flex-shrink-0 text-green-500 sm:block" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-text-main sm:mt-2 sm:text-3xl">{stats.activeThisMonth}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-3 shadow-sm sm:p-5 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-medium text-text-dim sm:text-sm">{t("doctor.patientsPage.stats.appointments")}</p>
            <ClipboardList className="hidden h-5 w-5 flex-shrink-0 text-purple-500 sm:block" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-text-main sm:mt-2 sm:text-3xl">{stats.withAppointments}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-3 shadow-sm sm:p-5 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-medium text-text-dim sm:text-sm">{t("doctor.patientsPage.stats.consultations")}</p>
            <Stethoscope className="hidden h-5 w-5 flex-shrink-0 text-orange-500 sm:block" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-text-main sm:mt-2 sm:text-3xl">{stats.withConsultations}</p>
        </div>
      </section>

      {/* â”€â”€ List section â”€â”€ */}
      <section className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-text-main sm:text-lg">{t("doctor.patientsPage.listTitle")}</h2>
            <p className="text-xs text-text-dim sm:text-sm">{t("doctor.patientsPage.listDescription")}</p>
          </div>
          <button
            onClick={fetchPatients}
            className="inline-flex items-center gap-2 rounded-lg border border-border-main px-3 py-2 text-sm font-semibold text-text-main transition hover:bg-bg-app"
          >
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
          </button>
        </div>

        {error ? (
          <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Search */}
        <div className="border-b border-border-main px-4 py-3 sm:px-5 sm:py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("doctor.patientsPage.searchPlaceholder")}
              className="w-full rounded-xl border border-border-main bg-bg-app p-3 pl-10 text-sm text-text-main outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#BFDBFE] dark:bg-slate-900"
            />
          </div>
        </div>

        {/* â”€â”€ Mobile card list â”€â”€ */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-dim sm:hidden">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("doctor.patientsPage.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-dim sm:hidden">
            {searchTerm ? t("doctor.patientsPage.emptySearch") : t("doctor.patientsPage.emptyAll")}
          </div>
        ) : (
          <div className="divide-y divide-border-main/50 sm:hidden">
            {filtered.map((patient) => (
              <div key={patient.id} className="space-y-2.5 px-4 py-4">
                {/* Row 1: code + gender + visit counts */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      {patient.patient_code || "—"}
                    </span>
                    <GenderPill gender={patient.gender} t={t} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-dim">
                    <span className="rounded-md bg-purple-50 px-2 py-0.5 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                      {patient.appointment_count} {t("doctor.patientsPage.appointmentShort")}
                    </span>
                    <span className="rounded-md bg-orange-50 px-2 py-0.5 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                      {patient.consultation_count} {t("doctor.patientsPage.consultationShort")}
                    </span>
                  </div>
                </div>

                {/* Row 2: name */}
                <p className="text-sm font-semibold text-text-main">{patient.full_name}</p>

                {/* Row 3: contact + last visit */}
                <div className="flex items-center justify-between gap-2 text-xs text-text-dim">
                  <div className="flex flex-col gap-0.5">
                    {patient.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </span>
                    )}
                    {patient.email && (
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        {patient.email}
                      </span>
                    )}
                    {!patient.phone && !patient.email && <span>—</span>}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-text-dim/70">
                      {t("doctor.patientsPage.columns.lastVisit")}
                    </span>
                    <span className="font-medium text-text-main">
                      {patient.last_appointment_date
                        ? formatDate(patient.last_appointment_date, i18n.language)
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* â”€â”€ Desktop table â”€â”€ */}
        <div className="hidden overflow-x-auto px-2 pb-2 sm:block md:px-5 md:pb-5">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                <th className="px-3 py-4">{t("doctor.patientsPage.columns.code")}</th>
                <th className="px-3 py-4">{t("doctor.patientsPage.columns.name")}</th>
                <th className="px-3 py-4">{t("doctor.patientsPage.columns.contact")}</th>
                <th className="px-3 py-4">{t("doctor.patientsPage.columns.visits")}</th>
                <th className="px-3 py-4">{t("doctor.patientsPage.columns.lastVisit")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("doctor.patientsPage.loading")}
                    </span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    {searchTerm
                      ? t("doctor.patientsPage.emptySearch")
                      : t("doctor.patientsPage.emptyAll")}
                  </td>
                </tr>
              ) : (
                filtered.map((patient) => (
                  <tr key={patient.id} className="border-t border-border-main/70 text-sm">
                    <td className="px-3 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                        {patient.patient_code}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-text-main">{patient.full_name}</p>
                      <GenderPill gender={patient.gender} t={t} />
                    </td>
                    <td className="px-3 py-4">
                      {patient.phone && (
                        <p className="flex items-center gap-1 text-text-main">
                          <Phone className="h-3.5 w-3.5 text-text-dim" />
                          {patient.phone}
                        </p>
                      )}
                      {patient.email && (
                        <p className="flex items-center gap-1 text-xs text-text-dim">
                          <Mail className="h-3.5 w-3.5" />
                          {patient.email}
                        </p>
                      )}
                      {!patient.phone && !patient.email && <span className="text-text-dim">—</span>}
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1.5 text-text-main">
                          <UserCheck className="h-3.5 w-3.5 text-purple-500" />
                          <span className="font-semibold">{patient.appointment_count}</span>{" "}
                          {t("doctor.patientsPage.appointmentShort")}
                        </p>
                        <p className="flex items-center gap-1.5 text-text-dim">
                          <Stethoscope className="h-3.5 w-3.5 text-orange-500" />
                          <span className="font-semibold">{patient.consultation_count}</span>{" "}
                          {t("doctor.patientsPage.consultationShort")}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-text-main">
                      {patient.last_appointment_date
                        ? formatDate(patient.last_appointment_date, i18n.language)
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DoctorPatientsPage;
