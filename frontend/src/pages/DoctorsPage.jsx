import React, { useEffect, useMemo, useState } from "react";
import { BriefcaseMedical, Search, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import DoctorDirectoryCard from "../components/DoctorDirectoryCard";
import Pagination from "../components/Pagination";
import { getAllDoctorsApi } from "../services/doctorService";

const DOCTORS_PER_PAGE = 6;

const normalizeText = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const DoctorsPage = () => {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await getAllDoctorsApi();
        const list = asArray(response).filter((item) => item.status !== "deleted" && item.status !== "blocked");
        setDoctors(list);
      } catch (err) {
        console.error("Failed to load doctors", err);
        setError("publicDoctors.directory.errorLoad");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const specialties = useMemo(() => {
    const unique = Array.from(new Set(doctors.map((d) => d.specialty_name).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b, "vi"));
  }, [doctors]);

  const visibleDoctors = useMemo(() => {
    const query = normalizeText(searchText);
    return doctors.filter((doctor) => {
      if (specialtyFilter && doctor.specialty_name !== specialtyFilter) return false;
      if (!query) return true;

      const haystack = [doctor.full_name, doctor.specialty_name, doctor.branch_names, doctor.qualification]
        .map(normalizeText)
        .join(" ");

      return haystack.includes(query);
    });
  }, [doctors, searchText, specialtyFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, specialtyFilter]);

  const totalPages = Math.max(1, Math.ceil(visibleDoctors.length / DOCTORS_PER_PAGE));

  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * DOCTORS_PER_PAGE;
    return visibleDoctors.slice(startIndex, startIndex + DOCTORS_PER_PAGE);
  }, [currentPage, visibleDoctors]);

  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-[#F7F9FC] text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#E06666]/10 blur-3xl dark:bg-[#E06666]/12" />
        <div className="absolute bottom-[-120px] left-[-120px] h-[260px] w-[260px] rounded-full bg-[#BFD8FF]/25 blur-3xl dark:bg-[#24324A]/35" />
        <div className="absolute bottom-[-120px] right-[-80px] h-[240px] w-[240px] rounded-full bg-[#FFDAD4]/30 blur-3xl dark:bg-[#2E3C55]/30" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-white/60 backdrop-blur dark:bg-[#111827]/75 dark:ring-slate-700/70">
          <div className="border-b border-slate-200/70 bg-gradient-to-br from-[#10325A] via-[#14497F] to-[#0D5D8A] px-6 py-8 text-white dark:border-slate-700/60 sm:px-8 sm:py-10">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/85">
              <Sparkles size={14} />
              {t("publicDoctors.directory.badge")}
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("publicDoctors.directory.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              {t("publicDoctors.directory.description")}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/85">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                {t("publicDoctors.directory.stats.matched", { count: visibleDoctors.length })}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                {t("publicDoctors.directory.stats.specialties", { count: specialties.length })}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                {t("publicDoctors.directory.stats.perPage", { count: DOCTORS_PER_PAGE })}
              </span>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid gap-3 md:grid-cols-[1.5fr_1fr]">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-100">
                <Search size={16} className="text-gray-500" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={t("publicDoctors.directory.searchPlaceholder")}
                  className="w-full border-none bg-transparent text-sm focus:outline-none dark:placeholder:text-slate-500"
                />
              </label>

              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-100">
                <BriefcaseMedical size={16} className="text-gray-500" />
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="w-full border-none bg-transparent text-sm focus:outline-none"
                >
                  <option value="">{t("publicDoctors.directory.allSpecialties")}</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: DOCTORS_PER_PAGE }).map((_, idx) => (
                <div key={idx} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-[#141B29]">
                  <div className="h-5 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-gray-100 dark:bg-slate-800" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-gray-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
              {t(error)}
            </div>
          ) : visibleDoctors.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-[#141B29]">
              <h2 className="text-lg font-semibold">{t("publicDoctors.directory.emptyTitle")}</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{t("publicDoctors.directory.emptyDescription")}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {t("publicDoctors.directory.resultsCount", { count: visibleDoctors.length })}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-500">
                  {t("publicDoctors.directory.pageIndicator", { current: currentPage, total: totalPages })}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedDoctors.map((doctor) => (
                  <DoctorDirectoryCard key={doctor.id} doctor={doctor} />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                previousLabel={t("publicDoctors.directory.pagination.previous")}
                nextLabel={t("publicDoctors.directory.pagination.next")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorsPage;
