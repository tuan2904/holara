import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeDollarSign,
  BriefcaseMedical,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDoctorByIdApi } from "../services/doctorService";
import subscriptionService from "../services/subscriptionService";
import { getDoctorReviewsApi, getDoctorRatingSummaryApi } from "../services/reviewService";
import RatingSummary from "../components/RatingSummary";
import ReviewCard from "../components/ReviewCard";
import { useAuth } from "../context/AuthContext";

const unwrap = (payload) => payload?.data || payload;

const formatCurrency = (value, locale, fallback) => {
  if (!value) return fallback;
  return `${Number(value).toLocaleString(locale)} VND`;
};

const maskEmail = (email, fallback) => {
  if (!email) return fallback;
  const [localPart, domain] = String(email).split("@");
  if (!localPart || !domain) return fallback;

  if (localPart.length <= 2) {
    return `${localPart[0] || ""}***@${domain}`;
  }

  return `${localPart[0]}${"*".repeat(Math.max(6, localPart.length - 2))}${localPart[localPart.length - 1]}@${domain}`;
};

const maskPhone = (phone, fallback) => {
  if (!phone) return fallback;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return fallback;
  if (digits.length <= 3) return `${digits[0] || ""}**`;
  return `${digits.slice(0, 2)}******${digits.slice(-1)}`;
};

