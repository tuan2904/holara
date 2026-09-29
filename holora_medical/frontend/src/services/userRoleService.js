import api from "./api";

// Assign role to user
export const assignRoleToUserApi = async (user_id, role_id) => {
  const response = await api.post("/users/assign-role", {
    user_id,
    role_id,
  });
  return response.data.data;
};

// Remove role from user
export const removeRoleFromUserApi = async (user_id, role_id) => {
  const response = await api.post("/users/remove-role", {
    user_id,
    role_id,
  });
  return response.data.data;
};

// Get user roles
export const getUserRolesApi = async (user_id) => {
  const response = await api.get(`/users/${user_id}/roles`);
  return response.data.data;
};

// Get available roles for user
export const getAvailableRolesApi = async (user_id) => {
  const response = await api.get(`/users/${user_id}/available-roles`);
  return response.data.data;
};
