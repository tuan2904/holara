import api from "./api";

// Get all users
export const getAllUsersApi = async () => {
  const response = await api.get("/users");
  return response.data;
};

// Get user by ID
export const getUserByIdApi = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Create user
export const createUserApi = async (payload) => {
  const response = await api.post("/users", payload);
  return response.data;
};

// Update user
export const updateUserApi = async (id, payload) => {
  const response = await api.put(`/users/${id}`, payload);
  return response.data;
};

// Delete user
export const deleteUserApi = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Assign role to user
export const assignRoleApi = async (payload) => {
  const response = await api.post("/users/assign-role", payload);
  return response.data.data;
};

// Get active sessions for a user
export const getUserSessionsApi = async (id) => {
  const response = await api.get(`/users/${id}/sessions`);
  return response.data;
};

// Get login history for a user
export const getUserLoginHistoryApi = async (id, limit = 50) => {
  const response = await api.get(`/users/${id}/login-history?limit=${limit}`);
  return response.data;
};

// Force logout all sessions for a user
export const forceLogoutUserApi = async (id) => {
  const response = await api.post(`/users/${id}/force-logout`);
  return response.data;
};

// Revoke a single session
export const revokeSessionApi = async (userId, sessionId) => {
  const response = await api.delete(`/users/${userId}/sessions/${sessionId}`);
  return response.data;
};
