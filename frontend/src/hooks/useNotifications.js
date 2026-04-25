"use client";
import { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/config/apiConfig";

const API = `${API_BASE_URL}/api/notifications`;

export default function useNotificationApi() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (targetPage = 1) => {
    try {
      const isInitial = targetPage === 1;
      const res = await fetch(`${API}?page=${targetPage}&limit=10`, {
        credentials: "include",
      });
      const result = await res.json();
      const data = Array.isArray(result) ? result : [];
      
      setNotifications(prev => {
        // If it's a poll (page 1), we merge into the top
        // If it's a fetchMore (page > 1), we append to the bottom
        const combined = isInitial ? [...data, ...prev] : [...prev, ...data];
        // Ensure uniqueness by ID
        return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      });

      if (!isInitial) {
        setPage(targetPage);
      }
      
      // If we got fewer than 10, there's definitely no more on the NEXT page
      setHasMore(data.length === 10);
    } catch (err) {
      console.error("❌ FETCH NOTIFICATIONS ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    const nextPage = page + 1;
    await fetchNotifications(nextPage);
  }, [hasMore, loading, page, fetchNotifications]);

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
    fetchNotifications(1);

    // 🔄 10-SECOND POLLING (Only for the first page to see new ones)
    const pollInterval = setInterval(() => fetchNotifications(1), 10000);

    // 🔔 DISPATCHER FOR INSTANT REFRESH ON ACTION
    const handler = () => fetchNotifications(1);
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
