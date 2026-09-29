import { useCallback, useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, CheckCircle2, ChevronDown, CreditCard,
  Crown, Download, Eye, FileText, Receipt, RefreshCw,
  Shield, Sparkles, X, Zap,
} from "lucide-react";
import branchService from "../../services/branchService";
import subscriptionService from "../../services/subscriptionService";
import PaymentModal from "../../components/PaymentModal";
import ConfirmModal from "../../components/ConfirmModal";

/* ── Constants ─────────────────────────────── */
const PLAN_META = {
  HOLORA_FREE: { color: "#64748b", gradient: "from-slate-500 to-slate-600", icon: Shield, tagline: "free_forever" },
  HOLORA_PLUS: { color: "#6366f1", gradient: "from-indigo-500 to-purple-600", icon: Crown, tagline: "unlimited_power" },
};

const STATUS_BADGE = {
  active:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  trialing:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  past_due:  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  expired:   "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

const PAYMENT_STATUS_BADGE = {
  paid:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  failed:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  expired: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

const METHOD_LABEL = { vnpay: "VNPAY", momo: "MoMo", zalopay: "ZaloPay", bank_transfer: "Bank Transfer" };

const formatVND = (cents) => (cents || 0).toLocaleString("vi-VN") + " ₫";
const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const formatDateTime = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/* ── Skeleton ──────────────────────────────── */
const SW = [75, 55, 40, 90, 60, 70, 50, 85];
const SkeletonRow = ({ i }) => (
  <tr className="animate-pulse">
    {Array.from({ length: 6 }).map((_, c) => (
      <td key={c} className="px-4 py-3.5">
        <div className="h-4 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[(i + c) % SW.length]}%` }} />
      </td>
    ))}
  </tr>
);
const SkeletonCard = ({ i }) => (
  <div className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800">
    <div className="space-y-3">
      <div className="h-4 w-3/4 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: `${SW[i % SW.length]}%` }} />
      <div className="h-3 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

/* ── Invoice Modal ─────────────────────────── */
const InvoiceModal = ({ order, onClose, t }) => {
  if (!order) return null;
  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t("subscription.invoiceDetail", { defaultValue: "Invoice Detail" })}</h3>
                <p className="text-xs text-indigo-100">{order.invoice_number || `#${order.id}`}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="divide-y divide-border-main dark:divide-slate-700">
          {[
            [t("subscription.planName", { defaultValue: "Plan" }), order.plan_name || order.plan_code],
            [t("subscription.duration", { defaultValue: "Duration" }), `${order.months} ${t("subscription.months", { defaultValue: "month(s)" })}`],
            [t("subscription.amount", { defaultValue: "Amount" }), formatVND(order.amount_cents)],
            [t("subscription.paymentMethod", { defaultValue: "Method" }), METHOD_LABEL[order.payment_method] || order.payment_method],
            [t("subscription.status", { defaultValue: "Status" }), null, order.status],
            [t("subscription.createdAt", { defaultValue: "Created" }), formatDateTime(order.created_at)],
            [t("subscription.paidAt", { defaultValue: "Paid at" }), order.paid_at ? formatDateTime(order.paid_at) : "—"],
          ].map(([label, value, status]) => (
            <div key={label} className="flex items-center justify-between px-6 py-3">
              <span className="text-sm text-text-dim">{label}</span>
              {status ? (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_BADGE[status] || ""}`}>
                  {status}
                </span>
              ) : (
                <span className="text-sm font-medium text-text-main">{value}</span>
              )}
            </div>
          ))}
          {order.description && (
            <div className="flex items-center justify-between px-6 py-3">
              <span className="text-sm text-text-dim">{t("subscription.description", { defaultValue: "Description" })}</span>
              <span className="text-sm font-medium text-text-main">{order.description}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {t("common.close", { defaultValue: "Close" })}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   SubscriptionPage
   ══════════════════════════════════════════════ */
const SubscriptionPage = () => {
  const { t } = useTranslation();
  /* ── State ── */
  const [accountSub, setAccountSub] = useState(null);
  const [branches, setBranches] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmDowngradeOpen, setConfirmDowngradeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("plan"); // "plan" | "billing"
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const PLUS_PLAN = { code: "HOLORA_PLUS", name: "Holora Plus", price_cents: 299000, currency: "VND" };

  /* ── Fetch ── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [subRes, branchRes, payRes] = await Promise.all([
        subscriptionService.getMySubscriptions(),
        branchService.getMyBranches(),
        subscriptionService.getPaymentHistory(),
      ]);
      const subs = subRes.data || [];
      const acct = subs
        .filter((s) => s.scope_type === "account")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
      setAccountSub(acct);
      setBranches(branchRes.data || []);
      setPayments(payRes.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t("subscription.loadError", { defaultValue: "Failed to load data" }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Derived ── */
  const planCode = accountSub?.plan_code || "HOLORA_FREE";
  const meta = PLAN_META[planCode] || PLAN_META.HOLORA_FREE;
  const isPlus = planCode === "HOLORA_PLUS";
  const branchUsed = branches.length;
  const branchLimit = isPlus ? null : 3;
  const PlanIcon = meta.icon;

  const usagePercent = useMemo(() => {
    if (branchLimit === null) return 100;
    return Math.min(100, Math.round((branchUsed / branchLimit) * 100));
  }, [branchUsed, branchLimit]);

  const stats = useMemo(() => {
    const paid = payments.filter((p) => p.status === "paid");
    const totalSpent = paid.reduce((s, p) => s + (p.amount_cents || 0), 0);
    return { total: payments.length, paid: paid.length, totalSpent };
  }, [payments]);

  /* ── Actions ── */
  const switchPlan = (targetCode) => {
    if (targetCode === "HOLORA_PLUS") {
      setMessage("");
      setError("");
      setShowPaymentModal(true);
      return;
    }
    setConfirmDowngradeOpen(true);
  };

  const confirmDowngrade = async () => {
    setUpgrading(true);
    setMessage("");
    setError("");
    try {
      await subscriptionService.activateSubscription({ plan_code: "HOLORA_FREE", scope_type: "account", months: 1 });
      setMessage(t("subscription.downgradedSuccess", { defaultValue: "Switched to Holora Free." }));
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || t("subscription.actionFailed", { defaultValue: "Action failed" }));
    } finally {
      setUpgrading(false);
      setConfirmDowngradeOpen(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setMessage(t("subscription.upgradedSuccess", { defaultValue: "Upgraded to Holora Plus! 🎉" }));
    await loadData();
  };

  /* ── Tabs ── */
  const TABS = [
    { key: "plan", label: t("subscription.tabPlan", { defaultValue: "Plan" }), icon: Crown },
    { key: "billing", label: t("subscription.tabBilling", { defaultValue: "Billing History" }), icon: Receipt },
  ];

  /* ══ RENDER ══ */
  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 shadow-lg sm:px-8 sm:py-10">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {t("subscription.title", { defaultValue: "Subscription" })}
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">
                {t("subscription.subtitle", { defaultValue: "Manage your Holora plan & billing" })}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("subscription.currentPlan", { defaultValue: "Current plan" }), value: accountSub?.plan_name || "Holora Free", icon: Crown, accent: "text-indigo-400" },
              { label: t("subscription.branches", { defaultValue: "Branches" }), value: branchLimit ? `${branchUsed} / ${branchLimit}` : `${branchUsed}`, icon: Zap, accent: "text-emerald-400" },
              { label: t("subscription.totalPayments", { defaultValue: "Payments" }), value: stats.paid, icon: CreditCard, accent: "text-amber-400" },
              { label: t("subscription.totalSpent", { defaultValue: "Total spent" }), value: formatVND(stats.totalSpent), icon: Receipt, accent: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/5 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.accent}`} />
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
                <p className="mt-1 text-lg font-bold text-white truncate">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {message}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ Plan tab ═══════ */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[0, 1].map((i) => <SkeletonCard key={i} i={i} />)}
            </div>
          ) : (
            <>
              {/* Active plan summary */}
              <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
                <div className={`bg-gradient-to-r ${meta.gradient} px-6 py-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                        <PlanIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{accountSub?.plan_name || "Holora Free"}</h2>
                        <p className="text-xs text-white/70">
                          {t(`subscription.${meta.tagline}`, { defaultValue: isPlus ? "Unlimited power" : "Free forever" })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[accountSub?.status] || STATUS_BADGE.active}`}>
                      {accountSub?.status || "active"}
                    </span>
                  </div>
                </div>

                {/* Usage for Free */}
                {!isPlus && (
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-text-dim">{t("subscription.branchUsage", { defaultValue: "Branch usage" })}</span>
                      <span className="font-semibold text-text-main">{branchUsed} / {branchLimit}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${usagePercent}%`,
                          background: branchUsed >= branchLimit ? "#ef4444" : meta.color,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-text-dim">
                      {t("subscription.doctorLimit", { defaultValue: "Doctor limit: 3 doctors / branch" })}
                    </p>
                  </div>
                )}
              </div>

              {/* Plan comparison */}
              <div>
                <h2 className="text-lg font-bold text-text-main mb-4">
                  {t("subscription.availablePlans", { defaultValue: "Available Plans" })}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">

                  {/* FREE card */}
                  <div className={`relative flex flex-col gap-3 rounded-2xl border-2 p-6 pt-7 transition ${
                    !isPlus
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                      : "border-border-main bg-bg-surface dark:bg-slate-800"
                  }`}>
                    {!isPlus && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-4 py-0.5 text-xs font-bold text-white whitespace-nowrap">
                        {t("subscription.currentPlanBadge", { defaultValue: "Current plan" })}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-slate-500" />
                      <span className="text-base font-bold text-text-main">Holora Free</span>
                    </div>
                    <div className="text-2xl font-extrabold text-text-main">
                      {t("subscription.free", { defaultValue: "Free" })}
                    </div>
                    <ul className="flex-1 space-y-2 text-sm text-text-dim">
                      <li>✅ {t("subscription.maxBranches", { defaultValue: "Up to 3 branches" })}</li>
                      <li>✅ {t("subscription.maxDoctorsPerBranch", { defaultValue: "Up to 3 doctors / branch" })}</li>
                      <li>✅ {t("subscription.appointmentMgmt", { defaultValue: "Appointment management" })}</li>
                      <li>✅ {t("subscription.patientRecords", { defaultValue: "Patient records" })}</li>
                      <li className="opacity-50">❌ {t("subscription.unlimitedBranches", { defaultValue: "Unlimited branches" })}</li>
                      <li className="opacity-50">❌ {t("subscription.unlimitedDoctors", { defaultValue: "Unlimited doctors" })}</li>
                    </ul>
                    {isPlus && (
                      <button
                        type="button"
                        onClick={() => switchPlan("HOLORA_FREE")}
                        disabled={upgrading}
                        className="mt-auto w-full rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-dim transition hover:bg-bg-app dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {t("subscription.downgradeToFree", { defaultValue: "Downgrade to Free" })}
                      </button>
                    )}
                  </div>

                  {/* PLUS card */}
                  <div className={`relative flex flex-col gap-3 rounded-2xl border-2 p-6 pt-7 transition ${
                    isPlus
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                      : "border-border-main bg-bg-surface dark:bg-slate-800"
                  }`}>
                    {isPlus && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-4 py-0.5 text-xs font-bold text-white whitespace-nowrap">
                        {t("subscription.currentPlanBadge", { defaultValue: "Current plan" })}
                      </div>
                    )}
                    {!isPlus && (
                      <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-0.5 text-[10px] font-bold text-white whitespace-nowrap">
                        {t("subscription.mostPopular", { defaultValue: "Most popular" })}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-indigo-500" />
                      <span className="text-base font-bold text-text-main">Holora Plus</span>
                    </div>
                    <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                      299,000 ₫ <span className="text-sm font-normal text-text-dim">/ {t("subscription.month", { defaultValue: "month" })}</span>
                    </div>
                    <ul className="flex-1 space-y-2 text-sm text-text-dim">
                      <li>✅ {t("subscription.unlimitedBranches", { defaultValue: "Unlimited branches" })}</li>
                      <li>✅ {t("subscription.unlimitedDoctors", { defaultValue: "Unlimited doctors" })}</li>
                      <li>✅ {t("subscription.appointmentMgmt", { defaultValue: "Appointment management" })}</li>
                      <li>✅ {t("subscription.patientRecords", { defaultValue: "Patient records" })}</li>
                      <li>✅ {t("subscription.reportsAnalytics", { defaultValue: "Reports & analytics" })}</li>
                      <li>✅ {t("subscription.prioritySupport", { defaultValue: "Priority support 24/7" })}</li>
                    </ul>
                    {!isPlus && (
                      <button
                        type="button"
                        onClick={() => switchPlan("HOLORA_PLUS")}
                        disabled={upgrading}
                        className="mt-auto w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {upgrading
                          ? t("subscription.processing", { defaultValue: "Processing..." })
                          : t("subscription.upgradeNow", { defaultValue: "Upgrade now" })}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ Billing History tab ═══════ */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-main">
              {t("subscription.billingHistory", { defaultValue: "Billing History" })}
            </h2>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh", { defaultValue: "Refresh" })}
            </button>
          </div>

          {loading ? (
            <>
              {/* Desktop skeleton */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-border-main bg-bg-surface dark:bg-slate-800">
                <table className="w-full">
                  <tbody>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} i={i} />)}</tbody>
                </table>
              </div>
              {/* Mobile skeleton */}
              <div className="md:hidden space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} i={i} />)}
              </div>
            </>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-main bg-bg-surface py-16 dark:bg-slate-800">
              <Receipt className="h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-text-dim">
                {t("subscription.noPayments", { defaultValue: "No payment history yet" })}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-border-main bg-bg-surface dark:bg-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-main bg-slate-50 dark:bg-slate-800/80">
                      {[
                        t("subscription.invoice", { defaultValue: "Invoice" }),
                        t("subscription.planName", { defaultValue: "Plan" }),
                        t("subscription.amount", { defaultValue: "Amount" }),
                        t("subscription.paymentMethod", { defaultValue: "Method" }),
                        t("subscription.status", { defaultValue: "Status" }),
                        t("subscription.date", { defaultValue: "Date" }),
                        "",
                      ].map((h, i) => (
                        <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                          {p.invoice_number || `#${p.id}`}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-text-main">{p.plan_name || p.plan_code}</td>
                        <td className="px-4 py-3.5 font-semibold text-text-main">{formatVND(p.amount_cents)}</td>
                        <td className="px-4 py-3.5 text-text-dim">{METHOD_LABEL[p.payment_method] || p.payment_method}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_BADGE[p.status] || ""}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-text-dim">{formatDate(p.paid_at || p.created_at)}</td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setInvoiceOrder(p)}
                            className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {t("common.view", { defaultValue: "View" })}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-border-main bg-bg-surface p-4 dark:bg-slate-800"
                    onClick={() => setInvoiceOrder(p)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{p.invoice_number || `#${p.id}`}</p>
                        <p className="mt-1 text-sm font-semibold text-text-main">{p.plan_name || p.plan_code}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_BADGE[p.status] || ""}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="font-bold text-text-main">{formatVND(p.amount_cents)}</span>
                      <span className="text-text-dim">{METHOD_LABEL[p.payment_method] || p.payment_method}</span>
                    </div>
                    <div className="mt-2 text-xs text-text-dim">{formatDate(p.paid_at || p.created_at)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showPaymentModal && (
        <PaymentModal
          plan={PLUS_PLAN}
          months={1}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      <ConfirmModal
        isOpen={confirmDowngradeOpen}
        title={t("subscription.confirmDowngradeTitle", { defaultValue: "Downgrade to Holora Free?" })}
        description={t("subscription.confirmDowngradeDesc", { defaultValue: "The limit of 3 branches and 3 doctors per branch will apply immediately after switching." })}
        badgeLabel="Subscription"
        tone="danger"
        confirmLabel={t("subscription.confirmDowngrade", { defaultValue: "Confirm downgrade" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        closeLabel={t("common.close", { defaultValue: "Close" })}
        onConfirm={confirmDowngrade}
        onClose={() => setConfirmDowngradeOpen(false)}
      />

      <InvoiceModal
        order={invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        t={t}
      />
    </div>
  );
};

export default SubscriptionPage;
