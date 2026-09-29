import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Layouts
import MainLayout from "../components/layout/MainLayout";
import AdminLayout from "../components/layout/AdminLayout";
import PatientLayout from "../components/layout/PatientLayout";
import DoctorLayout from "../components/layout/DoctorLayout";
import ClinicOwnerLayout from "../components/layout/ClinicOwnerLayout";

// Public Pages
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PricingPage from "../pages/PricingPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import DoctorInviteSetupPage from "../pages/DoctorInviteSetupPage";

// Main Layout Pages (used in multiple zones)
import AppointmentPage from "../pages/AppointmentPage";
import DoctorsPage from "../pages/DoctorsPage";
import PatientConsultationHistoryPage from "../pages/PatientConsultationHistoryPage";
import VideoConsultationPage from "../pages/VideoConsultationPage";
import PatientProfilePage from "../pages/PatientProfilePage";
import PatientBranchesPage from "../pages/PatientBranchesPage";
import PatientBranchDetailPage from "../pages/PatientBranchDetailPage";
import DoctorPublicDetailPage from "../pages/DoctorPublicDetailPage";
import HoloraMindPage from "../pages/HoloraMindPage";

// Patient Zone Pages
import PatientDashboardPage from "../pages/patient/PatientDashboardPage";

// Doctor Zone Pages
import DoctorDashboardPage from "../pages/doctor/DoctorDashboardPage";
import DoctorConsultationDetailPage from "../pages/DoctorConsultationDetailPage";
import DoctorRequestsListPage from "../pages/DoctorRequestsListPage";
import DoctorAppointmentsPage from "../pages/DoctorAppointmentsPage";
import PatientConsultationRequestPage from "../pages/PatientConsultationRequestPage";

// Admin Zone Pages
import DashboardPage from "../pages/admin/DashboardPage";
import UsersPage from "../pages/admin/UsersPage";
import UserFormPage from "../pages/admin/UserFormPage";
import RolesPage from "../pages/admin/RolesPage";
import RoleFormPage from "../pages/admin/RoleFormPage";
import RoleDetailPage from "../pages/admin/RoleDetailPage";
import PermissionsPage from "../pages/admin/PermissionsPage";
import PermissionFormPage from "../pages/admin/PermissionFormPage";
import PatientsPage from "../pages/admin/PatientsPage";
import PatientFormPage from "../pages/admin/PatientFormPage";
import AdminDoctorsPage from "../pages/admin/DoctorsPage";
import DoctorFormPage from "../pages/admin/DoctorFormPage";
import SpecialtiesPage from "../pages/admin/SpecialtiesPage";
import SpecialtyFormPage from "../pages/admin/SpecialtyFormPage";
import BranchesPage from "../pages/admin/BranchesPage";
import BranchFormPage from "../pages/admin/BranchFormPage";
import AppointmentsAdminPage from "../pages/admin/AppointmentsAdminPage";
import DoctorSchedulePage from "../pages/admin/DoctorSchedulePage";
import ConsultationsPage from "../pages/admin/ConsultationsPage";

// Clinic Owner Zone Pages
import ClinicOwnerDashboardPage from "../pages/clinic-owner/ClinicOwnerDashboardPage";
import MyBranchesPage from "../pages/clinic-owner/MyBranchesPage";
import MyDoctorsPage from "../pages/clinic-owner/MyDoctorsPage";
import SubscriptionPage from "../pages/clinic-owner/SubscriptionPage";

// Route Guards
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import PatientRoute from "./PatientRoute";
import DoctorRoute from "./DoctorRoute";
import ClinicOwnerRoute from "./ClinicOwnerRoute";

