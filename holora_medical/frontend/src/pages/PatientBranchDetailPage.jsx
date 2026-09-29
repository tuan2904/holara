import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Mail, MapPin, Phone } from "lucide-react";
import branchService from "../services/branchService";

const unwrap = (payload) => payload?.data || payload;

const PatientBranchDetailPage = () => {
  const { id } = useParams();

  const [branch, setBranch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDetail = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await branchService.getBranchById(id);
        setBranch(unwrap(response));
      } catch (err) {
        console.error("Failed to load branch detail", err);
        setError("Khong the tai chi tiet chi nhanh. Vui long thu lai.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-[#F7F9FC] text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#E06666]/10 blur-3xl dark:bg-[#E06666]/10" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/branches"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-200"
        >
          <ArrowLeft size={16} />
          Quay lai danh sach
        </Link>

        {isLoading ? (
          <div className="mt-6 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-[#141B29]">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-700" />
            <div className="mt-4 h-6 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
            <div className="mt-6 h-4 w-full rounded bg-gray-100 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-5/6 rounded bg-gray-100 dark:bg-slate-800" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : !branch ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-300">
            Khong tim thay chi nhanh.
          </div>
        ) : (
          <article className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#141B29]">
            <p className="inline-flex items-center gap-1 rounded-full bg-[#FFF2F2] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#BC4D4D] dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
              <Building2 size={13} />
              Branch Detail
            </p>

            <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">{branch.name || "Chi nhanh"}</h1>

            <div className="mt-6 space-y-3 text-sm text-gray-700 dark:text-slate-300">
              <p className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#B64949]" />
                <span>{branch.address || "Dang cap nhat dia chi"}</span>
              </p>

              {branch.city && (
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[#2B6298]" />
                  <span>Khu vuc: {branch.city}</span>
                </p>
              )}

              {branch.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={15} className="shrink-0 text-[#B64949]" />
                  <span>{branch.phone}</span>
                </p>
              )}

              {branch.email && (
                <p className="flex items-center gap-2 break-all">
                  <Mail size={15} className="shrink-0 text-[#B64949]" />
                  <span>{branch.email}</span>
                </p>
              )}
            </div>

            {branch.description && (
              <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-700 dark:bg-[#111827] dark:text-slate-300">
                {branch.description}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`/patient/appointments?branchId=${id}`}
                className="inline-flex items-center rounded-xl bg-[#E06666] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D55555]"
              >
                Dat lich kham
              </Link>
              <Link
                to="/branches"
                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-200"
              >
                Xem branch khac
              </Link>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

export default PatientBranchDetailPage;
