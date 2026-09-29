import api from "./api";

export const aiService = {
  // Bệnh nhân yêu cầu AI chạy qua một nút bấm. API xử lý non-blocking.
  requestImageAnalysis: async (consultationId, consultationImageId) => {
    const response = await api.post("/ai/analyze", {
      consultation_id: consultationId,
      consultation_image_id: consultationImageId
    });
    return response.data;
  },

  // Pull kết quả AI về trình duyệt
  getAnalysisForConsultation: async (consultationId) => {
    const response = await api.get(`/ai/consultation/${consultationId}`);
    return response.data;
  },

  // Bác sĩ đánh giá kết quả AI: gán nhãn trạng thái và kiểm soát quyền xem
  reviewAIResult: async (requestId, data) => {
    const response = await api.patch(`/ai/review/${requestId}`, data);
    return response.data;
  },
};
