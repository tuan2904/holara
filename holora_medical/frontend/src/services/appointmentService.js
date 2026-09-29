import api from "./api";

// --- DỊCH VỤ QUẢN LÝ CA CHI TẾT CỦA BÁC SĨ (SCHEDULE) ---
export const scheduleService = {
  getDoctorSchedules: async (doctorId, startDate, endDate) => {
    let url = `/schedules?`;
    if (doctorId) url += `doctor_id=${doctorId}&`;
    if (startDate) url += `start_date=${startDate}&`;
    if (endDate) url += `end_date=${endDate}`;
    const response = await api.get(url);
    return response.data;
  },

  createSchedule: async (payload) => {
    // payload: { doctor_id, schedules: [{work_date, start_time, end_time, slot_duration}] }
    const response = await api.post("/schedules", payload);
    return response.data;
  },

  updateSchedule: async (id, payload) => {
    // payload: { work_date, start_time, end_time, slot_duration, status }
    const response = await api.put(`/schedules/${id}`, payload);
    return response.data;
  },

  deleteSchedule: async (id) => {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  }
};

// --- DỊCH VỤ ĐẶT LỊCH HẸN (APPOINTMENT) ---
export const appointmentService = {
  // Lấy các mốc T/g 30 phút rảnh rỗi tuyệt đối (Patient)
  getAvailableSlots: async (doctorId, date, durationMinutes, branchId) => {
    const branchQuery = branchId ? `&branch_id=${branchId}` : "";
    const response = await api.get(`/appointments/available-slots?doctor_id=${doctorId}&date=${date}&duration_minutes=${durationMinutes}${branchQuery}`);
    return response.data;
  },

  // Tiến hành xuất lệnh đặt chỗ (Patient)
  /**
   * Đặt lịch hẹn (có thể lặp lại)
   * payload: {
   *   doctor_id, specialty_id, branch_id, appointment_date, start_time, duration_minutes, reason, appointment_type,
   *   recurring, recurring_type, recurring_count, recurring_until
   * }
   */
  bookAppointment: async (payload) => {
    const response = await api.post("/appointments", payload);
    return response.data;
  },

  // Giúp Dashboard tải lịch về (Tự auto check Role của Token)
  getMyAppointments: async () => {
    const response = await api.get("/appointments");
    return response.data;
  },

    // Admin: Lấy tất cả lịch khám với filter
    getAllAppointmentsAdmin: async ({ status, start_date, end_date, search } = {}) => {
      const params = {};
      if (status)     params.status     = status;
      if (start_date) params.start_date = start_date;
      if (end_date)   params.end_date   = end_date;
      if (search)     params.search     = search;
      const response = await api.get("/appointments/admin/all", { params });
      return response.data;
    },

  // Clinic Owner: Lấy tất cả lịch khám thuộc chi nhánh của owner
  getAllAppointmentsOwner: async ({ status, start_date, end_date, search, branch_id, doctor_id } = {}) => {
    const params = {};
    if (status)     params.status     = status;
    if (start_date) params.start_date = start_date;
    if (end_date)   params.end_date   = end_date;
    if (search)     params.search     = search;
    if (branch_id)  params.branch_id  = branch_id;
    if (doctor_id)  params.doctor_id  = doctor_id;
    const response = await api.get("/appointments/owner/all", { params });
    return response.data;
  },

  // Đổi trạng thái lịch khám (Bác sĩ/Admin)
  updateStatus: async (appointmentId, status, cancellation_reason = "") => {
    const response = await api.put(`/appointments/${appointmentId}/status`, { status, cancellation_reason });
    return response.data;
  },

  // Lấy chi tiết lịch khám bằng ID
  getAppointmentById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // Recurring: lấy danh sách các lịch con theo recurring_id
  getRecurringChildren: async (recurring_id) => {
    const response = await api.get(`/recurring-appointments/${recurring_id}/children`);
    return response.data;
  },
  // Recurring: huỷ 1 lịch con
  cancelRecurringChild: async (id) => {
    const response = await api.post(`/recurring-appointments/children/${id}/cancel`);
    return response.data;
  },
  // Recurring: huỷ cả chuỗi
  cancelRecurringSeries: async (recurring_id) => {
    const response = await api.post(`/recurring-appointments/${recurring_id}/cancel-all`);
    return response.data;
  },

  // Mock: Get payment status for appointment
  getPaymentStatus: async (appointmentId) => {
    const response = await api.get(`/payments/appointments/${appointmentId}/payment-status`);
    return response.data;
  },

  // Mock: Pay for appointment
  payForAppointment: async (appointmentId) => {
    const response = await api.post(`/payments/appointments/${appointmentId}/pay`);
    return response.data;
  }
};
