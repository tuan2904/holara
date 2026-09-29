import api from "./api";

// Get all roles
export const getAllRolesApi = async () => {
  const response = await api.get("/roles");
  return response.data;
};

// Get role by ID
export const getRoleByIdApi = async (id) => {
  const response = await api.get(`/roles/${id}`);
  return response.data;
};

// Create role
export const createRoleApi = async (payload) => {
  const response = await api.post("/roles", payload);
  return response.data;
};

// Update role
export const updateRoleApi = async (id, payload) => {
  const response = await api.put(`/roles/${id}`, payload);
  return response.data;
};

// Delete role
export const deleteRoleApi = async (id) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data;
};

// Get role permissions
export const getRolePermissionsApi = async (id) => {
  const response = await api.get(`/roles/${id}/permissions`);
  return response.data;
};

// Assign permission to role
export const assignPermissionApi = async (payload) => {
  const response = await api.post("/roles/permissions/assign", payload);
  return response.data;
};

// Remove permission from role
export const removePermissionApi = async (payload) => {
  const response = await api.post("/roles/permissions/remove", payload);
  return response.data;
};
