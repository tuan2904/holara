import api from "./api";

export const notificationService = {
  /** Lấy danh sách thông báo + unread_count */
  getAll: async (limit = 20) => {
    const res = await api.get("/notifications", { params: { limit } });
    return res.data; // { data: [...], unread_count: N }
  },

  /** Đánh dấu 1 thông báo đã đọc */
  markRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  /** Đánh dấu tất cả đã đọc */
  markAllRead: async () => {
    const res = await api.patch("/notifications/read-all");
    return res.data;
  },
};
