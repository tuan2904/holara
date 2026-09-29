import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Contact,
  Droplets,
  Edit3,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
  X,
  Lock,
} from "lucide-react";
import { getMyProfileApi, updateMyProfileApi } from "../services/patientService";
import ChangePasswordModal from "../components/profile/ChangePasswordModal";

const EMPTY_VALUE = "-";

const normalizeDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return value.includes("T") ? value.slice(0, 10) : value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDateDisplay = (value, locale) => {
  if (!value) return EMPTY_VALUE;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getGenderLabel = (gender, t) => {
  if (gender === "male") return t("admin.genderMale");
  if (gender === "female") return t("admin.genderFemale");
  if (gender === "other") return t("admin.genderOther");
  return EMPTY_VALUE;
};

const getProfileCompletion = (profileData) => {
  const fields = [
    "full_name",
    "phone",
    "email",
    "gender",
    "date_of_birth",
    "address",
    "blood_group",
    "allergies",
    "medical_history",
    "emergency_contact_name",
    "emergency_contact_phone",
  ];
  const filled = fields.filter((field) => `${profileData[field] || ""}`.trim()).length;
  return Math.round((filled / fields.length) * 100);
};

const PatientProfilePage = () => {
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
    full_name: "",
    phone: "",
    email: "",
    gender: "",
    date_of_birth: "",
    address: "",
    blood_group: "",
    allergies: "",
    medical_history: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyProfileApi();

      if (res.data) {
        setProfileData({
          full_name: res.data.full_name || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          gender: res.data.gender || "",
          date_of_birth: normalizeDateInput(res.data.date_of_birth),
          address: res.data.address || "",
          blood_group: res.data.blood_group || "",
          allergies: res.data.allergies || "",
          medical_history: res.data.medical_history || "",
          emergency_contact_name: res.data.emergency_contact_name || "",
          emergency_contact_phone: res.data.emergency_contact_phone || "",
        });
      }

      setError("");
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err?.response?.data?.message || t("patient.errorLoadingProfile"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (role !== "patient") {
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
      await updateMyProfileApi(profileData);
      setSuccessMessage(t("patient.profileUpdatedSuccess"));
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      setError(err?.response?.data?.message || t("patient.errorUpdatingProfile"));
    } finally {
      setSubmitting(false);
    }
  };

  const completion = useMemo(() => getProfileCompletion(profileData), [profileData]);
  const profileName = profileData.full_name || t("common.user");
  const badgeItems = [
    t("common.patient"),
    profileData.blood_group || null,
    getGenderLabel(profileData.gender, t) !== EMPTY_VALUE ? getGenderLabel(profileData.gender, t) : null,
  ].filter(Boolean);

  const personalItems = [
    {
      label: t("admin.fullName"),
      icon: User,
      name: "full_name",
      value: profileData.full_name,
      placeholder: "Nguyen Van A",
    },
    {
      label: t("admin.phone"),
      icon: Phone,
      name: "phone",
      value: profileData.phone,
      placeholder: "+84 ...",
    },
    {
      label: t("admin.email"),
      icon: Mail,
      name: "email",
      value: profileData.email,
      placeholder: "patient@example.com",
      type: "email",
    },
    {
      label: t("patient.dateOfBirth"),
      icon: Calendar,
      name: "date_of_birth",
      value: profileData.date_of_birth,
      type: "date",
      formatter: (value) => formatDateDisplay(value, i18n.language),
    },
    {
      label: t("patient.gender"),
      icon: User,
      name: "gender",
      value: profileData.gender,
      formatter: (value) => getGenderLabel(value, t),
      options: [
        { val: "male", label: t("admin.genderMale") },
        { val: "female", label: t("admin.genderFemale") },
        { val: "other", label: t("admin.genderOther") },
      ],
    },
    {
      label: t("patient.address"),
      icon: MapPin,
      name: "address",
      value: profileData.address,
      placeholder: "123 Main Street",
    },
  ];

  const medicalFields = [
    {
      label: t("admin.bloodGroup"),
      icon: Droplets,
      name: "blood_group",
      value: profileData.blood_group,
      options: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((value) => ({
        val: value,
        label: value,
      })),
    },
    {
      label: t("admin.allergies"),
      icon: AlertTriangle,
      name: "allergies",
      value: profileData.allergies,
      placeholder: t("admin.allergiesPlaceholder"),
      multiline: true,
    },
    {
      label: t("admin.medicalHistory"),
      icon: ClipboardList,
      name: "medical_history",
      value: profileData.medical_history,
      placeholder: t("admin.medicalHistoryPlaceholder"),
      multiline: true,
    },
  ];

  const emergencyFields = [
    {
      label: t("patient.emergencyContactName"),
      icon: User,
      name: "emergency_contact_name",
      value: profileData.emergency_contact_name,
      placeholder: "Emergency contact name",
    },
    {
      label: t("patient.emergencyContactPhone"),
      icon: Phone,
      name: "emergency_contact_phone",
      value: profileData.emergency_contact_phone,
      placeholder: "+84 ...",
    },
  ];

  const inputClassName =
    "w-full rounded-2xl border border-border-main bg-bg-app dark:bg-slate-900 px-4 py-3 text-sm text-text-main placeholder-text-dim outline-none transition focus:ring-2 focus:ring-[#E06666]";

  const renderField = ({
    label,
    icon,
    name,
    value,
    placeholder,
    type = "text",
    options,
    formatter,
    multiline,
  }) => {
    const FieldIcon = icon;
    const displayValue = formatter ? formatter(value) : value || EMPTY_VALUE;

    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-text-main">
          <FieldIcon className="h-4 w-4 text-[#E06666]" />
          {label}
        </label>

        {isEditing ? (
          options ? (
            <select name={name} value={value} onChange={handleInputChange} className={inputClassName}>
              <option value="">{t("common.selectOne") || "Select one"}</option>
              {options.map((option) => (
                <option key={option.val} value={option.val}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : multiline ? (
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
              className={inputClassName}
            />
          )
        ) : multiline ? (
          <div className="min-h-[104px] rounded-2xl border border-border-main bg-bg-app dark:bg-slate-900 px-4 py-3 text-sm leading-6 text-text-main whitespace-pre-wrap">
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
          <p className="mt-4 text-sm text-text-dim">
            {t("patient.profilePage.loadingProfile")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 animate-in fade-in duration-500">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E06666] to-[#C04444] p-4 text-white shadow-lg sm:p-8 md:p-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div className="space-y-6">
              <div className="flex flex-wrap items-start gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 backdrop-blur text-white shadow-lg shadow-black/10 sm:h-20 sm:w-20">
                  <User className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                      {t("patient.myProfile")}
                    </p>
                    <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:mt-2 sm:text-3xl md:text-4xl">{profileName}</h1>
                    <p className="mt-1.5 max-w-2xl text-xs leading-5 text-white/80 sm:mt-2 sm:text-sm sm:leading-6 md:text-base">
                      {t("patient.profilePage.heroDescription")}
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

              <div className="grid gap-2 grid-cols-3 sm:gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur sm:px-4 sm:py-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/65 sm:text-xs sm:tracking-[0.2em]">{t("admin.phone")}</p>
                  <p className="mt-1 text-xs font-semibold sm:mt-2 sm:text-sm">{profileData.phone || EMPTY_VALUE}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur sm:px-4 sm:py-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/65 sm:text-xs sm:tracking-[0.2em]">{t("admin.email")}</p>
                  <p className="mt-1 text-xs font-semibold break-all sm:mt-2 sm:text-sm">{profileData.email || EMPTY_VALUE}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 backdrop-blur sm:px-4 sm:py-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/65 sm:text-xs sm:tracking-[0.2em]">{t("patient.dateOfBirth")}</p>
                  <p className="mt-1 text-xs font-semibold sm:mt-2 sm:text-sm">{formatDateDisplay(profileData.date_of_birth, i18n.language, i18n.language)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-black/10 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
                <Shield className="h-4 w-4" />
                {t("patient.profilePage.statusCardTitle")}
              </div>

              <div className="mt-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">{t("patient.profilePage.completionTitle")}</p>
                    <p className="mt-2 text-3xl font-bold">{completion}%</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    {completion >= 80 ? t("patient.profilePage.statusReady") : t("patient.profilePage.statusNeedsUpdate")}
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
              <h2 className="text-base font-semibold text-text-main">{t("patient.profilePage.snapshotTitle")}</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("patient.address")}</p>
                  <p className="mt-2 text-sm font-medium text-text-main">{profileData.address || EMPTY_VALUE}</p>
                </div>
                <div className="rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("admin.bloodGroup")}</p>
                  <p className="mt-2 text-sm font-medium text-text-main">{profileData.blood_group || EMPTY_VALUE}</p>
                </div>
                <div className="rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{t("patient.emergencyContact")}</p>
                  <p className="mt-2 text-sm font-medium text-text-main">{profileData.emergency_contact_name || EMPTY_VALUE}</p>
                  <p className="mt-1 text-sm text-text-dim">{profileData.emergency_contact_phone || EMPTY_VALUE}</p>
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
                <HeartPulse className="h-5 w-5 text-[#E06666]" />
                {t("patient.profilePage.healthReadinessTitle")}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {t("patient.profilePage.healthReadinessDescription")}
              </p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90">
                {profileData.allergies || profileData.medical_history
                  ? t("patient.profilePage.healthReadinessReady")
                  : t("patient.profilePage.healthReadinessEmpty")}
              </div>
            </section>
          </aside>

          <div className="space-y-6">
            <section className="rounded-3xl border border-border-main bg-bg-surface p-4 shadow-sm sm:p-6 dark:bg-slate-800 md:p-8">
              <div className="border-b border-border-main pb-4">
                <h2 className="flex items-center gap-3 text-lg font-bold text-text-main">
                  <User className="h-5 w-5 text-[#E06666]" />
                  {t("patient.personalInformation")}
                </h2>
                <p className="mt-2 text-sm text-text-dim">
                  {t("patient.profilePage.personalSectionDescription")}
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {personalItems.map((field) => (
                  <React.Fragment key={field.name}>{renderField(field)}</React.Fragment>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border-main bg-bg-surface p-4 shadow-sm sm:p-6 dark:bg-slate-800 md:p-8">
              <div className="border-b border-border-main pb-4">
                <h2 className="flex items-center gap-3 text-lg font-bold text-text-main">
                  <ClipboardList className="h-5 w-5 text-[#E06666]" />
                  {t("patient.medicalInformation")}
                </h2>
                <p className="mt-2 text-sm text-text-dim">
                  {t("patient.profilePage.medicalSectionDescription")}
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">{renderField(medicalFields[0])}</div>
                <div className="md:col-span-2">{renderField(medicalFields[1])}</div>
                <div className="md:col-span-2">{renderField(medicalFields[2])}</div>
              </div>
            </section>

            <section className="rounded-3xl border border-border-main bg-bg-surface p-4 shadow-sm sm:p-6 dark:bg-slate-800 md:p-8">
              <div className="border-b border-border-main pb-4">
                <h2 className="flex items-center gap-3 text-lg font-bold text-text-main">
                  <Contact className="h-5 w-5 text-[#E06666]" />
                  {t("patient.emergencyContact")}
                </h2>
                <p className="mt-2 text-sm text-text-dim">
                  {t("patient.profilePage.emergencySectionDescription")}
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {emergencyFields.map((field) => (
                  <React.Fragment key={field.name}>{renderField(field)}</React.Fragment>
                ))}
              </div>
            </section>

            {isEditing && (
              <section className="rounded-3xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-main">{t("patient.profilePage.editingTitle")}</p>
                    <p className="mt-1 text-sm text-text-dim">
                      {t("patient.profilePage.editingDescription")}
                    </p>
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

export default PatientProfilePage;
