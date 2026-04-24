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

export default function NotificationPanel({ notifications, onMarkAsRead, onMarkAllAsRead, onDelete }) {
  const latestNotifications = notifications.slice(0, 10);
  const groups = groupNotifications(latestNotifications);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>Notifications</span>
        <button className={styles.markAll} onClick={onMarkAllAsRead}>
          Mark all as read
        </button>
      </div>

      <div className={styles.list}>
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

        {notifications.length === 0 && (
          <div className={styles.empty}>No notifications</div>
        )}
      </div>
    </div>
  );
}