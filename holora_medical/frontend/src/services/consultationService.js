import api from "./api";

export const consultationService = {
  // Patient creates request
  createRequest: async (data) => {
    const response = await api.post("/consultations", data);
    return response.data;
  },

  // Doctor gets list
  getDoctorRequests: async () => {
    const response = await api.get("/consultations/doctor-requests");
    return response.data;
  },

  // Patient gets list
  getPatientHistory: async () => {
    const response = await api.get("/consultations/my-history");
    return response.data;
  },

  // Get details
  getConsultationDetails: async (id) => {
    const response = await api.get(`/consultations/${id}`);
    return response.data;
  },

  // Get linked consultation for an appointment
  getByAppointmentId: async (appointmentId) => {
    const response = await api.get(`/appointments/${appointmentId}/consultation`);
    return response.data;
  },

  // Add response
  addResponse: async (id, data) => {
    const response = await api.post(`/consultations/${id}/responses`, data);
    return response.data;
  },

  // Doctor reopens a completed consultation
  reopenConsultation: async (id) => {
    const response = await api.patch(`/consultations/${id}/reopen`);
    return response.data;
  },

  // Patient deletes an image (only allowed if no AI analysis has been run)
  deleteImage: async (consultationId, imageId) => {
    const response = await api.delete(`/consultations/${consultationId}/images/${imageId}`);
    return response.data;
  },

  // Clinic Owner: Lấy tất cả tư vấn thuộc chi nhánh
  getOwnerConsultations: async ({ status, priority, start_date, end_date, search, branch_id, doctor_id } = {}) => {
    const params = {};
    if (status)     params.status     = status;
    if (priority)   params.priority   = priority;
    if (start_date) params.start_date = start_date;
    if (end_date)   params.end_date   = end_date;
    if (search)     params.search     = search;
    if (branch_id)  params.branch_id  = branch_id;
    if (doctor_id)  params.doctor_id  = doctor_id;
    const response = await api.get("/consultations/owner/all", { params });
    return response.data;
  },
};
