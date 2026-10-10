import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation } from "react-i18next";

const Breadcrumb = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Map of route segments to display names
  const routeNames = {
    patient: t("breadcrumb.patient"),
    doctor: t("breadcrumb.doctor"),
    admin: t("breadcrumb.admin"),
    "clinic-owner": t("breadcrumb.clinicOwner"),
    branches: t("breadcrumb.branches"),
    doctors: t("breadcrumb.doctors"),
    appointments: t("breadcrumb.appointments"),
    consultations: t("breadcrumb.consultations"),
    profile: t("breadcrumb.profile"),
    holoramind: t("breadcrumb.holoramind"),
    schedule: t("breadcrumb.schedule"),
    "my-branches": t("breadcrumb.myBranches"),
    "my-doctors": t("breadcrumb.myDoctors"),
    subscription: t("breadcrumb.subscription"),
    users: t("breadcrumb.users"),
    roles: t("breadcrumb.roles"),
    permissions: t("breadcrumb.permissions"),
    specialties: t("breadcrumb.specialties"),
    patients: t("breadcrumb.patients"),
    schedules: t("breadcrumb.schedules"),
    receptionist: t("breadcrumb.receptionist"),
    accountant: t("breadcrumb.accountant"),
    new: t("breadcrumb.new"),
    edit: t("breadcrumb.edit"),
    view: t("breadcrumb.view"),
    reviews: t("breadcrumb.reviews"),
    earnings: t("breadcrumb.earnings"),
    room: t("breadcrumb.room"),
    version: t("breadcrumb.version"),
    "audit-logs": t("breadcrumb.auditLogs"),
  };

  // Don't show breadcrumb on home pages
  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === "")) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 px-6 py-3 bg-bg-surface dark:bg-slate-800 border-b border-border-main text-sm">
      <Link to="/" className="flex items-center gap-1 text-text-dim hover:text-[#E06666] transition">
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">{t("breadcrumb.home")}</span>
      </Link>

      {pathnames.map((segment, index) => {
        const breadcrumbPath = `/${pathnames.slice(0, index + 1).join("/")}`;
        const displayName = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = index === pathnames.length - 1;
        const isNumberId = /^[0-9a-f]{8,}/.test(segment); // Skip IDs

        if (isNumberId) return null;

        return (
          <div key={breadcrumbPath} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-text-dim" />
            {isLast ? (
              <span className="text-text-main font-medium">{displayName}</span>
            ) : (
              <Link to={breadcrumbPath} className="text-text-dim hover:text-[#E06666] transition">
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
