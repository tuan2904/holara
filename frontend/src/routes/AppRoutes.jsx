import DoctorEarningsPage from "../pages/doctor/DoctorEarningsPage";
        <Route
          path="/doctor/earnings"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorEarningsPage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RouteTitleManager from "../components/RouteTitleManager";

// Layouts
import MainLayout from "../components/layout/MainLayout";
import AdminLayout from "../components/layout/AdminLayout";
import PatientLayout from "../components/layout/PatientLayout";
import DoctorLayout from "../components/layout/DoctorLayout";
import ClinicOwnerLayout from "../components/layout/ClinicOwnerLayout";
import ReceptionistLayout from "../components/layout/ReceptionistLayout";
import AccountantLayout from "../components/layout/AccountantLayout";

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
import PatientMyDoctorsPage from "../pages/PatientMyDoctorsPage";
import PatientMyBranchesPage from "../pages/PatientMyBranchesPage";
import PatientBranchDetailPage from "../pages/PatientBranchDetailPage";
import DoctorPublicDetailPage from "../pages/DoctorPublicDetailPage";
import HoloraMindPage from "../pages/HoloraMindPage";

// Patient Zone Pages
import PatientDashboardPage from "../pages/patient/PatientDashboardPage";
import PatientConsultationDetailPage from "../pages/PatientConsultationDetailPage";
import PatientAppointmentDetailPage from "../pages/PatientAppointmentDetailPage";

// Doctor Zone Pages
import DoctorDashboardPage from "../pages/doctor/DoctorDashboardPage";
import DoctorConsultationDetailPage from "../pages/DoctorConsultationDetailPage";
import DoctorConsultationHistoryPage from "../pages/DoctorConsultationHistoryPage";
import DoctorAppointmentsPage from "../pages/DoctorAppointmentsPage";
import DoctorAppointmentDetailPage from "../pages/DoctorAppointmentDetailPage";
import DoctorPatientsPage from "../pages/DoctorPatientsPage";
import PatientConsultationRequestPage from "../pages/PatientConsultationRequestPage";
import DoctorProfilePage from "../pages/DoctorProfilePage";
import DoctorMyReviewsPage from "../pages/doctor/DoctorMyReviewsPage";

// Admin Zone Pages
import DashboardPage from "../pages/admin/DashboardPage";
import UsersPage from "../pages/admin/UsersPage";
import UserFormPage from "../pages/admin/UserFormPage";
import UserDetailPage from "../pages/admin/UserDetailPage";
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
import DoctorScheduleAdminPage from "../pages/admin/DoctorSchedulePage";
import DoctorSchedulePage from "../pages/doctor/DoctorSchedulePage";
import SchedulesAdminPage from "../pages/admin/SchedulesAdminPage";
import ConsultationsPage from "../pages/admin/ConsultationsPage";
import VersionPage from "../pages/admin/VersionPage";
import AuditLogsPage from "../pages/admin/AuditLogsPage";
import AdminReviewsPage from "../pages/admin/AdminReviewsPage";

// Clinic Owner Zone Pages
import ClinicOwnerDashboardPage from "../pages/clinic-owner/ClinicOwnerDashboardPage";
import MyBranchesPage from "../pages/clinic-owner/MyBranchesPage";
import MyDoctorsPage from "../pages/clinic-owner/MyDoctorsPage";
import MyPatientsPage from "../pages/clinic-owner/MyPatientsPage";
import MyAppointmentsPage from "../pages/clinic-owner/MyAppointmentsPage";
import MyConsultationsPage from "../pages/clinic-owner/MyConsultationsPage";
import SubscriptionPage from "../pages/clinic-owner/SubscriptionPage";

// Receptionist Zone Pages
import ReceptionistDashboardPage from "../pages/receptionist/ReceptionistDashboardPage";

// Accountant Zone Pages
import AccountantDashboardPage from "../pages/accountant/AccountantDashboardPage";

