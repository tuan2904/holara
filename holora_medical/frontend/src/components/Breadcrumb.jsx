import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Map of route segments to display names
  const routeNames = {
    patient: "Patient Zone",
    doctor: "Doctor Zone",
    admin: "Admin Panel",
    "clinic-owner": "Clinic Owner",
    branches: "Branches",
    doctors: "Doctors",
    appointments: "Appointments",
    consultations: "Consultations",
    profile: "Profile",
    holoramind: "AI Assistant",
    schedule: "Schedule",
    "my-branches": "My Branches",
    "my-doctors": "My Doctors",
    subscription: "Subscription",
    users: "Users",
    roles: "Roles",
    permissions: "Permissions",
    specialties: "Specialties",
    patients: "Patients",
    schedules: "Schedules",
    receptionist: "Receptionist",
    accountant: "Accountant",
  };

  // Don't show breadcrumb on home pages
  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === "")) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 px-6 py-3 bg-bg-surface dark:bg-slate-800 border-b border-border-main text-sm">
      <Link to="/" className="flex items-center gap-1 text-text-dim hover:text-[#E06666] transition">
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Home</span>
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
