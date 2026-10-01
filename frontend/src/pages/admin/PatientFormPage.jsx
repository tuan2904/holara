import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, ArrowLeft, CheckCircle2, Heart, Loader2, Save,
} from "lucide-react";
import {
  getPatientByIdApi,
  getNextPatientCodeApi,
  createPatientApi,
  updatePatientApi,
} from "../../services/patientService";
import branchService from "../../services/branchService";

const PatientFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { patientId } = useParams();
  const isEdit = !!patientId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [branches, setBranches] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    patient_code: "",
    branch_ids: [],
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
    status: "active",
  });

  // Fetch patient data if editing
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchRes = await branchService.getAllBranches();
        setBranches(branchRes.data || []);
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };

    fetchBranches();

    if (isEdit) {
      const fetchPatient = async () => {
        try {
          const res = await getPatientByIdApi(patientId);
          const patient = res.data;
          if (patient) {
            setFormData({
              patient_code: patient.patient_code || "",
              branch_ids: patient.branch_ids || [],
              full_name: patient.full_name || "",
              phone: patient.phone || "",
              email: patient.email || "",
              gender: patient.gender || "",
              date_of_birth: patient.date_of_birth
                ? patient.date_of_birth.split("T")[0]
                : "",
              address: patient.address || "",
              blood_group: patient.blood_group || "",
              allergies: patient.allergies || "",
              medical_history: patient.medical_history || "",
              emergency_contact_name: patient.emergency_contact_name || "",
              emergency_contact_phone: patient.emergency_contact_phone || "",
              status: patient.status || "active",
            });
          }
        } catch (err) {
          console.error("Error fetching patient:", err);
          setError(t("admin.errorLoadingPatient"));
        } finally {
          setLoading(false);
        }
      };
      fetchPatient();
    } else {
      const fetchNextPatientCode = async () => {
        try {
          const res = await getNextPatientCodeApi();
          setFormData((prev) => ({
            ...prev,
            patient_code: res?.data?.code || "",
          }));
        } catch (err) {
          console.error("Error fetching next patient code:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchNextPatientCode();
      return;
    }

    if (!isEdit) {
      setLoading(false);
    }
  }, [patientId, isEdit, t]);

  useEffect(() => {
    if (!successMessage) return;
    const id = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(id);
  }, [successMessage]);

  const validateForm = () => {
    if (!formData.full_name?.trim()) {
      setError(t("admin.fullNameRequired"));
      return false;
    }
    if (!formData.phone?.trim()) {
      setError(t("admin.phoneRequired"));
      return false;
    }
    if (!isEdit && !formData.patient_code?.trim()) {
      setError(t("admin.patientCodeRequired"));
      return false;
    }
    if (!formData.branch_ids.length) {
      setError(t("admin.branchRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        await updatePatientApi(patientId, formData);
        setSuccessMessage(t("admin.patientUpdatedSuccess"));
        setTimeout(() => navigate("/admin/patients"), 1500);
      } else {
        await createPatientApi(formData);
        setSuccessMessage(t("admin.patientCreatedSuccess"));
        setTimeout(() => navigate("/admin/patients"), 1500);
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || t("admin.errorSubmittingForm");
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

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.full_name?.trim()) {
        setError(t("admin.fullNameRequired"));
        return false;
      }
      if (!formData.phone?.trim()) {
        setError(t("admin.phoneRequired"));
        return false;
      }
      if (!formData.branch_ids.length) {
        setError(t("admin.branchRequired"));
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    setError("");
    if (!validateStep(currentStep)) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePreviousStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const stepItems = [
    {
      id: 1,
      title: t("admin.basicInformation"),
      description: "Identity, contact details, and branch access.",
    },
    {
      id: 2,
      title: t("admin.medicalInformation"),
      description: "Medical profile and patient status.",
    },
    {
      id: 3,
      title: t("admin.emergencyContact"),
      description: "Emergency contact and final review.",
    },
  ];
  const inputClassName =
    "w-full rounded-xl border border-border-main bg-bg-app dark:bg-slate-900 px-4 py-3 text-sm text-text-main placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-rose-500/40";
  const cardClassName =
    "rounded-2xl border border-border-main bg-bg-surface dark:bg-slate-800 shadow-sm";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-500 border-r-transparent" />
        <p className="mt-3 text-sm text-text-dim">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-rose-400/10 blur-2xl" />
        <div className="relative">
          <button onClick={() => navigate("/admin/patients")}
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />{t("admin.patientsManagement")}
          </button>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-rose-400" />
                <h1 className="text-xl sm:text-2xl font-bold">
                  {isEdit ? t("admin.editPatient") : t("admin.addNewPatient")}
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                {isEdit
                  ? t("admin.updatePatientInfo")
                  : "A guided 3-step flow so the operator only sees the information needed at each moment."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
                  Step {currentStep} / 3
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
                  {formData.branch_ids.length > 0
                    ? `${formData.branch_ids.length} branch${formData.branch_ids.length > 1 ? "es" : ""}`
                    : "No branch yet"}
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur">
                  Status: {formData.status}
                </span>
              </div>
            </div>

            <div className="min-w-[240px] rounded-xl bg-white/5 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{t("admin.patientCode")}</p>
              <p className="mt-2 break-all font-mono text-lg font-semibold text-white">
                {formData.patient_code || "HLR_MED_ddmmyyyy_PT0001"}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {isEdit ? "Patient code stays fixed after creation." : "Reserved automatically when this form opens."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className={`${cardClassName} p-4 lg:p-6`}>
            <div className="grid gap-3 md:grid-cols-3">
              {stepItems.map((step) => {
                const isActive = currentStep === step.id;
                const isDone = currentStep > step.id;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (step.id <= currentStep) {
                        setError("");
                        setCurrentStep(step.id);
                      }
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20"
                        : isDone
                          ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : "border-border-main bg-bg-app dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                          isActive
                            ? "bg-rose-500 text-white"
                            : isDone
                              ? "bg-green-600 text-white"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {isDone ? "✓" : step.id}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text-main">{step.title}</p>
                        <p className="mt-1 text-xs text-text-dim">{step.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {currentStep === 1 && (
            <section className={cardClassName}>
              <div className="border-b border-border-main px-6 py-5">
                <h2 className="text-lg font-semibold text-text-main">{t("admin.basicInformation")}</h2>
                <p className="mt-1 text-sm text-text-dim">
                  Focus only on the essential contact details first.
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
                    placeholder="John Doe"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-main">
                    {t("admin.patientCode")}
                  </label>
                  <input
                    type="text"
                    name="patient_code"
                    value={formData.patient_code}
                    readOnly
                    disabled
                    className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-3 font-mono text-sm text-text-dim cursor-not-allowed dark:bg-slate-900"
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
                    {t("admin.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="patient@example.com"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-main">
                    {t("admin.gender")}
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={inputClassName}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">{t("admin.genderMale")}</option>
                    <option value="female">{t("admin.genderFemale")}</option>
                    <option value="other">{t("admin.genderOther")}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-main">
                    {t("admin.dateOfBirth")}
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className={inputClassName}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-text-main">
                    {t("admin.address")}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    className={inputClassName}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="block text-sm font-semibold text-text-main">
                      {t("admin.branches")} <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-text-dim">
                      {formData.branch_ids.length > 0
                        ? `${formData.branch_ids.length} selected`
                        : "Choose at least one branch"}
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
                                ? "border-rose-500 bg-rose-50 shadow-sm dark:bg-rose-950/20"
                                : "border-border-main bg-bg-app dark:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleBranchToggle(branch.id)}
                                className="mt-1 h-4 w-4 rounded border-border-main text-rose-500 focus:ring-rose-500"
                              />
                              <div>
                                <p className="text-sm font-semibold text-text-main">{branch.name}</p>
                                <p className="mt-1 text-xs text-text-dim">{branch.code || "No branch code"}</p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-text-dim">{t("admin.selectPatientBranchesHelp")}</p>
                </div>
              </div>
            </section>
          )}

          {currentStep === 2 && (
            <section className={cardClassName}>
              <div className="border-b border-border-main px-6 py-5">
                <h2 className="text-lg font-semibold text-text-main">{t("admin.medicalInformation")}</h2>
                <p className="mt-1 text-sm text-text-dim">
                  Capture medical context after the basic patient shell is ready.
                </p>
              </div>
              <div className="space-y-5 px-6 py-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-text-main">
                      {t("admin.bloodGroup")}
                    </label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleInputChange}
                      className={inputClassName}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
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
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-main">
                    {t("admin.allergies")}
                  </label>
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder={t("admin.allergiesPlaceholder")}
                    rows="4"
                    className={`${inputClassName} resize-none`}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-main">
                    {t("admin.medicalHistory")}
                  </label>
                  <textarea
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleInputChange}
                    placeholder={t("admin.medicalHistoryPlaceholder")}
                    rows="4"
                    className={`${inputClassName} resize-none`}
                  />
                </div>
              </div>
            </section>
          )}

          {currentStep === 3 && (
            <section className={cardClassName}>
              <div className="border-b border-border-main px-6 py-5">
                <h2 className="text-lg font-semibold text-text-main">{t("admin.emergencyContact")}</h2>
                <p className="mt-1 text-sm text-text-dim">
                  Final safety contact details and a quick review before saving.
                </p>
              </div>
              <div className="space-y-6 px-6 py-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-text-main">
                      {t("admin.emergencyContactName")}
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      placeholder="John Smith"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-text-main">
                      {t("admin.emergencyContactPhone")}
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      placeholder="+84 812 345 6789"
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border-main bg-bg-app p-5 dark:bg-slate-900">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-dim">
                    Final review
                  </h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Patient</p>
                      <p className="mt-1 font-medium text-text-main">{formData.full_name || "-"}</p>
                      <p className="mt-1 text-sm text-text-dim">{formData.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Branches</p>
                      <p className="mt-1 font-medium text-text-main">
                        {branches
                          .filter((branch) => formData.branch_ids.includes(branch.id))
                          .map((branch) => branch.name)
                          .join(", ") || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Medical</p>
                      <p className="mt-1 font-medium text-text-main">
                        {formData.blood_group || "No blood group set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Emergency</p>
                      <p className="mt-1 font-medium text-text-main">
                        {formData.emergency_contact_name || "No emergency contact yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Desktop Step Actions ── */}
          <section className={`${cardClassName} hidden sm:block p-5`}>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => navigate("/admin/patients")} disabled={submitting}
                className="rounded-xl border border-border-main px-5 py-3 text-sm font-semibold text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700 disabled:opacity-50">
                {t("common.cancel")}
              </button>
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <button type="button" onClick={handlePreviousStep}
                    className="rounded-xl border border-border-main px-5 py-3 text-sm font-semibold text-text-main transition hover:bg-bg-app dark:hover:bg-slate-700">
                    {t("common.previous", { defaultValue: "Previous" })}
                  </button>
                )}
                {currentStep < 3 ? (
                  <button type="button" onClick={handleNextStep}
                    className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600">
                    {t("common.next", { defaultValue: "Next step" })}
                  </button>
                ) : (
                  <button type="submit" disabled={submitting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600 disabled:opacity-50">
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{t("common.saving")}</>
                    ) : (
                      <><Save className="h-4 w-4" />{isEdit ? t("common.update") : t("common.save")}</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── Mobile Sticky Actions ── */}
          <div className="sm:hidden sticky bottom-0 z-10 -mx-1 rounded-2xl border border-border-main bg-bg-surface/80 px-4 py-3 shadow-lg backdrop-blur dark:bg-slate-800/80">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <button type="button" onClick={handlePreviousStep}
                  className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">
                  {t("common.previous", { defaultValue: "Previous" })}
                </button>
              )}
              {currentStep < 3 ? (
                <button type="button" onClick={handleNextStep}
                  className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600">
                  {t("common.next", { defaultValue: "Next step" })}
                </button>
              ) : (
                <button type="submit" disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600 disabled:opacity-50">
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />{t("common.saving")}</>
                  ) : (
                    <><Save className="h-4 w-4" />{isEdit ? t("common.update") : t("common.save")}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <section className={`${cardClassName} p-6`}>
            <h2 className="text-base font-semibold text-text-main">Why this flow</h2>
            <p className="mt-2 text-sm text-text-dim">
              The form is split into smaller decisions so operators can finish the critical patient shell first, then enrich medical and emergency details without overload.
            </p>
          </section>

          <section className={`${cardClassName} p-6`}>
            <h2 className="text-base font-semibold text-text-main">Current progress</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Step</p>
                <p className="mt-1 font-medium text-text-main">{currentStep} / 3</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Selected branches</p>
                <p className="mt-1 font-medium text-text-main">{formData.branch_ids.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Emergency contact</p>
                <p className="mt-1 font-medium text-text-main">
                  {formData.emergency_contact_name || "Not set yet"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default PatientFormPage;