// Route Guards
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import PatientRoute from "./PatientRoute";
import DoctorRoute from "./DoctorRoute";
import ClinicOwnerRoute from "./ClinicOwnerRoute";
import ReceptionistRoute from "./ReceptionistRoute";
import AccountantRoute from "./AccountantRoute";

// Role-based home redirect
const HomeRedirect = () => {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (role) {
    case "patient": return <Navigate to="/patient" replace />;
    case "doctor": return <Navigate to="/doctor" replace />;
    case "clinic_owner": return <Navigate to="/clinic-owner" replace />;
    case "receptionist": return <Navigate to="/receptionist" replace />;
    case "accountant": return <Navigate to="/accountant" replace />;
    case "admin":
    case "super_admin": return <Navigate to="/admin" replace />;
    default: return <Navigate to="/" replace />;
  }
};

const HoloraMindRedirect = () => {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role === "doctor") return <Navigate to="/doctor/holoramind" replace />;
  return <Navigate to="/patient/holoramind" replace />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <RouteTitleManager />
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
        <Route path="/holoramind" element={<HoloraMindRedirect />} />

        <Route
          path="/pricing"
          element={
            <MainLayout>
              <PricingPage />
            </MainLayout>
          }
        />

        <Route
          path="/doctors"
          element={
            <MainLayout>
              <DoctorsPage />
            </MainLayout>
          }
        />

        <Route
          path="/doctors/:id"
          element={
            <MainLayout>
              <DoctorPublicDetailPage />
            </MainLayout>
          }
        />

        <Route
          path="/branches"
          element={
            <MainLayout>
              <PatientBranchesPage />
            </MainLayout>
          }
        />

        <Route
          path="/branches/:id"
          element={
            <MainLayout>
              <PatientBranchDetailPage />
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
                <PatientMyBranchesPage />
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
                <PatientMyDoctorsPage />
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
          path="/patient/consultations/:id"
          element={
            <PatientRoute>
              <PatientLayout>
                <PatientConsultationDetailPage />
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
          path="/patient/appointments/:id"
          element={
            <PatientRoute>
              <PatientLayout>
                <PatientAppointmentDetailPage />
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
          path="/doctor/appointments/:id"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorAppointmentDetailPage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />

        <Route
          path="/doctor/appointments/:id/room"
          element={
            <DoctorRoute>
              <VideoConsultationPage />
            </DoctorRoute>
          }
        />

        <Route
          path="/doctor/consultations"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorConsultationHistoryPage />
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
          path="/doctor/patients"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorPatientsPage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />

        <Route
          path="/doctor/reviews"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorMyReviewsPage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />

        <Route
          path="/doctor/profile"
          element={
            <DoctorRoute>
              <DoctorLayout>
                <DoctorProfilePage />
              </DoctorLayout>
            </DoctorRoute>
          }
        />

        <Route
          path="/doctor/holoramind"
          element={
            <DoctorRoute>
              <HoloraMindPage />
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
          path="/clinic-owner/patients"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <MyPatientsPage />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/appointments"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <MyAppointmentsPage />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/consultations"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <MyConsultationsPage />
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
          path="/admin/users/:userId/view"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <UserDetailPage />
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
                <SchedulesAdminPage />
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

        <Route
          path="/admin/version"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <VersionPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <AuditLogsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/reviews"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <AdminReviewsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* RECEPTIONIST ZONE - Only receptionist role */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route
            path="/receptionist"
            element={
              <ReceptionistRoute>
                <ReceptionistLayout>
                  <ReceptionistDashboardPage />
                </ReceptionistLayout>
              </ReceptionistRoute>
            }
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ACCOUNTANT ZONE - Only accountant role */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Route
            path="/accountant"
            element={
              <AccountantRoute>
                <AccountantLayout>
                  <AccountantDashboardPage />
                </AccountantLayout>
              </AccountantRoute>
            }
          />

        {/* Fallback - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
