import styles from "./StatusBadge.module.css";

export default function StatusBadge({ status }) {
  const getStatusClass = () => {
    switch (status?.toLowerCase()) {
      case "open":
        return styles.open;
      case "new":
        return styles.new;
      case "in progress":
        return styles.progress;
      case "closed":
        return styles.closed;
      default:
        return styles.default;
    }
  };

  return (
    <span className={`${styles.badge} ${getStatusClass()}`}>
      {status}
    </span>
  );
}