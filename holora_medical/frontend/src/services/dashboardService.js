import api from "./api";

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/dashboard/analytics');
    return response.data;
  },
  getDoctorDashboard: async () => {
    const response = await api.get('/dashboard/doctor');
    return response.data;
  },
  getPatientDashboard: async () => {
    const response = await api.get('/dashboard/patient');
    return response.data;
  },
};
