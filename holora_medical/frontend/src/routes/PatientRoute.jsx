import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PatientRoute = ({ children }) => {
  const { isAuthenticated, role, user } = useAuth();

  console.log("PatientRoute - isAuthenticated:", isAuthenticated);
  console.log("PatientRoute - role:", role);
  console.log("PatientRoute - user:", user);

  if (!isAuthenticated) {
    console.log("PatientRoute: Redirecting to /login - not authenticated");
    return <Navigate to="/login" replace />;
  }

  if (role !== "patient") {
    console.log("PatientRoute: Redirecting to / - user role is not 'patient', role is:", role);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PatientRoute;
