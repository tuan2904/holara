import api from "./api";

export const getAuditLogsApi = async (params = {}) => {
  const response = await api.get("/audit-logs", { params });
  return response.data;
};

export const getAuditActionsApi = async () => {
  const response = await api.get("/audit-logs/actions");
  return response.data;
};

export const getAuditEntityTypesApi = async () => {
  const response = await api.get("/audit-logs/entity-types");
  return response.data;
};
