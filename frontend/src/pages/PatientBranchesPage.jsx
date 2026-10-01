import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, Calendar, ChevronLeft, ChevronRight, LocateFixed, Mail, MapPin, Phone, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import branchService from "../services/branchService";

const PAGE_SIZE = 9;

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

const scoreBranch = (branch, searchText, areaFilter) => {
  const city = normalizeText(branch.city);
  const name = normalizeText(branch.name);
  const address = normalizeText(branch.address);
  const description = normalizeText(branch.description);
  const query = normalizeText(searchText);
  const area = normalizeText(areaFilter);

  let score = 0;

  if (area && city === area) score += 50;
  if (!query) return score;

  const queryParts = query.split(/\s+/).filter(Boolean);

  queryParts.forEach((part) => {
    if (city === part) score += 80;
    else if (city.startsWith(part)) score += 45;
    else if (city.includes(part)) score += 30;

    if (name.includes(part)) score += 35;
    if (address.includes(part)) score += 20;
    if (description.includes(part)) score += 8;
  });

  return score;
};

const PatientBranchesPage = () => {
  const { t } = useTranslation();
  const [branches, setBranches] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [sortBy, setSortBy] = useState("smart");
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [detectedCity, setDetectedCity] = useState("");
  const [locationError, setLocationError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBranches = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await branchService.getAllBranches();
        const list = asArray(response).filter((item) => item.status !== "inactive");
        setBranches(list);
      } catch (err) {
        console.error("Failed to load branches", err);
        setError(t("publicBranches.error"));
      } finally {
        setIsLoading(false);
      }
    };

    loadBranches();
  }, [t]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, areaFilter, sortBy]);

  const areas = useMemo(() => {
    const unique = Array.from(
      new Set(
        branches
          .map((branch) => branch.city)
          .filter(Boolean)
          .map((city) => city.trim())
      )
    );
    return unique.sort((a, b) => a.localeCompare(b, "vi"));
  }, [branches]);

  const suggestedAreas = useMemo(() => areas.slice(0, 5), [areas]);

  const smartSuggestions = useMemo(() => {
    const query = normalizeText(searchText);
    if (!query) return [];

    const fromCities = areas.filter((city) => normalizeText(city).includes(query));
    const fromBranches = branches
      .map((branch) => branch.name)
      .filter(Boolean)
      .filter((name) => normalizeText(name).includes(query));

    return Array.from(new Set([...fromCities, ...fromBranches])).slice(0, 6);
  }, [areas, branches, searchText]);

  const visibleBranches = useMemo(() => {
    const listWithScore = branches.map((branch) => ({
      ...branch,
      _score: scoreBranch(branch, searchText, areaFilter),
    }));

    const filtered = listWithScore.filter((branch) => {
      if (areaFilter && normalizeText(branch.city) !== normalizeText(areaFilter)) {
        return false;
      }

      if (!searchText.trim()) return true;
      return branch._score > 0;
    });

    if (sortBy === "city") {
      return filtered.sort((a, b) => (a.city || "").localeCompare(b.city || "", "vi"));
    }

    if (sortBy === "name") {
      return filtered.sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi"));
    }

    return filtered.sort((a, b) => b._score - a._score || (a.name || "").localeCompare(b.name || "", "vi"));
  }, [branches, searchText, areaFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(visibleBranches.length / PAGE_SIZE));

  const pagedBranches = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visibleBranches.slice(start, start + PAGE_SIZE);
  }, [visibleBranches, currentPage]);

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError(t("publicBranches.errors.locationNotSupported"));
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          const payload = await response.json();
          const city =
            payload?.address?.city ||
            payload?.address?.province ||
            payload?.address?.state ||
            payload?.address?.county ||
            "";

          if (!city) {
            setLocationError(t("publicBranches.errors.cityNotDetected"));
            return;
          }

          setDetectedCity(city);
          setAreaFilter(city);
        } catch (err) {
          console.error("Reverse geocode failed", err);
          setLocationError(t("publicBranches.errors.locationFailed"));
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setLocationError(t("publicBranches.errors.locationDenied"));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-[#F7F9FC] text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#E06666]/10 blur-3xl dark:bg-[#E06666]/10" />
        <div className="absolute bottom-[-100px] right-[-120px] h-[260px] w-[260px] rounded-full bg-[#BFD8FF]/25 blur-3xl dark:bg-[#24324A]/35" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#0F2748] via-[#123A68] to-[#114E86] px-6 py-8 text-white shadow-[0_22px_45px_rgba(17,53,95,0.28)] sm:px-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
            <Sparkles size={14} />
            {t("publicBranches.hero.badge")}
          </p>
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">{t("publicBranches.hero.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
            {t("publicBranches.hero.description")}
          </p>

          <div className="mt-6 rounded-2xl border border-white/20 bg-white p-3 text-gray-900 shadow-lg backdrop-blur">
            <div className="grid gap-2 md:grid-cols-[1.5fr_1fr_0.8fr]">
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <Search size={16} className="text-gray-500" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={t("publicBranches.search.placeholder")}
                  className="w-full border-none bg-transparent text-sm focus:outline-none"
                />
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <MapPin size={16} className="text-gray-500" />
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="w-full border-none bg-transparent text-sm focus:outline-none"
                >
                  <option value="">{t("publicBranches.search.allAreas")}</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <SlidersHorizontal size={16} className="text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border-none bg-transparent text-sm focus:outline-none"
                >
                  <option value="smart">{t("publicBranches.search.sortSmart")}</option>
                  <option value="city">{t("publicBranches.search.sortCity")}</option>
                  <option value="name">{t("publicBranches.search.sortName")}</option>
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#E06666]/40 hover:text-[#B64949] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <LocateFixed size={14} />
                {isLocating ? t("publicBranches.search.locating") : t("publicBranches.search.locateMe")}
              </button>
              {detectedCity && (
                <span className="rounded-full bg-[#EAF4FF] px-3 py-1.5 text-xs font-semibold text-[#2B6298]">
                  {t("publicBranches.search.nearYou", { city: detectedCity })}
                </span>
              )}
            </div>

            {locationError && <p className="mt-2 text-xs text-red-600">{locationError}</p>}

            {smartSuggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {smartSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSearchText(item)}
                    className="rounded-full border border-[#E06666]/30 bg-[#FFF5F5] px-3 py-1 text-xs font-medium text-[#B64949] transition hover:bg-[#FFECEB]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {suggestedAreas.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-[#141B29]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-slate-400">{t("publicBranches.popularAreas")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedAreas.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setAreaFilter(city)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    areaFilter === city
                      ? "bg-[#E06666] text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-600 dark:bg-[#111827] dark:text-slate-300"
                  }`}
                >
                  {city}
                </button>
              ))}
              {areaFilter && (
                <button
                  type="button"
                  onClick={() => setAreaFilter("")}
                  className="rounded-full border border-transparent bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200"
                >
                  {t("publicBranches.clearFilter")}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-[#141B29]"
                >
                  <div className="h-4 w-16 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="mt-4 h-5 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="mt-5 h-4 w-full rounded bg-gray-100 dark:bg-slate-800" />
                  <div className="mt-2 h-4 w-5/6 rounded bg-gray-100 dark:bg-slate-800" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-gray-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          ) : visibleBranches.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-[#141B29]">
              <h2 className="text-lg font-semibold">{t("publicBranches.empty.title")}</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{t("publicBranches.empty.description")}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p
                  className="text-sm text-gray-600 dark:text-slate-400"
                  dangerouslySetInnerHTML={{ __html: t("publicBranches.results", { count: visibleBranches.length }) }}
                />
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  {t("publicBranches.page", { current: currentPage, total: totalPages })}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pagedBranches.map((branch) => (
                <article
                  key={branch.id}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#E06666]/35 hover:shadow-lg dark:border-slate-700 dark:bg-[#141B29]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="inline-flex items-center gap-1 rounded-full bg-[#FFF2F2] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#BC4D4D] dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
                        <Building2 size={13} />
                        {t("publicBranches.card.branchBadge")}
                      </p>
                      <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-slate-100">{branch.name}</h3>
                    </div>
                    <span className="rounded-lg bg-[#EAF4FF] px-2 py-1 text-xs font-medium text-[#2B6298] dark:bg-[#1D2C43] dark:text-[#9BC0EB]">
                      {branch.city || "N/A"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-slate-300">
                    <p className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-[#B64949]" />
                      <span className="line-clamp-2">{branch.address || t("publicBranches.card.addressFallback")}</span>
                    </p>
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
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-500 dark:text-slate-400">{branch.description}</p>
                  )}

                  <div className="mt-4">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/patient/appointments?branchId=${branch.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#E06666] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#D55555]"
                      >
                        <Calendar size={16} />
                        {t("publicBranches.card.bookAppointment", { defaultValue: "Đặt lịch" })}
                      </Link>
                      <Link
                        to={`/branches/${branch.id}`}
                        className="inline-flex items-center rounded-xl border border-[#E06666]/30 bg-[#FFF5F5] px-3 py-2 text-sm font-semibold text-[#B64949] transition hover:bg-[#FFECEB]"
                      >
                        {t("publicBranches.card.viewDetail")}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-[#E06666]/35 hover:text-[#B64949] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-[#111827] dark:text-slate-300"
                  >
                    <ChevronLeft size={16} />
                    {t("publicBranches.pagination.prev")}
                  </button>

                  {Array.from({ length: totalPages }).map((_, index) => {
                    const page = index + 1;
                    const active = page === currentPage;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                          active
                            ? "bg-[#E06666] text-white"
                            : "border border-gray-200 bg-white text-gray-700 hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-600 dark:bg-[#111827] dark:text-slate-300"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-[#E06666]/35 hover:text-[#B64949] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-[#111827] dark:text-slate-300"
                  >
                    {t("publicBranches.pagination.next")}
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientBranchesPage;
