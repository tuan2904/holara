/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { notificationService } from "../services/notificationService";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30_000; // poll mỗi 30 giây

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const loading = false;
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll(25);
      setItems(res.data || []);
      setUnreadCount(res.unread_count ?? 0);
    } catch {
      // silent - user chưa đăng nhập hoặc bảng chưa có
    }
  }, []);

  // Bắt đầu poll khi đã đăng nhập
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const initialFetchTimer = setTimeout(() => {
      fetchNotifications();
    }, 0);
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(initialFetchTimer);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isAuthenticated, fetchNotifications]);

  const markRead = useCallback(async (id) => {
    await notificationService.markRead(id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  }, []);

  // Legacy helpers (giữ để không break code cũ)
  const [legacyNotifs, setLegacyNotifs] = useState({
    appointments: 0,
    consultations: 0,
    messages: 0,
    alerts: 0,
  });

  const updateNotifications = useCallback((type, count) => {
    setLegacyNotifs((prev) => ({ ...prev, [type]: count }));
  }, []);

  const incrementNotification = useCallback((type) => {
    setLegacyNotifs((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  }, []);

  const clearNotification = useCallback((type) => {
    setLegacyNotifs((prev) => ({ ...prev, [type]: 0 }));
  }, []);

  const getTotalNotifications = () =>
    Object.values(legacyNotifs).reduce((s, v) => s + v, 0);

  const value = {
    items: isAuthenticated ? items : [],
    unreadCount: isAuthenticated ? unreadCount : 0,
    loading,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
    // Legacy
    notifications: legacyNotifs,
    updateNotifications,
    incrementNotification,
    clearNotification,
    getTotalNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
};
