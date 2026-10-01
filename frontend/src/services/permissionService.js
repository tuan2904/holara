import api from "./api";

// Get all permissions
export const getAllPermissionsApi = async (moduleFilter = null, statusFilter = null) => {
  let url = "/permissions";
  const params = new URLSearchParams();

  if (moduleFilter) params.append("module_name", moduleFilter);
  if (statusFilter) params.append("status", statusFilter);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await api.get(url);
  return response.data;
};

// Get permission by ID
export const getPermissionByIdApi = async (id) => {
  const response = await api.get(`/permissions/${id}`);
  return response.data;
};

// Create permission
export const createPermissionApi = async (payload) => {
  const response = await api.post("/permissions", payload);
  return response.data;
};

// Update permission
export const updatePermissionApi = async (id, payload) => {
  const response = await api.put(`/permissions/${id}`, payload);
  return response.data;
};

// Delete permission
export const deletePermissionApi = async (id) => {
  const response = await api.delete(`/permissions/${id}`);
  return response.data;
};

// Get modules list
export const getModulesApi = async () => {
  const response = await api.get("/permissions/modules/list");
  return response.data;
};
