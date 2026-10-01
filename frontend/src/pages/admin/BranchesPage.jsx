import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import branchService from "../../services/branchService";

const BranchesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await branchService.getAllBranches();
      setBranches(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t("branch.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const filteredBranches = branches.filter((branch) => {
    const keyword = searchTerm.toLowerCase();
    return (
      branch.name?.toLowerCase().includes(keyword) ||
      branch.code?.toLowerCase().includes(keyword) ||
      branch.city?.toLowerCase().includes(keyword)
    );
  });

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

  const StatusBadge = ({ status }) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        status === "active"
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
      }`}
    >
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
      {status === "active" ? t("branch.statusActive") : t("branch.statusInactive")}
    </span>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main sm:text-3xl">
            {t("branch.managementTitle")}
          </h1>
          <p className="text-text-dim mt-1 text-sm">{t("branch.managementSubtitle")}</p>
        </div>
        <button
          onClick={() => navigate("/admin/branches/new")}
          className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#E06666] text-white rounded-xl hover:bg-[#D55555] active:bg-[#C44444] transition-colors font-medium text-sm shadow-sm whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          {t("branch.addNew")}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={t("branch.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-border-main bg-bg-surface dark:bg-slate-800 text-text-main rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E06666] placeholder-text-dim text-sm"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center bg-bg-surface dark:bg-slate-800 rounded-2xl border border-border-main">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#E06666] mx-auto mb-4" />
          <p className="text-text-dim text-sm">{t("common.loading")}...</p>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="py-16 text-center bg-bg-surface dark:bg-slate-800 rounded-2xl border border-border-main">
          <div className="text-5xl mb-4">🏥</div>
          <p className="text-text-dim font-medium">{t("branch.noBranches")}</p>
          {searchTerm && (
            <p className="text-text-dim text-sm mt-1">{t("common.tryDifferentSearch", { defaultValue: "Try a different keyword." })}</p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card List — visible on < md */}
          <div className="md:hidden space-y-3">
            {filteredBranches.map((branch) => (
              <div
                key={branch.id}
                className="bg-bg-surface dark:bg-slate-800 rounded-2xl border border-border-main p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-main truncate">{branch.name}</p>
                    <code className="mt-1 inline-block bg-bg-app dark:bg-slate-900 text-text-dim px-2 py-0.5 rounded text-xs font-mono">
                      {branch.code}
                    </code>
                  </div>
                  <StatusBadge status={branch.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-dim">
                  {branch.city && (
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{branch.city}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="truncate">{branch.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/branches/${branch.id}/edit`)}
                    className="flex-1 py-2 text-xs font-medium rounded-lg bg-[#E06666] text-white hover:bg-[#D55555] active:bg-[#C44444] transition-colors"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(branch.id)}
                    className="flex-1 py-2 text-xs font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-700 dark:text-red-400 transition-colors"
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table — visible on md+ */}
          <div className="hidden md:block bg-bg-surface dark:bg-slate-800 rounded-2xl shadow-sm border border-border-main overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-app dark:bg-slate-900 border-b border-border-main">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("branch.name")}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("branch.code")}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("branch.city")}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("branch.phone")}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("branch.status")}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {filteredBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-bg-app dark:hover:bg-slate-700/50 transition group">
                    <td className="px-6 py-4 font-medium text-text-main">{branch.name}</td>
                    <td className="px-6 py-4 text-text-dim">
                      <code className="bg-bg-app dark:bg-slate-900 px-2.5 py-1 rounded text-xs font-mono">{branch.code}</code>
                    </td>
                    <td className="px-6 py-4 text-text-dim">{branch.city || "-"}</td>
                    <td className="px-6 py-4 text-text-dim">{branch.phone || "-"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={branch.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/admin/branches/${branch.id}/edit`)}
                          className="px-3 py-1.5 bg-[#E06666] text-white rounded-lg hover:bg-[#D55555] transition-colors text-xs font-medium"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(branch.id)}
                          className="px-3 py-1.5 border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs font-medium"
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-bg-surface dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm border border-border-main p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-1 8a1 1 0 012 0v3a1 1 0 11-2 0v-3zm5-1a1 1 0 00-1 1v3a1 1 0 002 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-text-main">{t("branch.confirmDelete")}</h3>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-border-main text-text-main rounded-xl hover:bg-bg-app dark:hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchesPage;
