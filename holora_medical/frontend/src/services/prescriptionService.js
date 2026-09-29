import api from "./api";

// ── Doctor ──────────────────────────────────────────────────────────────────
export const createPrescriptionApi = async (data) => {
  const response = await api.post("/prescriptions", data);
  return response.data;
};

export const getDoctorPrescriptionsApi = async (params = {}) => {
  const response = await api.get("/prescriptions/doctor/me", { params });
  return response.data;
};

export const updatePrescriptionApi = async (id, data) => {
  const response = await api.put(`/prescriptions/${id}`, data);
  return response.data;
};

export const issuePrescriptionApi = async (id) => {
  const response = await api.post(`/prescriptions/${id}/issue`);
  return response.data;
};

export const cancelPrescriptionApi = async (id) => {
  const response = await api.post(`/prescriptions/${id}/cancel`);
  return response.data;
};

// ── Patient ─────────────────────────────────────────────────────────────────
export const getMyPrescriptionsApi = async (params = {}) => {
  const response = await api.get("/prescriptions/patient/me", { params });
  return response.data;
};

// ── By context ──────────────────────────────────────────────────────────────
export const getPrescriptionsByConsultationApi = async (consultationId) => {
  const response = await api.get(`/prescriptions/consultation/${consultationId}`);
  return response.data;
};

export const getPrescriptionsByAppointmentApi = async (appointmentId) => {
  const response = await api.get(`/prescriptions/appointment/${appointmentId}`);
  return response.data;
};

export const getPrescriptionByIdApi = async (id) => {
  const response = await api.get(`/prescriptions/${id}`);
  return response.data;
};
