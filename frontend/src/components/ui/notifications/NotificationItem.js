import { formatNotificationTime } from "./formatNotificationTime";
import styles from "./notification.module.css";

export default function NotificationItem({ n, onMarkAsRead }) {
  const handleClick = () => {
    if (!n.is_read) {
      onMarkAsRead(n.id);
    }
  };

  return (
    <div
      className={`${styles.item} ${!n.is_read ? styles.unread : ""}`}
      onClick={handleClick}
    >
      {!n.is_read && <div className={styles.dot}></div>}

      <div className={styles.row}>
        <span className={styles.message}>{n.message}</span>
        <span className={styles.time}>
          {formatNotificationTime(n.created_at || n.timestamp)}
        </span>
      </div>
    </div>
  );
}