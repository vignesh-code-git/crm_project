"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineBell } from "react-icons/hi2";
import useNotificationApi from "@/hooks/useNotifications";
import NotificationPanel from "./NotificationPanel";
import styles from "./notification.module.css";

export default function NotificationBell() {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotificationApi();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.bell} onClick={() => setOpen(!open)}>
        <HiOutlineBell size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </div>

      {open && (
        <NotificationPanel
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
        />
      )}
    </div>
  );
}