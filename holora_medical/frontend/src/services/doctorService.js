import api from "./api";

// Get all doctors
export const getAllDoctorsApi = async () => {
  const response = await api.get("/doctors");
  return response.data;
};

// Search doctors with filters + pagination
export const searchDoctorsApi = async ({
  q = "",
  specialty_id,
  branch_id,
  status,
  page = 1,
  limit = 20,
} = {}) => {
  const params = { q, page, limit };
  if (specialty_id) params.specialty_id = specialty_id;
  if (branch_id) params.branch_id = branch_id;
  if (status) params.status = status;

  const response = await api.get("/doctors/search", { params });
  return response.data;
};

// Get doctor by ID
export const getDoctorByIdApi = async (id) => {
  const response = await api.get(`/doctors/${id}`);
  return response.data;
};

export const getMyDoctorProfileApi = async () => {
  const response = await api.get("/doctors/me");
  return response.data;
};

export const updateMyDoctorProfileApi = async (payload) => {
  const response = await api.put("/doctors/me", payload);
  return response.data;
};

export const getMyDoctorPatientsApi = async () => {
  const response = await api.get("/doctors/me/patients");
  return response.data;
};

export const getNextDoctorCodeApi = async () => {
  const response = await api.get("/doctors/next-code");
  return response.data;
};

// Create doctor
export const createDoctorApi = async (payload) => {
  const response = await api.post("/doctors", payload);
  return response.data;
};

// Update doctor
export const updateDoctorApi = async (id, payload) => {
  const response = await api.put(`/doctors/${id}`, payload);
  return response.data;
};

// Delete doctor
export const deleteDoctorApi = async (id) => {
  const response = await api.delete(`/doctors/${id}`);
  return response.data;
};

// Get doctors in branches owned by the authenticated clinic_owner
export const getDoctorsByOwnerBranchesApi = async () => {
  const response = await api.get("/doctors/my-branches");
  return response.data;
};
