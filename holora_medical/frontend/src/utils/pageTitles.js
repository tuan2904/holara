import { matchPath } from "react-router-dom";

const APP_NAME = "Holora Medical";

const ROUTE_TITLES = [
  { path: "/", title: "Trang chủ" },
  { path: "/pricing", title: "Bảng giá" },
  { path: "/doctors", title: "Danh sách bác sĩ" },
  { path: "/doctors/:id", title: "Hồ sơ bác sĩ" },
  { path: "/branches", title: "Danh sách cơ sở" },
  { path: "/branches/:id", title: "Chi tiết cơ sở" },
  { path: "/login", title: "Đăng nhập" },
  { path: "/register", title: "Đăng ký" },
  { path: "/register/provider", title: "Đăng ký đối tác y tế" },
  { path: "/forgot-password", title: "Quên mật khẩu" },
  { path: "/reset-password", title: "Đặt lại mật khẩu" },
  { path: "/doctor/invite-setup", title: "Thiết lập tài khoản bác sĩ" },
  { path: "/patient", title: "Bảng điều khiển bệnh nhân" },
  { path: "/patient/branches", title: "Chi nhánh của tôi" },
  { path: "/patient/branches/:id", title: "Chi tiết chi nhánh" },
  { path: "/patient/doctors", title: "Bác sĩ của tôi" },
  { path: "/patient/doctors/:id", title: "Hồ sơ bác sĩ" },
  { path: "/patient/appointments", title: "Lịch hẹn của tôi" },
  { path: "/patient/appointments/:id", title: "Chi tiết lịch hẹn" },
  { path: "/patient/appointments/:id/room", title: "Phòng tư vấn video" },
  { path: "/patient/consultations", title: "Lịch sử tư vấn" },
  { path: "/patient/consultations/new", title: "Tạo yêu cầu tư vấn" },
  { path: "/patient/consultations/:id", title: "Chi tiết tư vấn" },
  { path: "/patient/profile", title: "Hồ sơ cá nhân" },
  { path: "/patient/holoramind", title: "HoloraMind" },
  { path: "/doctor", title: "Bảng điều khiển bác sĩ" },
  { path: "/doctor/appointments", title: "Lịch hẹn bác sĩ" },
  { path: "/doctor/appointments/:id", title: "Chi tiết lịch hẹn" },
  { path: "/doctor/appointments/:id/room", title: "Phòng tư vấn video" },
  { path: "/doctor/consultations", title: "Danh sách tư vấn" },
  { path: "/doctor/consultations/:id", title: "Chi tiết tư vấn" },
  { path: "/doctor/schedule", title: "Lịch làm việc" },
  { path: "/doctor/patients", title: "Danh sách bệnh nhân" },
  { path: "/doctor/reviews", title: "Đánh giá của tôi" },
  { path: "/doctor/profile", title: "Hồ sơ bác sĩ" },
  { path: "/doctor/holoramind", title: "HoloraMind" },
  { path: "/doctor/earnings", title: "Thu nhập bác sĩ" },
  { path: "/clinic-owner", title: "Bảng điều khiển chủ phòng khám" },
  { path: "/clinic-owner/branches", title: "Quản lý chi nhánh" },
  { path: "/clinic-owner/branches/new", title: "Thêm chi nhánh" },
  { path: "/clinic-owner/branches/:branchId/edit", title: "Cập nhật chi nhánh" },
  { path: "/clinic-owner/doctors", title: "Quản lý bác sĩ" },
  { path: "/clinic-owner/doctors/new", title: "Thêm bác sĩ" },
  { path: "/clinic-owner/doctors/:doctorId/edit", title: "Cập nhật bác sĩ" },
  { path: "/clinic-owner/patients", title: "Quản lý bệnh nhân" },
  { path: "/clinic-owner/appointments", title: "Quản lý lịch hẹn" },
  { path: "/clinic-owner/consultations", title: "Quản lý tư vấn" },
  { path: "/clinic-owner/subscription", title: "Gói dịch vụ" },
  { path: "/admin", title: "Bảng điều khiển quản trị" },
  { path: "/admin/users", title: "Quản lý người dùng" },
  { path: "/admin/users/new", title: "Thêm người dùng" },
  { path: "/admin/users/:userId/view", title: (params) => `Chi tiết người dùng #${params.userId}` },
  { path: "/admin/users/:userId/edit", title: (params) => `Chỉnh sửa người dùng #${params.userId}` },
  { path: "/admin/roles", title: "Quản lý vai trò" },
  { path: "/admin/roles/new", title: "Thêm vai trò" },
  { path: "/admin/roles/:roleId", title: (params) => `Chi tiết vai trò #${params.roleId}` },
  { path: "/admin/roles/:roleId/edit", title: (params) => `Chỉnh sửa vai trò #${params.roleId}` },
  { path: "/admin/permissions", title: "Quản lý quyền" },
  { path: "/admin/permissions/new", title: "Thêm quyền" },
  { path: "/admin/permissions/:permissionId/edit", title: (params) => `Chỉnh sửa quyền #${params.permissionId}` },
  { path: "/admin/doctors", title: "Quản lý bác sĩ" },
  { path: "/admin/doctors/new", title: "Thêm bác sĩ" },
  { path: "/admin/doctors/:doctorId/edit", title: (params) => `Chỉnh sửa bác sĩ #${params.doctorId}` },
  { path: "/admin/patients", title: "Quản lý bệnh nhân" },
  { path: "/admin/patients/new", title: "Thêm bệnh nhân" },
  { path: "/admin/patients/:patientId/edit", title: (params) => `Chỉnh sửa bệnh nhân #${params.patientId}` },
  { path: "/admin/specialties", title: "Quản lý chuyên khoa" },
  { path: "/admin/specialties/new", title: "Thêm chuyên khoa" },
  { path: "/admin/specialties/:specialtyId/edit", title: (params) => `Chỉnh sửa chuyên khoa #${params.specialtyId}` },
  { path: "/admin/branches", title: "Quản lý chi nhánh" },
  { path: "/admin/branches/new", title: "Thêm chi nhánh" },
  { path: "/admin/branches/:branchId/edit", title: (params) => `Chỉnh sửa chi nhánh #${params.branchId}` },
  { path: "/admin/appointments", title: "Quản lý lịch hẹn" },
  { path: "/admin/schedules", title: "Quản lý lịch làm việc" },
  { path: "/admin/consultations", title: "Quản lý tư vấn" },
  { path: "/admin/version", title: "Phiên bản hệ thống" },
  { path: "/admin/audit-logs", title: "Nhật ký hệ thống" },
  { path: "/admin/reviews", title: "Duyệt đánh giá" },
  { path: "/receptionist", title: "Bảng điều khiển lễ tân" },
  { path: "/accountant", title: "Bảng điều khiển kế toán" },
  { path: "/holoramind", title: "HoloraMind" },
];

export const getPageTitle = (pathname = "/") => {
  const matchedRoute = ROUTE_TITLES.find(({ path }) =>
    matchPath({ path, end: true }, pathname)
  );

  if (!matchedRoute) return APP_NAME;

  const match = matchPath({ path: matchedRoute.path, end: true }, pathname);
  const suffix =
    typeof matchedRoute.title === "function"
      ? matchedRoute.title(match?.params || {})
      : matchedRoute.title;

  return suffix ? `${APP_NAME} | ${suffix}` : APP_NAME;
};

export const APP_TITLE = APP_NAME;
