import api from "./api";

export const emrService = {
  // Lấy danh sách EMR theo bệnh nhân
  getByPatient: async (patientId) => {
    const res = await api.get(`/emr/patient/${patientId}`);
    return res.data;
  },
  // Lấy chi tiết EMR
  getById: async (id) => {
    const res = await api.get(`/emr/${id}`);
    return res.data;
  },
  // Tạo mới EMR
  create: async (payload) => {
    const res = await api.post(`/emr`, payload);
    return res.data;
  },
  // Cập nhật EMR
  update: async (id, payload) => {
    const res = await api.put(`/emr/${id}`, payload);
    return res.data;
  },
  // Xóa EMR
  remove: async (id) => {
    const res = await api.delete(`/emr/${id}`);
    return res.data;
  },
};
