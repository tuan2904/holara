import api from "./api";

export const earningsService = {
  getDoctorEarnings: async (doctorId) => {
    const response = await api.get(`/earnings/doctor/${doctorId}`);
    return response.data;
  },
  getDoctorEarningsHistory: async (params = {}) => {
    const response = await api.get('/earnings/history', { params });
    return response.data;
  },
};