const DoctorPublicDetailPage = () => {
  const { id } = useParams();
  const { user, role, roles = [] } = useAuth();
  const { t, i18n } = useTranslation();
  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [accountSubscription, setAccountSubscription] = useState(null);
  const [showFullContact, setShowFullContact] = useState(false);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPagination, setReviewsPagination] = useState(null);

  const locale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
  const isPrivilegedAdmin = role === "admin" || role === "super_admin" || roles.includes("admin") || roles.includes("super_admin");

  useEffect(() => {
    const loadDoctor = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await getDoctorByIdApi(id);
        setDoctor(unwrap(response));
      } catch (err) {
        console.error("Failed to load doctor detail", err);
        setError("publicDoctors.detail.errorLoad");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctor();
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadSubscription = async () => {
      if (!user || isPrivilegedAdmin) {
        setAccountSubscription(null);
        return;
      }

      try {
        const subscriptionRes = await subscriptionService.getMySubscriptions();
        const subscriptions = Array.isArray(subscriptionRes)
          ? subscriptionRes
          : (subscriptionRes?.data ?? []);

        const activeSubscription = subscriptions
          .filter((item) => item?.status === "active")
          .sort(
            (a, b) =>
              new Date(b?.ends_at || b?.end_date || 0).getTime() - new Date(a?.ends_at || a?.end_date || 0).getTime()
          )[0] || null;

        if (active) {
          setAccountSubscription(activeSubscription);
        }
      } catch {
        if (active) {
          setAccountSubscription(null);
        }
      }
    };

    loadSubscription();

    return () => {
      active = false;
    };
  }, [isPrivilegedAdmin, user]);

  useEffect(() => {
    setShowFullContact(false);
  }, [id, role, accountSubscription?.plan_code]);

  // Load reviews + summary for this doctor
  useEffect(() => {
    if (!id) return;
    getDoctorRatingSummaryApi(id).then((r) => setRatingSummary(r.data)).catch(() => setRatingSummary(null));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getDoctorReviewsApi(id, { page: reviewsPage, limit: 5 })
      .then((r) => { setReviews(r.data || []); setReviewsPagination(r.pagination || null); })
      .catch(() => { setReviews([]); setReviewsPagination(null); });
  }, [id, reviewsPage]);

  const normalizedPlanCode = String(accountSubscription?.plan_code || "HOLORA_FREE").toUpperCase();
  const isHoloraPlus = normalizedPlanCode === "HOLORA_PLUS";
  const isPatientWithoutPlus = role === "patient" && !isHoloraPlus && !isPrivilegedAdmin;
  const canRevealFullContact = isPrivilegedAdmin || (role === "patient" && isHoloraPlus);
  const visiblePhone = canRevealFullContact && showFullContact ? doctor?.phone || t("publicDoctors.shared.updating") : maskPhone(doctor?.phone, t("publicDoctors.shared.updating"));
  const visibleEmail = canRevealFullContact && showFullContact ? doctor?.email || t("publicDoctors.shared.updating") : maskEmail(doctor?.email, t("publicDoctors.shared.updating"));

  const contactAccessLabel = isPrivilegedAdmin
    ? t("publicDoctors.detail.contact.adminAccess")
    : role === "patient" && isHoloraPlus
      ? t("publicDoctors.detail.contact.plusAccess")
      : t("publicDoctors.detail.contact.lockedAccess", {
          plan: isHoloraPlus ? "MeDecode Plus" : "MeDecode Free",
        });

  const contactAccessBadge = isPrivilegedAdmin
    ? t("publicDoctors.detail.contact.adminBadge")
    : isHoloraPlus
      ? "MeDecode Plus"
      : t("publicDoctors.detail.contact.requiredBadge");

  const primaryCta = useMemo(() => {
    if (!user) {
      return {
        to: "/register",
        label: t("publicDoctors.detail.cta.register"),
      };
    }

    if (role === "patient") {
      const params = new URLSearchParams({ doctorId: id });

      if (Array.isArray(doctor?.branches) && doctor.branches.length === 1) {
        params.set("branchId", doctor.branches[0].id);
      }

      return {
        to: `/patient/appointments?${params.toString()}`,
        label: t("publicDoctors.detail.cta.bookAppointment", { defaultValue: "Đặt lịch hẹn" }),
      };
    }

    if (role === "doctor") {
      return {
        to: "/doctor",
        label: t("publicDoctors.detail.cta.doctorZone"),
      };
    }

    if (role === "clinic_owner") {
      return {
        to: "/clinic-owner",
        label: t("publicDoctors.detail.cta.providerZone"),
      };
    }

    return {
      to: "/home-redirect",
      label: t("publicDoctors.detail.cta.defaultZone"),
    };
  }, [doctor, id, role, t, user]);

  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-[#F7F9FC] text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-160px] h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-[#E06666]/10 blur-3xl dark:bg-[#E06666]/12" />
        <div className="absolute bottom-[-120px] right-[-80px] h-[220px] w-[220px] rounded-full bg-[#C7DFFE]/30 blur-3xl dark:bg-[#24324A]/35" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-200"
        >
          <ArrowLeft size={16} />
          {t("publicDoctors.detail.backToList")}
        </Link>

        {isLoading ? (
          <div className="mt-6 animate-pulse rounded-[32px] border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-[#141B29]">
            <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
            <div className="mt-5 h-4 w-1/2 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="mt-3 h-4 w-3/4 rounded bg-gray-100 dark:bg-slate-800" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-[32px] border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
            {t(error)}
          </div>
        ) : !doctor ? (
          <div className="mt-6 rounded-[32px] border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-300">
            {t("publicDoctors.detail.notFound")}
          </div>
        ) : (
          <article className="mt-6 overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-[#141B29]">
            <div className="bg-gradient-to-br from-[#10325A] via-[#14497F] to-[#0D5D8A] px-6 py-8 text-white sm:px-8 sm:py-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  {doctor.avatar_url ? (
                    <img
                      src={doctor.avatar_url}
                      alt={doctor.full_name || t("publicDoctors.shared.doctorFallbackName")}
                      className="h-16 w-16 rounded-2xl border border-white/20 object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white">
                      <UserRound size={28} />
                    </div>
                  )}
                  <div>
                    <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                      {t("publicDoctors.detail.publicProfile")}
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                      {doctor.full_name || t("publicDoctors.shared.doctorFallbackName")}
                    </h1>
                    <p className="mt-2 text-sm text-blue-100">
                      {t("publicDoctors.detail.doctorCode")}: {doctor.doctor_code || "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-blue-100">
                      {doctor.specialty_name || t("publicDoctors.detail.specialtyFallback")}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur sm:min-w-[220px]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                    {t("publicDoctors.detail.consultationFee")}
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatCurrency(doctor.consultation_fee, locale, t("publicDoctors.shared.feeFallback"))}
                  </p>
                  <p className="mt-1 text-sm text-blue-100">{t("publicDoctors.detail.currentFeeNote")}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-6">
                <section className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#FFF3F2] p-4 text-sm text-gray-700 dark:bg-[#2B1F28] dark:text-slate-200">
                    <div className="flex items-center gap-2 text-[#B64949] dark:text-[#F3A3A3]">
                      <BriefcaseMedical size={16} />
                      <span className="font-semibold">{t("publicDoctors.detail.specialty")}</span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-gray-900 dark:text-slate-100">
                      {doctor.specialty_name || t("publicDoctors.shared.updating")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#EEF5FF] p-4 text-sm text-gray-700 dark:bg-[#1D2C43] dark:text-slate-200">
                    <div className="flex items-center gap-2 text-[#2B6298] dark:text-[#9BC0EB]">
                      <Building2 size={16} />
                      <span className="font-semibold">{t("publicDoctors.detail.branch")}</span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-gray-900 dark:text-slate-100">
                      {doctor.branch_names || t("publicDoctors.shared.updating")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-[#111827] dark:text-slate-200">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                      <Clock3 size={16} />
                      <span className="font-semibold">{t("publicDoctors.detail.experience")}</span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-gray-900 dark:text-slate-100">
                      {doctor.experience_years
                        ? t("publicDoctors.directory.card.years", { count: doctor.experience_years })
                        : t("publicDoctors.shared.updating")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 dark:bg-[#111827] dark:text-slate-200">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                      <BadgeDollarSign size={16} />
                      <span className="font-semibold">{t("publicDoctors.detail.consultationFee")}</span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-gray-900 dark:text-slate-100">
                      {formatCurrency(doctor.consultation_fee, locale, t("publicDoctors.shared.feeFallback"))}
                    </p>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                    <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                    {t("publicDoctors.detail.professionalProfile")}
                  </div>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-gray-600 dark:text-slate-300">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">{t("publicDoctors.detail.qualification")}</p>
                      <p className="mt-1">{doctor.qualification || t("publicDoctors.shared.updating")}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">{t("publicDoctors.detail.bio")}</p>
                      <p className="mt-1">{doctor.bio || t("publicDoctors.detail.bioFallback")}</p>
                    </div>
                  </div>
                </section>

                {/* Patient Reviews Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                    <Star size={18} className="text-amber-500" />
                    {t("publicDoctors.detail.reviews", { defaultValue: "Patient Reviews" })}
                    {ratingSummary?.total_reviews > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {ratingSummary.average_rating} ★ ({ratingSummary.total_reviews})
                      </span>
                    )}
                  </div>

                  <RatingSummary summary={ratingSummary} />

                  {reviews.length > 0 && (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} locale={i18n.language} />
                      ))}

                      {reviewsPagination && reviewsPagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                            disabled={reviewsPage <= 1}
                            className="rounded-xl border border-border-main p-2 text-text-dim transition hover:bg-bg-app disabled:opacity-30 dark:hover:bg-slate-700"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="text-xs text-text-dim">
                            {reviewsPage} / {reviewsPagination.totalPages}
                          </span>
                          <button
                            onClick={() => setReviewsPage((p) => Math.min(reviewsPagination.totalPages, p + 1))}
                            disabled={reviewsPage >= reviewsPagination.totalPages}
                            className="rounded-xl border border-border-main p-2 text-text-dim transition hover:bg-bg-app disabled:opacity-30 dark:hover:bg-slate-700"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              <aside className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">{t("publicDoctors.detail.contactInfo")}</h2>
                    <span
                      title={!canRevealFullContact ? t("publicDoctors.detail.contact.requiredTooltip") : undefined}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isPrivilegedAdmin || isHoloraPlus ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}
                    >
                      {contactAccessBadge}
                    </span>
                  </div>

                  {!canRevealFullContact ? (
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                      {t("publicDoctors.detail.contact.requiredInline")}
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-slate-300">
                    {canRevealFullContact ? (
                      <button
                        type="button"
                        onClick={() => setShowFullContact((prev) => !prev)}
                        className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-left transition hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-700"
                      >
                        <Phone size={16} className="text-gray-400" />
                        <span className="flex-1">{visiblePhone}</span>
                      </button>
                    ) : (
                      <p
                        title={t("publicDoctors.detail.contact.requiredTooltip")}
                        className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 dark:border-slate-700"
                      >
                        <Phone size={16} className="text-gray-400" />
                        <span>{visiblePhone}</span>
                      </p>
                    )}

                    {canRevealFullContact ? (
                      <button
                        type="button"
                        onClick={() => setShowFullContact((prev) => !prev)}
                        className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-left transition hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-700"
                      >
                        <Mail size={16} className="text-gray-400" />
                        <span className="flex-1 break-all">{visibleEmail}</span>
                      </button>
                    ) : (
                      <p
                        title={t("publicDoctors.detail.contact.requiredTooltip")}
                        className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 dark:border-slate-700"
                      >
                        <Mail size={16} className="text-gray-400" />
                        <span className="break-all">{visibleEmail}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <p className="flex items-start gap-2">
                      <Lock size={14} className="mt-0.5 shrink-0 text-slate-400" />
                      <span>{contactAccessLabel}</span>
                    </p>
                    {canRevealFullContact ? (
                      <p className="mt-2 text-[#B64949] dark:text-[#F3A3A3]">
                        {showFullContact
                          ? t("publicDoctors.detail.contact.hideHint")
                          : t("publicDoctors.detail.contact.clickHint")}
                      </p>
                    ) : null}
                  </div>

                  {isPatientWithoutPlus ? (
                    <div className="mt-4 rounded-2xl border border-[#E06666]/20 bg-[#FFF5F5] p-4 dark:border-[#E06666]/25 dark:bg-[#2B1F28]">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {t("publicDoctors.detail.contact.upgradeTitle")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-slate-300">
                        {t("publicDoctors.detail.contact.upgradeDescription")}
                      </p>
                      <Link
                        to="/pricing"
                        className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-[#E06666] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D55555]"
                      >
                        {t("publicDoctors.detail.contact.upgradeCta")}
                      </Link>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">{t("publicDoctors.detail.nextActions")}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-slate-400">
                    {t("publicDoctors.detail.nextActionsDescription")}
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    <Link
                      to={primaryCta.to}
                      className="inline-flex items-center justify-center rounded-2xl bg-[#E06666] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#D55555]"
                    >
                      {primaryCta.label}
                    </Link>
                    <Link
                      to="/doctors"
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-200"
                    >
                      {t("publicDoctors.detail.viewOtherDoctors")}
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

export default DoctorPublicDetailPage;
