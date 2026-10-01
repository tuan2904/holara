import api from "./api";

// Get all patients
export const getAllPatientsApi = async () => {
  const response = await api.get("/patients");
  return response.data;
};

// Get patient by ID
export const getPatientByIdApi = async (id) => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};

export const getNextPatientCodeApi = async () => {
  const response = await api.get("/patients/next-code");
  return response.data;
};

// Create patient
export const createPatientApi = async (payload) => {
  const response = await api.post("/patients", payload);
  return response.data;
};

// Update patient
export const updatePatientApi = async (id, payload) => {
  const response = await api.put(`/patients/${id}`, payload);
  return response.data;
};

// Delete patient
export const deletePatientApi = async (id) => {
  const response = await api.delete(`/patients/${id}`);
  return response.data;
};

// Get current authenticated user's patient profile
export const getMyProfileApi = async () => {
  const response = await api.get("/patients/me");
  return response.data;
};

// Update current authenticated user's patient profile
export const updateMyProfileApi = async (payload) => {
  const response = await api.put("/patients/me", payload);
  return response.data;
};

// Get patients in branches owned by the authenticated clinic_owner
export const getPatientsByOwnerBranchesApi = async () => {
  const response = await api.get("/patients/my-branches");
  return response.data;
};

// Get current authenticated user's stats (appointments, consultations)
export const getPatientStatsApi = async () => {
  const response = await api.get("/patients/me/stats");
  return response.data;
};

// Get doctors the patient has interacted with (via appointments + consultations)
export const getMyDoctorsApi = async () => {
  const response = await api.get("/patients/me/doctors");
  return response.data;
};

// Get branches the patient has interacted with (via appointment/consultation doctors)
export const getMyBranchesApi = async () => {
  const response = await api.get("/patients/me/branches");
  return response.data;
};
