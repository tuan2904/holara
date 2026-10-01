import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  BriefcaseMedical,
  CheckCircle2,
  ClipboardList,
  Edit3,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Stethoscope,
  User,
  Wallet,
  X,
  Lock,
} from "lucide-react";
import { getMyDoctorProfileApi, updateMyDoctorProfileApi } from "../services/doctorService";
import ChangePasswordModal from "../components/profile/ChangePasswordModal";

const EMPTY_VALUE = "-";

const formatCurrency = (value, locale) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return EMPTY_VALUE;
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numeric);
};

const getProfileCompletion = (profileData) => {
  const fields = [
    "full_name",
    "phone",
    "email",
    "license_number",
    "qualification",
    "experience_years",
    "consultation_fee",
    "bio",
  ];
  const filled = fields.filter((field) => `${profileData[field] ?? ""}`.trim()).length;
  return Math.round((filled / fields.length) * 100);
};

const DoctorProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, role, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    doctor_code: "",
    full_name: "",
    phone: "",
    email: "",
    license_number: "",
    qualification: "",
    experience_years: "",
    consultation_fee: "",
    bio: "",
    avatar_url: "",
    specialty_name: "",
    branch_names: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyDoctorProfileApi();
      const data = res?.data || {};

      setProfileData({
        doctor_code: data.doctor_code || "",
        full_name: data.full_name || "",
        phone: data.phone || "",
        email: data.email || "",
        license_number: data.license_number || "",
        qualification: data.qualification || "",
        experience_years: `${data.experience_years ?? ""}`,
        consultation_fee: `${data.consultation_fee ?? ""}`,
        bio: data.bio || "",
        avatar_url: data.avatar_url || "",
        specialty_name: data.specialty_name || "",
        branch_names: data.branch_names || "",
      });

      setError("");
    } catch (err) {
      console.error("Error fetching doctor profile:", err);
      setError(err?.response?.data?.message || t("doctor.profilePage.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (role !== "doctor") {
      navigate("/");
      return;
    }

    fetchProfile();
  }, [fetchProfile, isAuthenticated, navigate, role]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!profileData.full_name.trim()) {
      setError(t("auth.fullNameRequired"));
      return false;
    }

    if (!profileData.phone.trim()) {
      setError(t("admin.phoneRequired"));
      return false;
    }

    return true;
  };

  const handleCancelEdit = async () => {
    setIsEditing(false);
    setError("");
    setSuccessMessage("");
    await fetchProfile();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await updateMyDoctorProfileApi({
        full_name: profileData.full_name,
        phone: profileData.phone,
        email: profileData.email,
        license_number: profileData.license_number,
        qualification: profileData.qualification,
        experience_years: Number(profileData.experience_years || 0),
        consultation_fee: Number(profileData.consultation_fee || 0),
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
      });
      setSuccessMessage(t("doctor.profilePage.updateSuccess"));
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      setError(err?.response?.data?.message || t("doctor.profilePage.updateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const completion = useMemo(() => getProfileCompletion(profileData), [profileData]);
  const profileName = profileData.full_name || t("common.user");

  const badgeItems = [
    t("common.doctor"),
    profileData.specialty_name || null,
  ].filter(Boolean);

  const inputClassName =
    "w-full rounded-2xl border border-border-main bg-bg-app dark:bg-slate-900 px-4 py-3 text-sm text-text-main placeholder-text-dim outline-none transition focus:ring-2 focus:ring-[#E06666]";

  const renderField = ({ label, icon, name, value, placeholder, type = "text", multiline, formatter }) => {
    const FieldIcon = icon;
    const displayValue = formatter ? formatter(value) : value || EMPTY_VALUE;

    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-text-main">
          <FieldIcon className="h-4 w-4 text-[#E06666]" />
          {label}
        </label>

        {isEditing ? (
          multiline ? (
            <textarea
              name={name}
              value={value}
              onChange={handleInputChange}
              placeholder={placeholder}
              rows="4"
              className={`${inputClassName} resize-none`}
            />
          ) : (
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleInputChange}
              placeholder={placeholder}
              min={type === "number" ? 0 : undefined}
              className={inputClassName}
            />
          )
        ) : multiline ? (
          <div className="min-h-[104px] whitespace-pre-wrap rounded-2xl border border-border-main bg-bg-app dark:bg-slate-900 px-4 py-3 text-sm leading-6 text-text-main">
            {displayValue}
          </div>
        ) : (
          <div className="rounded-2xl border border-border-main bg-bg-app dark:bg-slate-900 px-4 py-3 text-sm font-medium text-text-main">
            {displayValue}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-[#f0c9c2] bg-[linear-gradient(135deg,#fff7f2_0%,#ffe6dc_52%,#fff0ea_100%)] p-8 shadow-sm dark:border-[#7a3d3b] dark:bg-[linear-gradient(135deg,rgba(127,29,29,0.30)_0%,rgba(51,65,85,0.92)_56%,rgba(15,23,42,1)_100%)]">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#E06666] border-r-transparent"></div>
          <p className="mt-4 text-sm text-text-dim">{t("doctor.profilePage.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 animate-in fade-in duration-500">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E06666] to-[#C04444] p-8 text-white shadow-lg md:p-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div className="space-y-6">
              <div className="flex flex-wrap items-start gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-white shadow-lg shadow-black/10 backdrop-blur">
                  <Stethoscope className="h-10 w-10" />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">{t("doctor.updateProfile")}</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{profileName}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80 md:text-base">
                      {t("doctor.profilePage.heroDescription")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {badgeItems.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/65">{t("admin.phone")}</p>
                  <p className="mt-2 text-sm font-semibold">{profileData.phone || EMPTY_VALUE}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/65">{t("admin.email")}</p>
                  <p className="mt-2 break-all text-sm font-semibold">{profileData.email || EMPTY_VALUE}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/65">{t("doctor.profilePage.specialty")}</p>
                  <p className="mt-2 text-sm font-semibold">{profileData.specialty_name || EMPTY_VALUE}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-black/10 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
                <Shield className="h-4 w-4" />
                {t("doctor.profilePage.statusCardTitle")}
              </div>

              <div className="mt-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">{t("doctor.profilePage.completionTitle")}</p>
                    <p className="mt-2 text-3xl font-bold">{completion}%</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    {completion >= 80 ? t("doctor.profilePage.statusReady") : t("doctor.profilePage.statusNeedsUpdate")}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-white" style={{ width: `${completion}%` }} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setIsEditing(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#E06666] transition hover:bg-white/90"
                    >
                      <Edit3 className="h-4 w-4" />
                      {t("common.edit")}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                      >
                        <X className="h-4 w-4" />
                        {t("common.cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#E06666] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#E06666] border-r-transparent" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {t("common.save")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {successMessage && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-3xl border border-border-main bg-bg-surface p-6 shadow-sm dark:bg-slate-800">
              <h2 className="text-base font-semibold text-text-main">{t("doctor.profilePage.snapshotTitle")}</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("doctor.profilePage.doctorCode")}</p>
                  <p className="mt-2 text-sm font-medium text-text-main">{profileData.doctor_code || EMPTY_VALUE}</p>
                </div>
                <div className="rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("doctor.profilePage.specialty")}</p>
                  <p className="mt-2 text-sm font-medium text-text-main">{profileData.specialty_name || EMPTY_VALUE}</p>
                </div>
                <div className="rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("doctor.profilePage.branches")}</p>
                  <p className="mt-2 text-sm font-medium text-text-main">{profileData.branch_names || EMPTY_VALUE}</p>
                </div>

                {(!user || user.auth_provider === "local") && (
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border-main bg-bg-surface py-3 text-sm font-semibold text-text-main transition hover:bg-bg-app dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <Lock className="h-4 w-4 text-[#E06666]" />
                    {t("auth.change_password")}
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-border-main bg-slate-900 p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <BriefcaseMedical className="h-5 w-5 text-[#E06666]" />
                {t("doctor.profilePage.professionalReadinessTitle")}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {t("doctor.profilePage.professionalReadinessDescription")}
              </p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90">
                {profileData.license_number && profileData.qualification
                  ? t("doctor.profilePage.professionalReady")
                  : t("doctor.profilePage.professionalMissing")}
              </div>
            </section>
          </aside>

          <div className="space-y-6">
            <section className="rounded-3xl border border-border-main bg-bg-surface p-6 shadow-sm dark:bg-slate-800 md:p-8">
              <div className="border-b border-border-main pb-4">
                <h2 className="flex items-center gap-3 text-lg font-bold text-text-main">
                  <User className="h-5 w-5 text-[#E06666]" />
                  {t("doctor.profilePage.personalSectionTitle")}
                </h2>
                <p className="mt-2 text-sm text-text-dim">{t("doctor.profilePage.personalSectionDescription")}</p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {renderField({ label: t("admin.fullName"), icon: User, name: "full_name", value: profileData.full_name, placeholder: "Nguyen Van A" })}
                {renderField({ label: t("admin.phone"), icon: Phone, name: "phone", value: profileData.phone, placeholder: "+84 ..." })}
                {renderField({ label: t("admin.email"), icon: Mail, name: "email", value: profileData.email, type: "email", placeholder: "doctor@example.com" })}
                {renderField({ label: t("doctor.profilePage.avatarUrl"), icon: MapPin, name: "avatar_url", value: profileData.avatar_url, placeholder: "https://..." })}
              </div>
            </section>

            <section className="rounded-3xl border border-border-main bg-bg-surface p-6 shadow-sm dark:bg-slate-800 md:p-8">
              <div className="border-b border-border-main pb-4">
                <h2 className="flex items-center gap-3 text-lg font-bold text-text-main">
                  <GraduationCap className="h-5 w-5 text-[#E06666]" />
                  {t("doctor.profilePage.professionalSectionTitle")}
                </h2>
                <p className="mt-2 text-sm text-text-dim">{t("doctor.profilePage.professionalSectionDescription")}</p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {renderField({ label: t("doctor.profilePage.licenseNumber"), icon: ClipboardList, name: "license_number", value: profileData.license_number, placeholder: "LIC-..." })}
                {renderField({ label: t("doctor.profilePage.qualification"), icon: GraduationCap, name: "qualification", value: profileData.qualification, placeholder: "MBBS, DDS..." })}
                {renderField({ label: t("doctor.profilePage.experienceYears"), icon: Stethoscope, name: "experience_years", value: profileData.experience_years, type: "number", placeholder: "0" })}
                {renderField({ label: t("doctor.profilePage.consultationFee"), icon: Wallet, name: "consultation_fee", value: profileData.consultation_fee, type: "number", placeholder: "0", formatter: (value) => formatCurrency(value, i18n.language) })}
                <div className="md:col-span-2">
                  {renderField({ label: t("doctor.profilePage.bio"), icon: BriefcaseMedical, name: "bio", value: profileData.bio, multiline: true, placeholder: t("doctor.profilePage.bioPlaceholder") })}
                </div>
              </div>
            </section>

            {isEditing && (
              <section className="rounded-3xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-main">{t("doctor.profilePage.editingTitle")}</p>
                    <p className="mt-1 text-sm text-text-dim">{t("doctor.profilePage.editingDescription")}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="inline-flex items-center gap-2 rounded-2xl border border-border-main px-4 py-3 text-sm font-semibold text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700"
                    >
                      <X className="h-4 w-4" />
                      {t("common.cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#E06666] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#D55555] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {t("common.save")}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </form>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default DoctorProfilePage;
