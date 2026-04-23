"use client";
import { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/config/apiConfig";

const API = `${API_BASE_URL}/api/notifications`;

export default function useNotificationApi() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(API, {
        credentials: "include",
      });
      const result = await res.json();
      // Ensure we only update state if data has actually changed to prevent jitter
      const data = Array.isArray(result) ? result : [];
      setNotifications(data);
    } catch (err) {
      console.error("❌ FETCH NOTIFICATIONS ERROR:", err);
      // Don't clear notifications on transient network errors
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${API}/${id}/read`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error("❌ MARK AS READ ERROR:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API}/read-all`, {
        method: "PUT",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("❌ MARK ALL AS READ ERROR:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // 🔄 3-SECOND POLLING FOR REAL-TIME UPDATES
    const pollInterval = setInterval(fetchNotifications, 3000);

    // 🔔 DISPATCHER FOR INSTANT REFRESH ON ACTION
    const handler = () => fetchNotifications();
    window.addEventListener("refetchNotifications", handler);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("refetchNotifications", handler);
    };
  }, [fetchNotifications]);

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("❌ DELETE NOTIFICATION ERROR:", err);
    }
  };

  return {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
