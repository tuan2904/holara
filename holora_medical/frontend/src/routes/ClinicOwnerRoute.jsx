import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ALLOWED_ROLES = ["clinic_owner", "super_admin", "admin"];

const ClinicOwnerRoute = ({ children }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ClinicOwnerRoute;
