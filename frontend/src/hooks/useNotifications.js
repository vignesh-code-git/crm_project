"use client";
import { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/config/apiConfig";

const API = `${API_BASE_URL}/api/notifications`;

export default function useNotificationApi() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (isInitial = true) => {
    try {
      const currentPage = isInitial ? 1 : page;
      const res = await fetch(`${API}?page=${currentPage}&limit=10`, {
        credentials: "include",
      });
      const result = await res.json();
      const data = Array.isArray(result) ? result : [];
      
      if (isInitial) {
        setNotifications(data);
        setPage(1);
        setHasMore(data.length === 10);
      } else {
        setNotifications(prev => {
          const combined = [...prev, ...data];
          // Simple unique check
          const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          return unique;
        });
        setHasMore(data.length === 10);
      }
    } catch (err) {
      console.error("❌ FETCH NOTIFICATIONS ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchMore = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    setPage(prev => prev + 1);
    await fetchNotifications(false);
  };

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
    fetchNotifications(true);

    // 🔄 3-SECOND POLLING (Only for the first page to see new ones)
    const pollInterval = setInterval(() => fetchNotifications(true), 10000); // 10s is enough for polling

    // 🔔 DISPATCHER FOR INSTANT REFRESH ON ACTION
    const handler = () => fetchNotifications(true);
    window.addEventListener("refetchNotifications", handler);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("refetchNotifications", handler);
    };
  }, []); // Only on mount

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
    hasMore,
    fetchNotifications,
    fetchMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
