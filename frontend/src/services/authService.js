import api from "./api";

// API call for user login
export const loginApi = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

// Future implementation for registration
export const registerApi = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

// Google sign-in / sign-up
export const googleAuthApi = async (payload) => {
  const response = await api.post("/auth/google", payload);
  return response.data;
};

export const acceptDoctorInviteApi = async (payload) => {
  const response = await api.post("/auth/doctor-invite/accept", payload);
  return response.data;
};

// Quên mật khẩu
export const forgotPasswordApi = async (payload) => {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
};

// Đặt lại mật khẩu
export const resetPasswordApi = async (payload) => {
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
};

// Refresh token
export const refreshTokenApi = async (refreshToken) => {
  const response = await api.post("/auth/refresh", { refreshToken });
  return response.data;
};

// Logout (revoke refresh token)
export const logoutApi = async (refreshToken) => {
  const response = await api.post("/auth/logout", { refreshToken });
  return response.data;
};

// Logout all sessions
export const logoutAllApi = async () => {
  const response = await api.post("/auth/logout-all");
  return response.data;
};

// Đổi mật khẩu
export const changePasswordApi = async (current_password, new_password) => {
  const response = await api.post("/auth/change-password", { current_password, new_password });
  return response.data;
};