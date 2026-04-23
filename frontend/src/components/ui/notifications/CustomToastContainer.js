"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import NotificationCard from "./NotificationCard";
import styles from "./notification.module.css";

export default function CustomToastContainer() {
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleTrigger = (event) => {
      const { notification, duration = 5000 } = event.detail;
      
      // ✅ Simple duplicate prevention (by message)
      setToasts((prev) => {
        const isDuplicate = prev.some(t => t.message === notification.message && (Date.now() - new Date(t.created_at).getTime() < 1000));
        if (isDuplicate) return prev;

        const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        const newToast = { ...notification, id };
        
        if (duration !== Infinity) {
          setTimeout(() => {
            removeToast(id);
          }, duration);
        }

        return [...prev, newToast];
      });
    };

    window.addEventListener("triggerCustomToast", handleTrigger);
    return () => window.removeEventListener("triggerCustomToast", handleTrigger);
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => String(t.id) !== String(id)));
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div className={styles.customToastWrapper} id="custom-toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toastAnimationWrapper}>
          <NotificationCard
            notification={toast}
            onClose={() => removeToast(toast.id)}
            isToast={true}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}
