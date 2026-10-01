import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DoctorRoute = ({ children }) => {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole("doctor")) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default DoctorRoute;
