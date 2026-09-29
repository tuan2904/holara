import React from "react";
import { Link } from "react-router-dom";
import { Building2, Calendar, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

const formatCurrency = (value, locale, fallback) => {
  if (!value) return fallback;
  return `${Number(value).toLocaleString(locale)} VND`;
};

const buildBookingPath = (doctor) => {
  const params = new URLSearchParams();
  params.set("doctorId", doctor.id);

  if (Array.isArray(doctor.branches) && doctor.branches.length === 1) {
    params.set("branchId", doctor.branches[0].id);
  }

  return `/patient/appointments?${params.toString()}`;
};

const DoctorDirectoryCard = ({ doctor }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  return (
    <article className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#E06666]/35 hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:bg-[#141B29]">
      <div className="flex items-center gap-3">
        {doctor.avatar_url ? (
          <img
            src={doctor.avatar_url}
            alt={doctor.full_name || t("publicDoctors.shared.doctorFallbackName")}
            className="h-12 w-12 rounded-full border border-slate-200 object-cover dark:border-slate-700"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF4FF] text-[#2B6298] dark:bg-[#1D2C43] dark:text-[#9BC0EB]">
            <UserRound size={20} />
          </div>
        )}
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
            {doctor.full_name || t("publicDoctors.shared.doctorFallbackName")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {doctor.specialty_name || t("publicDoctors.shared.specialtyFallback")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#FFF3F2] px-2.5 py-1 text-xs font-semibold text-[#BC4D4D] dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
          <Building2 size={13} />
          <span className="line-clamp-1 max-w-[210px]">
            {doctor.branch_names || t("publicDoctors.shared.branchFallback")}
          </span>
        </p>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-slate-300">
        <p>
          {t("publicDoctors.directory.card.experience")}: {" "}
          <span className="font-medium text-gray-900 dark:text-slate-100">
            {doctor.experience_years
              ? t("publicDoctors.directory.card.years", { count: doctor.experience_years })
              : t("publicDoctors.shared.updating")}
          </span>
        </p>
        <p className="line-clamp-2">
          {t("publicDoctors.directory.card.qualification")}: {" "}
          <span className="font-medium text-gray-900 dark:text-slate-100">
            {doctor.qualification || t("publicDoctors.shared.updating")}
          </span>
        </p>
        {doctor.bio ? <p className="line-clamp-3 text-gray-500 dark:text-slate-400">{doctor.bio}</p> : null}
      </div>

      <div className="mt-auto pt-5">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#FFF7F5] px-4 py-3 dark:bg-[#1D2433]">
          <span className="text-xs uppercase tracking-[0.14em] text-gray-500 dark:text-slate-400">
            {t("publicDoctors.directory.card.consultationFee")}
          </span>
          <span className="text-sm font-semibold text-[#B64949] dark:text-[#F3A3A3]">
            {formatCurrency(doctor.consultation_fee, locale, t("publicDoctors.shared.feeFallback"))}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to={buildBookingPath(doctor)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E06666] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#D55555]"
          >
            <Calendar size={16} />
            {t("publicDoctors.directory.card.bookAppointment", { defaultValue: "Đặt lịch" })}
          </Link>
          <Link
            to={`/doctors/${doctor.id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-[#E06666]/30 bg-[#FFF5F5] px-4 py-3 text-sm font-semibold text-[#B64949] transition hover:bg-[#FFECEB] dark:border-[#E06666]/20 dark:bg-[#2B1F28] dark:text-[#F3A3A3]"
          >
            {t("publicDoctors.directory.card.viewProfile")}
          </Link>
        </div>
      </div>
    </article>
  );
};

export default DoctorDirectoryCard;
