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

export default function NotificationPanel({ notifications, onMarkAsRead, onMarkAllAsRead, onDelete, onFetchMore, hasMore, loading }) {
  const groups = groupNotifications(notifications);
  const sentryRef = useRef(null);
  const listRef = useRef(null);

  // 🔄 INFINITE SCROLL OBSERVER
  useEffect(() => {
    if (!hasMore || !listRef.current || !sentryRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          console.log("🚀 Sentry reached, fetching more...");
          onFetchMore();
        }
      },
      { 
        root: listRef.current,
        rootMargin: '100px', // Fetch when 100px away from bottom
      }
    );

    if (sentryRef.current) {
      observer.observe(sentryRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onFetchMore]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>Notifications</span>
        <button className={styles.markAll} onClick={onMarkAllAsRead}>
          Mark all as read
        </button>
      </div>

      <div className={styles.list} ref={listRef}>
        {groups.map((group, idx) => (
          <div key={idx} className={styles.groupContainer}>
            <div className={styles.groupTitle}>{group.label}</div>
            <div className={styles.groupItems}>
              {group.items.map((n) => (
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

        <div 
          ref={sentryRef} 
          style={{ height: '20px', margin: '10px 0', opacity: hasMore ? 1 : 0 }}
        >
          {hasMore && (
            <div className={styles.loadMoreWrapper}>
              <div className={styles.loadMoreBtn}>
                {loading ? "Loading..." : "Fetching more..."}
              </div>
            </div>
          )}
        </div>

        {notifications.length === 0 && !loading && (
          <div className={styles.empty}>No notifications</div>
        )}
      </div>
    </div>
  );
}