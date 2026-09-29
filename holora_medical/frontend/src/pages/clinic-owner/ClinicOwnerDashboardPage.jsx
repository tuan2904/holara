import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import branchService from "../../services/branchService";
import { getDoctorsByOwnerBranchesApi } from "../../services/doctorService";
import subscriptionService from "../../services/subscriptionService";

const ClinicOwnerDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [branchCount, setBranchCount] = useState(null);
  const [doctorCount, setDoctorCount] = useState(null);
  const [subscriptionSummary, setSubscriptionSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [branchRes, doctorRes] = await Promise.all([
          branchService.getMyBranches(),
          getDoctorsByOwnerBranchesApi(),
        ]);
        const subscriptionRes = await subscriptionService.getMySubscriptions();
        if (!cancelled) {
          setBranchCount((branchRes.data || []).length);
          setDoctorCount((doctorRes.data || []).length);
          setSubscriptionSummary((subscriptionRes.data || [])[0] || null);
        }
      } catch {
        if (!cancelled) {
          setBranchCount(0);
          setDoctorCount(0);
          setSubscriptionSummary(null);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#E06666] to-[#D85555] rounded-2xl sm:rounded-3xl shadow-md p-4 sm:p-8 text-white">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg sm:text-3xl font-bold mb-1 leading-snug">
            {t("clinicOwner.welcomeTitle") || "Welcome back"}, {user?.full_name || "Provider"}! 🏥
          </h1>
          <Link to="/" className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/25 transition shrink-0">
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Homepage</span>
          </Link>
        </div>
        <p className="text-white/85 text-xs sm:text-base mt-1">
          {t("clinicOwner.welcomeSubtitle") || "Manage your branches and doctors from here."}
        </p>
        <p className="mt-2 sm:mt-3 text-white/65 text-[10px] sm:text-sm hidden xs:block sm:block">
          📅 {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Branches */}
        <Link to="/clinic-owner/branches"
          className="bg-bg-surface dark:bg-slate-800 rounded-xl sm:rounded-3xl shadow-sm border border-border-main p-2.5 sm:p-6 flex flex-col items-center sm:items-start text-center sm:text-left transition hover:border-[#E06666]/40 hover:shadow-md">
          <span className="text-lg sm:text-3xl mb-1">🏥</span>
          <p className="text-2xl sm:text-4xl font-bold text-[#E06666] leading-none">
            {branchCount === null ? "—" : branchCount}
          </p>
          <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-wide text-text-dim mt-1 leading-tight">
            {t("clinicOwner.totalBranches") || "Branches"}
          </p>
          <span className="mt-2 hidden sm:inline-block text-sm text-[#E06666] hover:underline">
            {t("clinicOwner.viewBranches") || "View all →"}
          </span>
        </Link>

        {/* Doctors */}
        <Link to="/clinic-owner/doctors"
          className="bg-bg-surface dark:bg-slate-800 rounded-xl sm:rounded-3xl shadow-sm border border-border-main p-2.5 sm:p-6 flex flex-col items-center sm:items-start text-center sm:text-left transition hover:border-[#E06666]/40 hover:shadow-md">
          <span className="text-lg sm:text-3xl mb-1">👨‍⚕️</span>
          <p className="text-2xl sm:text-4xl font-bold text-[#E06666] leading-none">
            {doctorCount === null ? "—" : doctorCount}
          </p>
          <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-wide text-text-dim mt-1 leading-tight">
            {t("clinicOwner.totalDoctors") || "Doctors"}
          </p>
          <span className="mt-2 hidden sm:inline-block text-sm text-[#E06666] hover:underline">
            {t("clinicOwner.viewDoctors") || "View all →"}
          </span>
        </Link>

        {/* Subscription */}
        <Link to="/clinic-owner/subscription"
          className="bg-bg-surface dark:bg-slate-800 rounded-xl sm:rounded-3xl shadow-sm border border-border-main p-2.5 sm:p-6 flex flex-col items-center sm:items-start text-center sm:text-left transition hover:border-[#E06666]/40 hover:shadow-md">
          <span className="text-lg sm:text-3xl mb-1">💳</span>
          <p className="text-xs sm:text-lg font-bold text-[#E06666] capitalize leading-tight mt-0.5">
            {subscriptionSummary?.status || "none"}
          </p>
          <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-wide text-text-dim mt-1 leading-tight">
            {t("clinicOwner.subscription") || "Plan"}
          </p>
          <p className="mt-1 hidden sm:block text-sm text-text-dim truncate max-w-full">
            {subscriptionSummary?.plan_name || "No active plan yet"}
          </p>
          <span className="mt-2 hidden sm:inline-block text-sm text-[#E06666] hover:underline">
            {t("clinicOwner.manageSubscription") || "Manage →"}
          </span>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="bg-bg-surface dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 border border-border-main">
        <h2 className="text-sm sm:text-base font-semibold text-text-main mb-3 sm:mb-4">
          {t("clinicOwner.quickActions") || "Quick Actions"}
        </h2>
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
          <Link
            to="/clinic-owner/branches/new"
            className="col-span-1 bg-[#E06666] text-white px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[#D55555] transition shadow-sm text-center"
          >
            + {t("branch.addTitle") || "Add Branch"}
          </Link>
          <Link
            to="/clinic-owner/doctors/new"
            className="col-span-1 border border-[#E06666] text-[#E06666] px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[#FFF5F5] dark:hover:bg-slate-700 transition text-center"
          >
            + {t("admin.addNewDoctor") || "Add Doctor"}
          </Link>
          <Link
            to="/clinic-owner/subscription"
            className="col-span-2 sm:col-span-1 border border-border-main text-text-main px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-bg-app dark:hover:bg-slate-700 transition text-center"
          >
            {t("clinicOwner.subscription") || "Subscription"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClinicOwnerDashboardPage;
