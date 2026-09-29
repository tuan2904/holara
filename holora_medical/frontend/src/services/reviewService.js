import api from "./api";

// ── Patient ─────────────────────────────────────────────────────────────────
export const createReviewApi = async (data) => {
  const response = await api.post("/reviews", data);
  return response.data;
};

export const getMyReviewsApi = async () => {
  const response = await api.get("/reviews/me");
  return response.data;
};

export const checkReviewExistsApi = async (params) => {
  const response = await api.get("/reviews/check", { params });
  return response.data;
};

export const updateReviewApi = async (id, data) => {
  const response = await api.put(`/reviews/${id}`, data);
  return response.data;
};

export const deleteReviewApi = async (id) => {
  const response = await api.delete(`/reviews/${id}`);
  return response.data;
};

// ── Public ──────────────────────────────────────────────────────────────────
export const getDoctorReviewsApi = async (doctorId, params = {}) => {
  const response = await api.get(`/reviews/doctor/${doctorId}`, { params });
  return response.data;
};

export const getDoctorRatingSummaryApi = async (doctorId) => {
  const response = await api.get(`/reviews/doctor/${doctorId}/summary`);
  return response.data;
};

// ── Doctor ──────────────────────────────────────────────────────────────────
export const getReceivedReviewsApi = async (params = {}) => {
  const response = await api.get("/reviews/received", { params });
  return response.data;
};

// ── Admin ───────────────────────────────────────────────────────────────────
export const getAllReviewsApi = async (params = {}) => {
  const response = await api.get("/reviews/admin", { params });
  return response.data;
};

export const moderateReviewApi = async (id, status) => {
  const response = await api.patch(`/reviews/${id}/moderate`, { status });
  return response.data;
};
