import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, ArrowLeft, CheckCircle2, Loader2, Save, Stethoscope, UserRound,
} from "lucide-react";
import {
  getDoctorByIdApi,
  getNextDoctorCodeApi,
  createDoctorApi,
  updateDoctorApi,
} from "../../services/doctorService";
import specialtyService from "../../services/specialtyService";
import branchService from "../../services/branchService";
import subscriptionService from "../../services/subscriptionService";

const DoctorFormPage = ({ returnPath = "/admin/doctors", fetchBranchesUrl = null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const isEdit = !!doctorId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [inviteSetupUrl, setInviteSetupUrl] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [doctorCode, setDoctorCode] = useState("");

  const [formData, setFormData] = useState({
    user_id: "",
    specialty_id: "",
    branch_ids: [],
    full_name: "",
    phone: "",
    email: "",
    license_number: "",
    qualification: "",
    experience_years: "",
    consultation_fee: "",
    bio: "",
    avatar_url: "",
    status: "active",
    account_mode: "manual",
    // New fields for user creation (create mode only)
    username: "",
    password: "",
  });

  // Fetch doctor data if editing
  const fetchSpecialties = useCallback(async () => {
    try {
      const res = await specialtyService.getAllSpecialties();
      const allSpecialties = res.data || [];
      const leafSpecialties = allSpecialties.filter(
        (item) => Number(item.child_count || 0) === 0
      );
      setSpecialties(leafSpecialties);
    } catch (err) {
      console.error("Error fetching specialties:", err);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res = fetchBranchesUrl
        ? await branchService.getMyBranches()
        : await branchService.getAllBranches();
      setBranches(res.data || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  }, [fetchBranchesUrl]);

  const fetchSubscriptionContext = useCallback(async () => {
    if (!fetchBranchesUrl) {
      setSubscriptions([]);
      setPlans([]);
      return;
    }

    try {
      const [subscriptionRes, planRes] = await Promise.all([
        subscriptionService.getMySubscriptions(),
        subscriptionService.getPlans(),
      ]);

      setSubscriptions(subscriptionRes.data || []);
      setPlans(planRes.data || []);
    } catch (err) {
      console.error("Error fetching subscription context:", err);
    }
  }, [fetchBranchesUrl]);

  const fetchDoctor = useCallback(async () => {
    try {
      const res = await getDoctorByIdApi(doctorId);
      const doctor = res.data;
      setFormData({
        user_id: doctor.user_id || "",
        specialty_id: doctor.specialty_id || "",
        branch_ids: doctor.branch_ids || [],
        full_name: doctor.full_name || "",
        phone: doctor.phone || "",
        email: doctor.email || "",
        license_number: doctor.license_number || "",
        qualification: doctor.qualification || "",
        experience_years: doctor.experience_years || "",
        consultation_fee: doctor.consultation_fee || "",
        bio: doctor.bio || "",
        avatar_url: doctor.avatar_url || "",
        status: doctor.status || "active",
        account_mode: "manual",
        username: "",
        password: "",
      });
      setDoctorCode(doctor.doctor_code || "");
    } catch (err) {
      console.error("Error fetching doctor:", err);
      setError(t("admin.errorLoadingDoctor"));
    } finally {
      setLoading(false);
    }
  }, [doctorId, t]);

  const fetchNextDoctorCode = useCallback(async () => {
    try {
      const res = await getNextDoctorCodeApi();
      setDoctorCode(res?.data?.code || "");
    } catch (err) {
      console.error("Error fetching next doctor code:", err);
    }
  }, []);

  useEffect(() => {
    fetchSpecialties();
    fetchBranches();
    fetchSubscriptionContext();
    if (isEdit) {
      fetchDoctor();
    } else {
      fetchNextDoctorCode();
    }
  }, [fetchSpecialties, fetchBranches, fetchSubscriptionContext, fetchDoctor, fetchNextDoctorCode, isEdit]);

  useEffect(() => {
    if (!successMessage) return;
    if (inviteSetupUrl) return; // Don't auto-clear if invite URL is shown
    const id = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(id);
  }, [successMessage, inviteSetupUrl]);

  const selectedBranches = branches.filter((branch) =>
    formData.branch_ids.includes(branch.id)
  );

  const primarySelectedBranch = selectedBranches[0] || null;

  const selectedBranchSubscription = primarySelectedBranch
    ? subscriptions.find(
        (subscription) =>
          subscription.scope_type === "branch" &&
          Number(subscription.scope_id) === Number(primarySelectedBranch.id)
      ) || null
    : null;

  const selectedBranchPlan = selectedBranchSubscription
    ? plans.find((plan) => plan.code === selectedBranchSubscription.plan_code) || null
    : null;

  const doctorManageEntitlement = selectedBranchPlan?.entitlements?.find(
    (entitlement) => entitlement.feature_code === "doctor.manage"
  ) || null;

  const selectedBranchDoctorCount = Number(primarySelectedBranch?.doctor_count || 0);
  const selectedBranchDoctorLimit = Number(doctorManageEntitlement?.limit_value || 0);
  const hasFiniteDoctorLimit = Number.isInteger(selectedBranchDoctorLimit) && selectedBranchDoctorLimit > 0;
  const selectedBranchHasSubscription = !fetchBranchesUrl || !!selectedBranchSubscription;
  const selectedBranchSubscriptionActive =
    !fetchBranchesUrl ||
    !selectedBranchSubscription ||
    ["trialing", "active"].includes(selectedBranchSubscription.status);
  const selectedBranchDoctorLimitReached =
    fetchBranchesUrl &&
    !isEdit &&
    hasFiniteDoctorLimit &&
    selectedBranchDoctorCount >= selectedBranchDoctorLimit;
  const isClinicOwnerMode = Boolean(fetchBranchesUrl);
  const selectedSpecialty = specialties.find(
    (specialty) => Number(specialty.id) === Number(formData.specialty_id)
  );
  const selectedBranchNames = selectedBranches.map((branch) => branch.name).join(", ");
  const inputClassName =
    "w-full rounded-xl border border-border-main bg-bg-app dark:bg-slate-900 px-4 py-3 text-sm text-text-main placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-cyan-500/40";
  const cardClassName =
    "rounded-2xl border border-border-main bg-bg-surface dark:bg-slate-800 shadow-sm";

  const validateForm = () => {
    if (!formData.full_name?.trim()) {
      setError(t("admin.fullNameRequired"));
      return false;
    }
    if (!formData.phone?.trim()) {
      setError(t("admin.phoneRequired"));
      return false;
    }
    if (!formData.license_number?.trim()) {
      setError(t("admin.licenseNumberRequired"));
      return false;
    }
    if (!formData.specialty_id) {
      setError(t("admin.specialtyRequired"));
      return false;
    }
    if (!formData.branch_ids.length) {
      setError(t("admin.branchRequired"));
      return false;
    }
    if (fetchBranchesUrl && !selectedBranchHasSubscription) {
      setError("Selected branch does not have an active subscription yet. Create the branch again or activate a plan first.");
      return false;
    }
    if (fetchBranchesUrl && !selectedBranchSubscriptionActive) {
      setError("Selected branch subscription is inactive. Please activate or renew the branch plan first.");
      return false;
    }
    if (selectedBranchDoctorLimitReached) {
      setError("Selected branch has reached its doctor limit for the current subscription.");
      return false;
    }
    if (!isEdit) {
      if (formData.account_mode === "invite") {
        if (!formData.email?.trim()) {
          setError("Doctor email is required for invite mode");
          return false;
        }
      } else {
        if (!formData.email?.trim()) {
          setError("Doctor email is required when creating a login account");
          return false;
        }
        if (!formData.username?.trim()) {
          setError(t("admin.usernameRequired"));
          return false;
        }
        if (!formData.password?.trim()) {
          setError(t("admin.passwordRequired"));
          return false;
        }
        if (formData.password.length < 6) {
          setError(t("admin.passwordMinLength"));
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setInviteSetupUrl("");

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        // Update existing doctor
        await updateDoctorApi(doctorId, formData);
        setSuccessMessage(t("admin.doctorUpdatedSuccess"));
        setTimeout(() => navigate(returnPath), 1500);
      } else {
        const doctorData = {
          ...formData,
          invite_redirect_base: `${window.location.origin}/doctor/invite-setup`,
        };

        if (doctorData.account_mode === "invite") {
          delete doctorData.username;
          delete doctorData.password;
        }

        const createRes = await createDoctorApi(doctorData);
        const setupUrl = createRes?.data?.invite_setup_url || "";

        if (setupUrl) {
          setInviteSetupUrl(setupUrl);
          setSuccessMessage("Doctor invited successfully. Share this setup link with the doctor.");
        } else {
          setSuccessMessage(t("admin.doctorCreatedSuccess"));
          setTimeout(() => navigate(returnPath), 1500);
        }
      }
    } catch (err) {
      let errorMsg = err?.response?.data?.message || t("admin.errorSubmittingForm");

      if (err?.response?.status === 402) {
        if (err?.response?.data?.message === "Active subscription required") {
          errorMsg = "Selected branch does not have an active doctor subscription. Open Subscription to activate a plan or create a new branch trial.";
        }

        if ((err?.response?.data?.message || "").includes("Doctor limit reached")) {
          errorMsg = "Selected branch has reached the doctor limit for its current plan. Upgrade the branch subscription or choose another branch.";
        }
      }

      setError(errorMsg);
      console.error("Error submitting form:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBranchToggle = (branchId) => {
    const numericBranchId = Number(branchId);
    setFormData((prev) => {
      const exists = prev.branch_ids.includes(numericBranchId);
      return {
        ...prev,
        branch_ids: exists
          ? prev.branch_ids.filter((id) => id !== numericBranchId)
          : [...prev.branch_ids, numericBranchId],
      };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-500 border-r-transparent" />
        <p className="mt-3 text-sm text-text-dim">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero Header ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="relative">
          <button onClick={() => navigate(returnPath)}
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />{t("admin.doctorsManagement")}
          </button>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-cyan-400" />
                <h1 className="text-xl sm:text-2xl font-bold">
                  {isEdit ? t("admin.editDoctor") : t("admin.addNewDoctor")}
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                {isClinicOwnerMode
                  ? "Create a doctor profile with branch-aware subscription checks."
                  : isEdit ? t("admin.updateDoctorInfo") : t("admin.fillFormToAddDoctor")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
                  {selectedBranches.length > 0
                    ? `${selectedBranches.length} branch${selectedBranches.length > 1 ? "es" : ""} selected`
                    : "No branch selected yet"}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
                  {formData.account_mode === "invite" ? "Invite-based access" : "Create login instantly"}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
                  Status: {formData.status}
                </span>
              </div>
            </div>

            <div className="min-w-[240px] rounded-xl bg-white/5 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{t("admin.doctorCode")}</p>
              <p className="mt-2 break-all font-mono text-lg font-semibold text-white">
                {doctorCode || "HLR_MED_ddmmyyyy_DT0001"}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {isEdit ? "Doctor code is fixed after creation." : "Reserved automatically when this form opens."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{successMessage}</p>
            {inviteSetupUrl && (
              <div className="mt-2 break-all rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-700 dark:border-emerald-700 dark:bg-slate-900 dark:text-slate-200">
                {inviteSetupUrl}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className={cardClassName}>
            <div className="border-b border-border-main px-6 py-5">
              <h2 className="text-lg font-semibold text-text-main">
                {t("admin.basicInformation")}
              </h2>
              <p className="mt-1 text-sm text-text-dim">
                Core identity, specialty, and access settings.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 px-6 py-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.fullName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Dr. John Doe"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.doctorCode")}
                </label>
                <input
                  type="text"
                  value={doctorCode}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-3 font-mono text-sm text-text-dim cursor-not-allowed dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.email")}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="doctor@hospital.com"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.phone")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+84 812 345 6789"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.license_number")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  placeholder="LIC-2024-001234"
                  className={inputClassName}
                />
                <p className="mt-2 text-xs text-text-dim">{t("admin.licenseNumberHelp")}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.specialty")} <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialty_id"
                  value={formData.specialty_id}
                  onChange={handleInputChange}
                  className={inputClassName}
                >
                  <option value="">{t("admin.selectSpecialty")}</option>
                  {specialties.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.parent_name ? `${spec.parent_name} > ${spec.name}` : spec.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className={cardClassName}>
            <div className="border-b border-border-main px-6 py-5">
              <h2 className="text-lg font-semibold text-text-main">
                Branch assignment and account access
              </h2>
              <p className="mt-1 text-sm text-text-dim">
                Pick the working branches first, then decide how this doctor will sign in.
              </p>
            </div>
            <div className="space-y-5 px-6 py-6">
              {!isEdit && (
                <div className="grid gap-3 md:grid-cols-2">
                  <label
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      formData.account_mode === "manual"
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20"
                        : "border-border-main bg-bg-app dark:bg-slate-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="account_mode"
                      value="manual"
                      checked={formData.account_mode === "manual"}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <p className="text-sm font-semibold text-text-main">Create login now</p>
                    <p className="mt-1 text-sm text-text-dim">
                      Add username and password immediately so the doctor can sign in right away.
                    </p>
                  </label>
                  <label
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      formData.account_mode === "invite"
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20"
                        : "border-border-main bg-bg-app dark:bg-slate-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="account_mode"
                      value="invite"
                      checked={formData.account_mode === "invite"}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <p className="text-sm font-semibold text-text-main">Invite by email</p>
                    <p className="mt-1 text-sm text-text-dim">
                      Generate a one-time setup link and send the onboarding handoff later.
                    </p>
                  </label>
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="block text-sm font-semibold text-text-main">
                    {t("admin.branches")} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-text-dim">
                    {selectedBranches.length > 0
                      ? `${selectedBranches.length} selected`
                      : "Select at least one branch"}
                  </span>
                </div>
                {branches.length === 0 ? (
                  <p className="text-sm text-text-dim">{t("admin.noBranchesAvailable")}</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {branches.map((branch) => {
                      const checked = formData.branch_ids.includes(branch.id);
                      return (
                        <label
                          key={branch.id}
                          className={`cursor-pointer rounded-2xl border p-4 transition ${
                            checked
                              ? "border-cyan-500 bg-cyan-50 shadow-sm dark:bg-cyan-950/20"
                              : "border-border-main bg-bg-app dark:bg-slate-900"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleBranchToggle(branch.id)}
                              className="mt-1 h-4 w-4 rounded border-border-main text-cyan-500 focus:ring-cyan-500"
                            />
                            <div>
                              <p className="text-sm font-semibold text-text-main">{branch.name}</p>
                              <p className="mt-1 text-xs text-text-dim">{branch.code || "No branch code"}</p>
                              {typeof branch.doctor_count !== "undefined" && (
                                <p className="mt-2 text-xs text-text-dim">
                                  Current doctors: {branch.doctor_count}
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="mt-3 text-xs text-text-dim">{t("admin.selectBranchesHelp")}</p>
              </div>

              {!isEdit && formData.account_mode === "manual" && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-text-main">
                      {t("admin.username")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="doctor_username"
                      className={inputClassName}
                    />
                    <p className="mt-2 text-xs text-text-dim">{t("admin.usernameHelp")}</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-text-main">
                      {t("admin.password")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className={inputClassName}
                    />
                    <p className="mt-2 text-xs text-text-dim">{t("admin.passwordHelp")}</p>
                  </div>
                </div>
              )}

              {!isEdit && formData.account_mode === "invite" && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-300">
                  A one-time setup link will be generated and shown after saving this doctor.
                </div>
              )}
            </div>
          </section>

          <section className={cardClassName}>
            <div className="border-b border-border-main px-6 py-5">
              <h2 className="text-lg font-semibold text-text-main">
                {t("admin.professionalDetails")}
              </h2>
              <p className="mt-1 text-sm text-text-dim">
                Add clinical profile details and consultation settings.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 px-6 py-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.qualifications")}
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder="MD, Bachelor of Medicine"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.experience_years")}
                </label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                  placeholder="5"
                  min="0"
                  max="70"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.consultationFee")} ($)
                </label>
                <input
                  type="number"
                  name="consultation_fee"
                  step="0.01"
                  value={formData.consultation_fee}
                  onChange={handleInputChange}
                  placeholder="50.00"
                  min="0"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.status")}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={inputClassName}
                >
                  <option value="active">{t("admin.statusActive")}</option>
                  <option value="inactive">{t("admin.statusInactive")}</option>
                  <option value="on_leave">On leave</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.bio")}
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder={t("admin.bioPlaceholder")}
                  rows="4"
                  className={`${inputClassName} resize-none`}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-text-main">
                  {t("admin.avatarUrl")}
                </label>
                <input
                  type="url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  className={inputClassName}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className={`${cardClassName} p-6`}>
            <h2 className="text-base font-semibold text-text-main">Doctor snapshot</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Primary branch</p>
                <p className="mt-1 font-medium text-text-main">
                  {primarySelectedBranch?.name || "Waiting for branch selection"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Specialty</p>
                <p className="mt-1 font-medium text-text-main">
                  {selectedSpecialty?.name || "Not selected yet"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Branch coverage</p>
                <p className="mt-1 font-medium text-text-main">
                  {selectedBranchNames || "No branches selected"}
                </p>
              </div>
            </div>
          </section>

          {fetchBranchesUrl && primarySelectedBranch && (
            <section className={`${cardClassName} p-6`}>
              <h2 className="text-base font-semibold text-text-main">Subscription guardrail</h2>
              <p className="mt-2 text-sm text-text-dim">
                The first selected branch is used to validate subscription and doctor limits.
              </p>
              <div className="mt-4 rounded-2xl border border-border-main bg-bg-app p-4 dark:bg-slate-900">
                <p className="font-medium text-text-main">{primarySelectedBranch.name}</p>
                <p className="mt-1 text-sm text-text-dim">
                  {selectedBranchSubscription
                    ? `${selectedBranchSubscription.plan_name} • ${selectedBranchSubscription.status}`
                    : "No active subscription found"}
                </p>
                {hasFiniteDoctorLimit ? (
                  <>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full ${
                          selectedBranchDoctorLimitReached ? "bg-red-500" : "bg-cyan-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((selectedBranchDoctorCount / selectedBranchDoctorLimit) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-text-dim">
                      Doctors used: {selectedBranchDoctorCount}/{selectedBranchDoctorLimit}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-text-dim">Doctor limit: Unlimited</p>
                )}
              </div>

              {!selectedBranchHasSubscription && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  This branch has no active subscription record yet.
                </div>
              )}

              {selectedBranchHasSubscription && !selectedBranchSubscriptionActive && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  The selected branch subscription is inactive.
                </div>
              )}

              {selectedBranchDoctorLimitReached && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  This branch has reached the doctor limit of its current plan.
                </div>
              )}
            </section>
          )}

          <section className={`${cardClassName} p-6`}>
            <h2 className="text-base font-semibold text-text-main">Actions</h2>
            <p className="mt-2 text-sm text-text-dim">
              Review the doctor profile, then save when everything looks correct.
            </p>
            <div className="mt-5 space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-600 disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("common.saving")}</>
                ) : (
                  <><Save className="h-4 w-4" />{isEdit ? t("common.update") : t("common.save")}</>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(returnPath)}
                disabled={submitting}
                className="w-full rounded-xl border border-border-main px-4 py-3 text-sm font-semibold text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700 disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </section>

          {/* ── Mobile Sticky Actions (visible < lg) ── */}
          <div className="lg:hidden sticky bottom-0 z-10 -mx-1 rounded-2xl border border-border-main bg-bg-surface/80 px-5 py-4 shadow-lg backdrop-blur dark:bg-slate-800/80">
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate(returnPath)} disabled={submitting}
                className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-50">
                {t("common.cancel")}
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-600 disabled:opacity-50">
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{t("common.saving")}</>
                ) : (
                  <><Save className="h-4 w-4" />{isEdit ? t("common.update") : t("common.save")}</>
                )}
              </button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default DoctorFormPage;
