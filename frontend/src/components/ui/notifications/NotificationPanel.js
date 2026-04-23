import NotificationCard from "./NotificationCard";
import styles from "./notification.module.css";

function groupNotifications(notifications) {
  const today = [];
  const yesterday = [];
  const older = [];
  const now = new Date();

  notifications.forEach((n) => {
    const rawDate = n.created_at || n.timestamp;
    const date = rawDate ? new Date(rawDate) : null;

    // Safety check for Invalid Date
    if (!date || isNaN(date.getTime())) {
      older.push(n);
      return;
    }

    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) today.push(n);
    else if (diffDays === 1) yesterday.push(n);
    else older.push(n);
  });

  return { today, yesterday, older };
}

export default function NotificationPanel({ notifications, onMarkAsRead, onMarkAllAsRead, onDelete }) {
  const latestNotifications = notifications.slice(0, 10);
  const { today, yesterday, older } = groupNotifications(latestNotifications);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>Notifications</span>
        <button className={styles.markAll} onClick={onMarkAllAsRead}>
          Mark all as read
        </button>
      </div>

      <div className={styles.list}>
        {today.length > 0 && (
          <>
            <div className={styles.groupTitle}>Today</div>
            {today.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </>
        )}

        {yesterday.length > 0 && (
          <>
            <div className={styles.groupTitle}>Yesterday</div>
            {yesterday.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onRead={onMarkAsRead}
              />
            ))}
          </>
        )}

        {older.length > 0 && (
          <>
            <div className={styles.groupTitle}>Earlier</div>
            {older.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onRead={onMarkAsRead}
              />
            ))}
          </>
        )}

        {notifications.length === 0 && (
          <div className={styles.empty}>No notifications</div>
        )}
      </div>
    </div>
  );
}