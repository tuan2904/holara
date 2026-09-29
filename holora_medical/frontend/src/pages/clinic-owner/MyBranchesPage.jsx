import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import branchService from "../../services/branchService";
import subscriptionService from "../../services/subscriptionService";

const MyBranchesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [accountSub, setAccountSub] = useState(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [branchRes, subData] = await Promise.all([
        branchService.getMyBranches(),
        subscriptionService.getMySubscriptions().catch(() => []),
      ]);
      setBranches(branchRes.data || []);
      const subs = Array.isArray(subData) ? subData : (subData?.data ?? []);
      const activeSub = subs
        .filter((s) => s.scope_type === "account" && s.status === "active")
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0] || null;
      setAccountSub(activeSub);
    } catch (err) {
      setError(err?.response?.data?.message || t("branch.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleDelete = async (id) => {
    try {
      setError("");
      setSuccess("");
      await branchService.deleteBranch(id);
      setSuccess(t("branch.deleteSuccess"));
      setShowDeleteConfirm(null);
      fetchBranches();
    } catch (err) {
      setError(err?.response?.data?.message || t("branch.deleteError"));
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            {t("clinicOwner.myBranches") || "My Branches"}
          </h1>
          <p className="text-text-dim text-sm mt-1">
            {t("clinicOwner.myBranchesSubtitle") || "Manage your clinic branches"}
          </p>
        </div>
        <button
          onClick={() => navigate("/clinic-owner/branches/new")}
          className="bg-[#E06666] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#D55555] transition shadow-sm"
        >
          + {t("branch.addTitle") || "Add Branch"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Subscription plan status */}
      {(() => {
        const planCode    = accountSub?.plan_code || "HOLORA_FREE";
        const isPlus      = planCode === "HOLORA_PLUS";
        const branchLimit = isPlus ? null : 3;
        const used        = branches.length;
        const pct         = branchLimit ? Math.min(100, Math.round((used / branchLimit) * 100)) : 0;
        const nearLimit   = branchLimit && used >= branchLimit;
        return (
          <div className={`mb-4 rounded-xl border p-4 flex flex-wrap items-center gap-4 ${isPlus ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"}`}>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${isPlus ? "bg-purple-600 text-white" : "bg-blue-500 text-white"}`}>
              {isPlus ? "✦ HOLORA PLUS" : "HOLORA FREE"}
            </span>
            <div className="flex-1 min-w-[180px]">
              <div className="flex justify-between text-xs text-text-dim mb-1">
                <span>Chi nhánh đã dùng</span>
                <span className="font-semibold text-text-main">{used}{branchLimit ? ` / ${branchLimit}` : " (không giới hạn)"}</span>
              </div>
              {branchLimit && (
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${nearLimit ? "bg-red-500" : "bg-blue-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
            {!isPlus && (
              <a href="/clinic-owner/subscription"
                className="text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60 px-3 py-1.5 rounded-lg transition">
                Nâng cấp PLUS →
              </a>
            )}
            {isPlus && accountSub?.end_date && (
              <span className="text-xs text-purple-600 dark:text-purple-400">
                Hết hạn: {new Date(accountSub.end_date).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>
        );
      })()}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#E06666]"></div>
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-bg-surface dark:bg-slate-800 rounded-xl shadow-sm border border-border-main p-12 text-center">
          <div className="text-5xl mb-4">🏥</div>
          <h3 className="text-lg font-semibold text-text-main mb-2">
            {t("clinicOwner.noBranches") || "No branches yet"}
          </h3>
          <p className="text-text-dim text-sm mb-6">
            {t("clinicOwner.noBranchesHint") || "Create your first branch to start managing doctors."}
          </p>
          <Link
            to="/clinic-owner/branches/new"
            className="bg-[#E06666] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#D55555] transition"
          >
            + {t("branch.addTitle") || "Add Branch"}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-bg-surface dark:bg-slate-800 rounded-xl shadow-sm border border-border-main p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-text-main text-base">{branch.name}</h3>
                  <span className="inline-block mt-1 text-xs bg-gray-100 dark:bg-slate-700 text-text-dim px-2 py-0.5 rounded font-mono">
                    {branch.code}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    branch.status === "active"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {branch.status}
                </span>
              </div>

              {branch.address && (
                <p className="text-sm text-text-dim flex items-start gap-1">
                  <span>📍</span> {branch.address}{branch.city ? `, ${branch.city}` : ""}
                </p>
              )}

              {branch.phone && (
                <p className="text-sm text-text-dim flex items-center gap-1">
                  <span>📞</span> {branch.phone}
                </p>
              )}

              <div className="text-xs text-text-dim flex items-center gap-1">
                <span>👨‍⚕️</span>
                {branch.doctor_count != null
                  ? `${branch.doctor_count} doctor${branch.doctor_count !== 1 ? "s" : ""}`
                  : ""}
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-border-main">
                <button
                  onClick={() => navigate(`/clinic-owner/branches/${branch.id}/edit`)}
                  className="flex-1 border border-[#E06666] text-[#E06666] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#FFF5F5] dark:hover:bg-slate-700 transition"
                >
                  {t("common.edit") || "Edit"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(branch.id)}
                  className="flex-1 border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  {t("common.delete") || "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-surface dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-border-main">
            <h3 className="text-lg font-semibold text-text-main mb-2">
              {t("branch.confirmDeleteTitle") || "Delete Branch?"}
            </h3>
            <p className="text-sm text-text-dim mb-6">
              {t("branch.confirmDeleteText") || "This action cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 border border-border-main px-4 py-2 rounded-lg text-sm text-text-main hover:bg-bg-app dark:hover:bg-slate-700 transition"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
              >
                {t("common.delete") || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBranchesPage;
