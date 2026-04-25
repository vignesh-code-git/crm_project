import { useEffect, useRef } from "react";
import NotificationCard from "./NotificationCard";
import styles from "./notification.module.css";
import { format, isToday, isYesterday, startOfDay } from "date-fns";

function groupNotifications(notifications) {
  const groups = new Map();

  notifications.forEach((n) => {
    const rawDate = n.created_at || n.timestamp;
    const date = rawDate ? new Date(rawDate) : null;

    if (!date || isNaN(date.getTime())) {
      const key = "Earlier";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(n);
      return;
    }

    const dayStart = startOfDay(date).getTime();
    let label = "";

    if (isToday(date)) {
      label = `Today - ${format(date, "eeee, MMM d")}`;
    } else if (isYesterday(date)) {
      label = `Yesterday - ${format(date, "eeee, MMM d")}`;
    } else {
      label = format(date, "eeee, MMM d, yyyy");
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label).push(n);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export default function NotificationPanel({ notifications, onMarkAsRead, onMarkAllAsRead, onDelete, onFetchMore, hasMore, loading, total }) {
  const listRef = useRef(null);

  // Group notifications by date
  const groups = notifications.reduce((acc, n) => {
    const date = new Date(n.created_at || n.timestamp);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(n);
    return acc;
  }, {});

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>Notifications</h3>
        <button className={styles.markAll} onClick={onMarkAllAsRead}>
          Mark all as read
        </button>
      </div>

      <div className={styles.list} ref={listRef}>
        {Object.entries(groups).map(([date, items]) => (
          <div key={date} className={styles.group}>
            <div className={styles.dateHeader}>{date}</div>
            <div className={styles.groupItems}>
              {items.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onRead={onMarkAsRead}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))}

        {notifications.length === 0 && !loading && (
          <div className={styles.empty}>No notifications</div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className={styles.bottomBar}>
          <span className={styles.resultCount}>
            Showing {notifications.length} of {total}
          </span>
          {hasMore ? (
            <button
              className={styles.viewMoreBtn}
              onClick={onFetchMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "View More"}
            </button>
          ) : (
            <span className={styles.allCaughtUp}>All caught up</span>
          )}
        </div>
      )}
    </div>
  );
}