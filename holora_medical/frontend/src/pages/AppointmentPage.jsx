import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock3,
  Hospital,
  Loader2,
  Search,
  Stethoscope,
  User,
  Video,
} from "lucide-react";
import { getDoctorByIdApi, searchDoctorsApi } from "../services/doctorService";
import { appointmentService } from "../services/appointmentService";
import { useAuth } from "../context/AuthContext";

const STATUS_STYLES = {
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const getMinDate = () => new Date().toISOString().slice(0, 10);

const formatDate = (value, locale) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
};

const formatTime = (timeValue, locale) => {
  if (!timeValue) return "-";
  if (typeof timeValue === "string" && timeValue.includes(":")) {
    return timeValue.slice(0, 5);
  }
  const d = new Date(timeValue);
  if (Number.isNaN(d.getTime())) return `${timeValue}`;
  return d.toLocaleTimeString(locale === "vi" ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit" });
};

const AppointmentPage = () => {
  const { t, i18n } = useTranslation();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDoctorId = searchParams.get("doctorId") || "";
  const initialBranchId = searchParams.get("branchId") || "";

  const [activeTab, setActiveTab] = useState("booking");
  const [mobileStep, setMobileStep] = useState("select"); // "select" | "book" — mobile only
  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingMoreDoctors, setLoadingMoreDoctors] = useState(false);
  const [hasMoreDoctors, setHasMoreDoctors] = useState(false);
  const [doctorPage, setDoctorPage] = useState(1);
  const [loadingList, setLoadingList] = useState(false);
  const [searchDoctor, setSearchDoctor] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  // Recurring appointment state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState("none"); // none|daily|weekly|monthly
  const [recurringCount, setRecurringCount] = useState(2);
  const [recurringUntil, setRecurringUntil] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentType, setAppointmentType] = useState("offline");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getBranchSelectionForDoctor = useCallback(
    (doctor) => {
      const branches = doctor?.branches || [];

      if (initialBranchId && branches.some((branch) => String(branch.id) === String(initialBranchId))) {
        return String(initialBranchId);
      }

      if (branches.length === 1) {
        return String(branches[0].id);
      }

      return "";
    },
    [initialBranchId]
  );

  const statusLabels = {
    scheduled: t("patient.appointmentsPage.statusScheduled"),
    confirmed: t("patient.appointmentsPage.statusConfirmed"),
    completed: t("patient.appointmentsPage.statusCompleted"),
    cancelled: t("patient.appointmentsPage.statusCancelled"),
  };

  const fetchDoctors = useCallback(async ({ page = 1, append = false, query = "" } = {}) => {
    try {
      if (append) {
        setLoadingMoreDoctors(true);
      } else {
        setLoadingDoctors(true);
      }

      const data = await searchDoctorsApi({
        q: query,
        status: "active",
        page,
        limit: 20,
        branch_id: initialBranchId || undefined,
      });

      const nextDoctors = data?.data || [];
      const meta = data?.meta || {};

      setDoctors((prev) => (append ? [...prev, ...nextDoctors] : nextDoctors));
      setDoctorPage(meta.page || page);
      setHasMoreDoctors(Boolean(meta.hasMore));
    } catch (err) {
      console.error(err);
      setError(t("patient.appointmentsPage.errors.loadDoctors"));
    } finally {
      setLoadingDoctors(false);
      setLoadingMoreDoctors(false);
    }
  }, [initialBranchId, t]);

  useEffect(() => {
    if (!initialDoctorId) return;

    let cancelled = false;

    const loadDoctor = async () => {
      try {
        const response = await getDoctorByIdApi(initialDoctorId);
        const doctor = response?.data || response;
        if (!doctor || cancelled) return;

        setSelectedDoctor(doctor);
        setSelectedBranchId(getBranchSelectionForDoctor(doctor));
        setMobileStep("book");
      } catch (err) {
        console.error("Failed to load initial doctor", err);
      }
    };

    loadDoctor();

    return () => {
      cancelled = true;
    };
  }, [getBranchSelectionForDoctor, initialDoctorId]);

  const fetchMyAppointments = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await appointmentService.getMyAppointments();
      setMyAppointments(res || []);
    } catch (err) {
      console.error(err);
      setError(t("patient.appointmentsPage.errors.loadAppointments"));
    } finally {
      setLoadingList(false);
    }
  }, [t]);

  const fetchSlots = useCallback(async () => {
    try {
      setLoadingSlots(true);
      setSelectedSlot("");
      const res = await appointmentService.getAvailableSlots(
        selectedDoctor.id,
        selectedDate,
        duration,
        selectedBranchId
      );
      setAvailableSlots(res || []);
    } catch (err) {
      console.error("Error fetching slots:", err);
      setAvailableSlots([]);
      setError(t("patient.appointmentsPage.errors.loadSlots"));
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedBranchId, selectedDate, selectedDoctor, duration, t]);

  useEffect(() => {
    if (role !== "patient") {
      navigate("/");
      return;
    }

    fetchMyAppointments();
  }, [fetchMyAppointments, role, navigate]);

  useEffect(() => {
    if (role !== "patient") return;

    const timer = setTimeout(() => {
      fetchDoctors({ page: 1, append: false, query: searchDoctor.trim() });
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchDoctors, role, searchDoctor]);

  useEffect(() => {
    if (selectedDoctor && selectedDate && selectedBranchId) {
      fetchSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlot("");
    }
  }, [selectedDoctor, selectedDate, duration, selectedBranchId, fetchSlots]);

  const selectedDoctorBranches = useMemo(() => {
    if (!selectedDoctor?.branches?.length) return [];
    return selectedDoctor.branches;
  }, [selectedDoctor]);

  const canQuerySlots = Boolean(selectedDoctor && selectedDate && selectedBranchId);

  const handleLoadMoreDoctors = () => {
    if (!hasMoreDoctors || loadingMoreDoctors) return;
    fetchDoctors({
      page: doctorPage + 1,
      append: true,
      query: searchDoctor.trim(),
    });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedDoctor || !selectedDate || !selectedSlot || !reason || !selectedBranchId) {
      setError(t("patient.appointmentsPage.errors.missingBookingFields"));
      return;
    }

    setIsBooking(true);
    try {
      await appointmentService.bookAppointment({
        doctor_id: selectedDoctor.id,
        specialty_id: selectedDoctor.specialty_id,
        branch_id: Number(selectedBranchId),
        appointment_date: selectedDate,
        start_time: selectedSlot,
        duration_minutes: duration,
        reason,
        appointment_type: appointmentType,
        // Recurring fields
        recurring: isRecurring,
        recurring_type: isRecurring ? recurringType : undefined,
        recurring_count: isRecurring && recurringType !== "none" ? recurringCount : undefined,
        recurring_until: isRecurring && recurringType !== "none" ? recurringUntil : undefined,
      });

      setSuccessMessage(t("patient.appointmentsPage.bookingSuccess", { time: selectedSlot }));
      setSelectedDoctor(null);
      setSelectedBranchId("");
      setSelectedDate("");
      setReason("");
      setSelectedSlot("");
      setAvailableSlots([]);
      setAppointmentType("offline");
      fetchMyAppointments();
      setActiveTab("my_list");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || t("patient.appointmentsPage.errors.bookingFailed"));
      fetchSlots();
    } finally {
      setIsBooking(false);
    }
  };

  const handleChooseDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedBranchId(getBranchSelectionForDoctor(doctor));
    setSelectedSlot("");
    setAvailableSlots([]);
    setMobileStep("book"); // auto-advance on mobile
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
      <div className="overflow-hidden rounded-2xl sm:rounded-[28px] bg-gradient-to-br from-[#E06666] to-[#C04444] p-5 sm:p-8 text-white shadow-lg md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/75">{t("patient.zone")}</p>
            <h1 className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">
              {t("patient.myAppointments")}
            </h1>
            <p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm leading-6 text-white/85 md:text-base">
              {t("patient.appointmentsPage.heroDescription")}
            </p>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-white/15 bg-white/10 p-3 sm:p-4 backdrop-blur self-start md:self-auto">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/70">{t("patient.appointmentsPage.summaryTitle")}</p>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold">{myAppointments.length}</p>
            <p className="text-xs sm:text-sm text-white/75">{t("patient.appointmentsPage.summaryValueLabel")}</p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab("booking")}
            className={`rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              activeTab === "booking"
                ? "bg-white text-[#E06666]"
                : "border border-white/20 bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {t("patient.appointmentsPage.newBookingTab")}
          </button>
          <button
            onClick={() => setActiveTab("my_list")}
            className={`rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              activeTab === "my_list"
                ? "bg-white text-[#E06666]"
                : "border border-white/20 bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {t("patient.appointmentsPage.myListTab")}
          </button>
        </div>
      </div>

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

      {activeTab === "booking" && (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">

          {/* ── Doctor list ── hidden on mobile when user is on fill step */}
          <aside className={`rounded-2xl sm:rounded-3xl border border-border-main bg-bg-surface p-4 sm:p-5 shadow-sm dark:bg-slate-800 ${
            mobileStep === "book" ? "hidden lg:flex lg:flex-col" : "flex flex-col"
          }`}>
            <h2 className="mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg font-bold text-text-main">
              <Stethoscope className="h-5 w-5 text-[#E06666]" />
              {t("patient.appointmentsPage.stepSelectDoctor")}
            </h2>

            <div className="relative mb-3 sm:mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
                placeholder={t("patient.appointmentsPage.searchPlaceholder")}
                className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-3 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666] dark:bg-slate-900"
              />
            </div>

            <div className="max-h-[50vh] lg:max-h-[620px] space-y-2 sm:space-y-3 overflow-y-auto pr-1 flex-1">
              {loadingDoctors ? (
                <div className="flex items-center gap-2 rounded-2xl border border-border-main bg-bg-app px-4 py-3 text-sm text-text-dim dark:bg-slate-900">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("patient.appointmentsPage.loadingDoctors")}
                </div>
              ) : doctors.length === 0 ? (
                <div className="rounded-2xl border border-border-main bg-bg-app px-4 py-5 text-sm text-text-dim dark:bg-slate-900">
                  {t("patient.appointmentsPage.emptyDoctors")}
                </div>
              ) : (
                <>
                  {doctors.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleChooseDoctor(doc)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        selectedDoctor?.id === doc.id
                          ? "border-[#E06666] bg-[#fff4f2] dark:bg-red-950/20"
                          : "border-border-main bg-bg-app hover:border-[#E06666]/50 dark:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.avatar_url || "https://ui-avatars.com/api/?name=Doctor&background=E2E8F0&color=0F172A"}
                          alt={doc.full_name || t("common.doctor")}
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-text-main truncate">{doc.full_name}</div>
                          <div className="text-xs text-text-dim truncate">{doc.specialty_name || t("patient.appointmentsPage.generalSpecialty")}</div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {hasMoreDoctors && (
                    <button
                      type="button"
                      onClick={handleLoadMoreDoctors}
                      disabled={loadingMoreDoctors}
                      className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm font-semibold text-text-main transition hover:border-[#E06666] dark:bg-slate-900 disabled:opacity-60"
                    >
                      {loadingMoreDoctors ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> {t("patient.appointmentsPage.loadingMoreDoctors")}
                        </span>
                      ) : (
                        t("patient.appointmentsPage.loadMoreDoctors")
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* ── Booking form ── hidden on mobile when user is on select step */}
          <section className={`rounded-2xl sm:rounded-3xl border border-border-main bg-bg-surface p-4 sm:p-6 shadow-sm dark:bg-slate-800 md:p-8 ${
            mobileStep === "select" ? "hidden lg:block" : "block"
          }`}>
            {!selectedDoctor ? (
              <div className="flex h-48 sm:h-[480px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-main bg-bg-app text-text-dim dark:bg-slate-900">
                <Stethoscope className="h-10 w-10 sm:h-12 sm:w-12" />
                <p className="mt-3 text-sm">{t("patient.appointmentsPage.selectDoctorHint")}</p>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-4 sm:space-y-5">

                {/* Mobile: back + doctor header */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileStep("select")}
                    className="lg:hidden flex items-center gap-1 text-xs font-semibold text-[#E06666] hover:underline shrink-0"
                  >
                    ← {t("patient.appointmentsPage.changeDoctor") || "Đổi bác sĩ"}
                  </button>
                  <h2 className="text-base sm:text-lg font-bold text-text-main truncate">
                    {t("patient.appointmentsPage.stepBookWithDoctor", { name: selectedDoctor.full_name })}
                  </h2>
                </div>

                {/* Doctor info summary */}
                <div className="flex items-center gap-3 rounded-2xl border border-border-main bg-bg-app p-3 sm:p-4 dark:bg-slate-900">
                  <img
                    src={selectedDoctor.avatar_url || "https://ui-avatars.com/api/?name=Doctor&background=E2E8F0&color=0F172A"}
                    alt={selectedDoctor.full_name}
                    className="h-10 w-10 rounded-full border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-text-main truncate">{selectedDoctor.full_name}</div>
                    <div className="text-xs text-text-dim">{selectedDoctor.specialty_name || t("patient.appointmentsPage.generalSpecialty")} • {t("patient.appointmentsPage.branchCount", { count: selectedDoctorBranches.length })}</div>
                  </div>
                </div>

                {/* Appointment Type */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-main">Hình thức khám</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAppointmentType("offline")}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                        appointmentType === "offline"
                          ? "border-[#E06666] bg-[#E06666] text-white"
                          : "border-border-main bg-bg-app text-text-main hover:border-[#E06666]/50 dark:bg-slate-900"
                      }`}
                    >
                      <Hospital className="h-4 w-4" />
                      Trực tiếp
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentType("online")}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                        appointmentType === "online"
                          ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                          : "border-border-main bg-bg-app text-text-main hover:border-[#3B82F6]/50 dark:bg-slate-900"
                      }`}
                    >
                      <Video className="h-4 w-4" />
                      Trực tuyến
                    </button>
                  </div>
                  {appointmentType === "online" && (
                    <p className="mt-1.5 text-xs text-blue-500 flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      Cuộc gọi video sẽ bắt đầu tại thời điểm khám
                    </p>
                  )}
                </div>

                {/* Branch + Date: 2 cols on mobile, 3 on md */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <div className="sm:col-span-1 md:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-text-main">{t("patient.appointmentsPage.branchLabel")}</label>
                    <select
                      required
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full rounded-xl border border-border-main bg-bg-app px-3 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666] dark:bg-slate-900"
                    >
                      <option value="">{t("patient.appointmentsPage.selectBranchPlaceholder")}</option>
                      {selectedDoctorBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} {branch.code ? `(${branch.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-text-main">{t("patient.appointmentsPage.dateLabel")}</label>
                    <input
                      type="date"
                      required
                      min={getMinDate()}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-xl border border-border-main bg-bg-app px-3 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666] dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-text-main">{t("patient.appointmentsPage.durationLabel")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { mins: 30, label: t("patient.appointmentsPage.duration30") },
                      { mins: 60, label: t("patient.appointmentsPage.duration60") },
                      { mins: 90, label: t("patient.appointmentsPage.duration90") },
                    ].map(({ mins, label }) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDuration(mins)}
                        className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                          duration === mins
                            ? "border-[#E06666] bg-[#E06666] text-white"
                            : "border-border-main bg-bg-app text-text-main hover:border-[#E06666]/50 dark:bg-slate-900"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time slots */}
                <div className="rounded-2xl border border-border-main bg-bg-app p-3 sm:p-4 dark:bg-slate-900">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-main">
                    <Clock3 className="h-4 w-4 text-[#E06666]" />
                    {t("patient.appointmentsPage.stepSelectSlot")}
                  </h3>
                  {loadingSlots ? (
                    <p className="flex items-center gap-2 text-sm text-text-dim">
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("patient.appointmentsPage.loadingSlots")}
                    </p>
                  ) : !canQuerySlots ? (
                    <p className="text-sm text-text-dim">{t("patient.appointmentsPage.selectDateAndBranchHint")}</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-red-500">{t("patient.appointmentsPage.noSlots")}</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedSlot(time)}
                          className={`rounded-lg px-1 py-2 text-xs sm:text-sm font-semibold transition ${
                            selectedSlot === time
                              ? "bg-[#E06666] text-white"
                              : "border border-border-main bg-bg-surface text-text-main hover:border-[#E06666]/50 dark:bg-slate-800"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recurring Appointment */}
                <div className="border rounded-xl p-3 mb-2">
                  <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-text-main">
                    <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
                    Đặt lịch lặp lại
                  </label>
                  {isRecurring && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Kiểu lặp lại</label>
                        <select value={recurringType} onChange={e => setRecurringType(e.target.value)} className="w-full rounded border px-2 py-1">
                          <option value="none">Chọn kiểu lặp</option>
                          <option value="daily">Hàng ngày</option>
                          <option value="weekly">Hàng tuần</option>
                          <option value="monthly">Hàng tháng</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Số lần lặp lại</label>
                        <input type="number" min={2} max={100} value={recurringCount} onChange={e => setRecurringCount(Number(e.target.value))} className="w-full rounded border px-2 py-1" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Hoặc đến ngày</label>
                        <input type="date" value={recurringUntil} onChange={e => setRecurringUntil(e.target.value)} className="w-full rounded border px-2 py-1" min={selectedDate} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-text-main">{t("patient.appointmentsPage.reasonLabel")}</label>
                  <textarea
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("patient.appointmentsPage.reasonPlaceholder")}
                    className="w-full rounded-xl border border-border-main bg-bg-app px-3 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666] dark:bg-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBooking || !selectedSlot || !selectedBranchId}
                  className="w-full rounded-xl bg-[#E06666] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#D55555] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBooking ? t("patient.appointmentsPage.bookingInProgress") : t("patient.appointmentsPage.confirmBooking")}
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      {activeTab === "my_list" && (
        <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">

          {/* Mobile card list */}
          <div className="block sm:hidden divide-y divide-border-main">
            {loadingList ? (
              <div className="px-4 py-10 text-center text-sm text-text-dim">
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("patient.appointmentsPage.loadingAppointments")}
                </span>
              </div>
            ) : myAppointments.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-text-dim">
                {t("patient.appointmentsPage.emptyAppointments")}
              </div>
            ) : (
              myAppointments.map((app) => (
                <div key={app.id} className="p-4 space-y-3 cursor-pointer hover:bg-bg-app dark:hover:bg-slate-900/40 transition-colors" onClick={() => navigate(`/patient/appointments/${app.id}`)}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#E06666]">{app.appointment_code}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                      STATUS_STYLES[app.status] || "bg-gray-100 text-gray-700"
                    }`}>
                      <CircleDot className="h-2.5 w-2.5" />
                      {statusLabels[app.status] || app.status}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-[#E06666] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-text-main">{formatDate(app.appointment_date, i18n.language)}</div>
                      <div className="text-xs text-text-dim">{formatTime(app.start_time, i18n.language)} - {formatTime(app.end_time, i18n.language)}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-[#E06666] mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-text-main">{app.doctor_name || "-"}</div>
                      <div className="text-xs text-text-dim">{app.specialty_name || "-"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Hospital className="h-4 w-4 text-[#E06666] shrink-0" />
                    <span className="text-sm text-text-main">{app.branch_name || "-"}</span>
                    {app.recurring_id && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Lặp lại
                      </span>
                    )}
                    {app.appointment_type === "online" && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <Video className="h-3 w-3" /> Trực tuyến
                      </span>
                    )}
                  </div>
                  {app.appointment_type === "online" && (app.status === "scheduled" || app.status === "confirmed") && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/patient/appointments/${app.id}/room`); }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#2563EB]"
                    >
                      <Video className="h-3.5 w-3.5" /> {t("patient.appointmentsPage.enterRoom")}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-border-main">
              <thead className="bg-bg-app dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-dim">{t("patient.appointmentsPage.tableCode")}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-dim">{t("patient.appointmentsPage.tableDateTime")}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-dim">{t("patient.appointmentsPage.tableDoctor")}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-dim">{t("patient.appointmentsPage.tableBranch")}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-text-dim">{t("patient.appointmentsPage.tableStatus")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-text-dim">{t("patient.appointmentsPage.tableOnline")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main bg-bg-surface dark:bg-slate-800">
                {loadingList ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-text-dim">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> {t("patient.appointmentsPage.loadingAppointments")}
                      </span>
                    </td>
                  </tr>
                ) : myAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-text-dim">
                      {t("patient.appointmentsPage.emptyAppointments")}
                    </td>
                  </tr>
                ) : (
                  myAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-bg-app dark:hover:bg-slate-900/40 cursor-pointer" onClick={() => navigate(`/patient/appointments/${app.id}`)}>
                      <td className="px-6 py-4 text-sm font-semibold text-[#E06666]">{app.appointment_code}</td>
                      <td className="px-6 py-4 text-sm text-text-main">
                        <div>{formatDate(app.appointment_date, i18n.language)}</div>
                        <div className="text-xs text-text-dim">
                          {formatTime(app.start_time, i18n.language)} - {formatTime(app.end_time, i18n.language)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-main">
                        <div className="font-medium">{app.doctor_name || "-"}</div>
                        <div className="text-xs text-text-dim">{app.specialty_name || "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-main">
                        <div className="flex items-center gap-2">
                          <span>{app.branch_name || "-"}</span>
                          {app.recurring_id && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Lặp lại
                            </span>
                          )}
                        </div>
                        {app.appointment_type === "online" && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Video className="h-3 w-3" /> Trực tuyến
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                            STATUS_STYLES[app.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <CircleDot className="h-3 w-3" />
                          {statusLabels[app.status] || app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {app.appointment_type === "online" && (app.status === "scheduled" || app.status === "confirmed") && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/patient/appointments/${app.id}/room`); }}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#2563EB]"
                          >
                            <Video className="h-3.5 w-3.5" /> {t("patient.appointmentsPage.enterRoom")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentPage;