// Role-based home redirect
const HomeRedirect = () => {
  const { user, role } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (role) {
    case "patient":
      return <Navigate to="/patient" replace />;
    case "doctor":
      return <Navigate to="/doctor" replace />;
    case "clinic_owner":
      return <Navigate to="/clinic-owner" replace />;
    case "admin":
    case "super_admin":
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};


const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PUBLIC ZONE - No authentication required */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Route
          path="/"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />

        <Route path="/home-redirect" element={<HomeRedirect />} />

        <Route
          path="/pricing"
          element={
            <MainLayout>
              <PricingPage />
            </MainLayout>
          }
        />

        <Route
          path="/login"
          element={
            <MainLayout>
              <LoginPage />
            </MainLayout>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <MainLayout>
              <ForgotPasswordPage />
            </MainLayout>
          }
        />

        <Route
          path="/reset-password"
          element={
            <MainLayout>
              <ResetPasswordPage />
            </MainLayout>
          }
        />

        <Route
          path="/register"
          element={
            <MainLayout>
              <RegisterPage />
            </MainLayout>
          }
        />

        <Route
          path="/register/provider"
          element={
            <MainLayout>
              <RegisterPage defaultAccountType="provider" />
            </MainLayout>
          }
        />

        <Route
          path="/doctor/invite-setup"
          element={
            <MainLayout>
              <DoctorInviteSetupPage />
            </MainLayout>
          }
        />

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PATIENT ZONE - Only patient role */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Route
          path="/patient"
          element={
            <PatientRoute>
              <PatientLayout>
                <PatientDashboardPage />
              </PatientLayout>
            </PatientRoute>
          }
        />

        <Route
          path="/patient/branches"
          element={
            <PatientRoute>
              <PatientLayout>
                <PatientBranchesPage />
              </PatientLayout>
            </PatientRoute>
          }
        />

        <Route
          path="/patient/branches/:id"
          element={
            <PatientRoute>
              <PatientLayout>
                <PatientBranchDetailPage />
              </PatientLayout>
            </PatientRoute>
          }
        />

        <Route
          path="/patient/doctors"
          element={
            <PatientRoute>
              <PatientLayout>
                <DoctorsPage />
              </PatientLayout>
            </PatientRoute>
          }
        />

        <Route
          path="/patient/doctors/:id"
          element={
            <PatientRoute>
              <PatientLayout>
                <DoctorPublicDetailPage />
              </PatientLayout>
            </PatientRoute>
          }
        />

        <Route
          path="/patient/appointments"
          element={
            <PatientRoute>
              <PatientLayout>
                <AppointmentPage />
              </PatientLayout>
            </PatientRoute>
          }
        />

        <Route
          path="/patient/consultations"
          element={
            <PatientRoute>
              <PatientLayout>
                <PatientConsultationHistoryPage />
              </PatientLayout>
            </PatientRoute>
          }
        />

        <Route
          path="/patient/consultations/new"
          element={
            <PatientRoute>
              <PatientLayout>
                <PatientConsultationRequestPage />
              </PatientLayout>
            </PatientRoute>
          }
        />

        <Route
          path="/patient/holoramind"
          element={
            <PatientRoute>
              <HoloraMindPage />
            </PatientRoute>
          }
        />

        <Route
          path="/patient/profile"
          element={
            <PatientRoute>
              <PatientLayout>
                <PatientProfilePage />
              </PatientLayout>
            </PatientRoute>
          }
        />

        <Route
          path="/patient/appointments/:id/room"
          element={
            <PatientRoute>
              <VideoConsultationPage />
            </PatientRoute>
          }
        />

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* DOCTOR ZONE - Only doctor role */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Route
          path="/doctor"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorDashboardPage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />

        <Route
          path="/doctor/appointments"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorAppointmentsPage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />

        <Route
          path="/doctor/consultations"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorRequestsListPage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />

        <Route
          path="/doctor/consultations/:id"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorConsultationDetailPage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />

        <Route
          path="/doctor/schedule"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorSchedulePage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />

        <Route
          path="/doctor/profile"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <PatientProfilePage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* CLINIC OWNER ZONE - Only clinic_owner role */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Route
          path="/clinic-owner"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <ClinicOwnerDashboardPage />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/branches"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <MyBranchesPage />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/branches/new"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <BranchFormPage returnPath="/clinic-owner/branches" />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/branches/:branchId/edit"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <BranchFormPage returnPath="/clinic-owner/branches" />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/doctors"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <MyDoctorsPage />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/doctors/new"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <DoctorFormPage
                  returnPath="/clinic-owner/doctors"
                  fetchBranchesUrl="/branches/my"
                />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/doctors/:doctorId/edit"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <DoctorFormPage
                  returnPath="/clinic-owner/doctors"
                  fetchBranchesUrl="/branches/my"
                />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/subscription"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <SubscriptionPage />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ADMIN ZONE - admin & super_admin roles */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <Route
          path="/admin"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <DashboardPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <UsersPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <UserFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users/:userId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <UserFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/roles"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <RolesPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/roles/:roleId"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <RoleDetailPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/roles/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <RoleFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/roles/:roleId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <RoleFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/permissions"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PermissionsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/permissions/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PermissionFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/permissions/:permissionId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PermissionFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/doctors"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <AdminDoctorsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/doctors/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <DoctorFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/doctors/:doctorId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <DoctorFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/patients"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PatientsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/patients/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PatientFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/patients/:patientId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PatientFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/specialties"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <SpecialtiesPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/specialties/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <SpecialtyFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/specialties/:specialtyId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <SpecialtyFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/branches"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <BranchesPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/branches/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <BranchFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/branches/:branchId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <BranchFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <AppointmentsAdminPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/schedules"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <DoctorSchedulePage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/consultations"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <ConsultationsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        {/* Fallback - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
