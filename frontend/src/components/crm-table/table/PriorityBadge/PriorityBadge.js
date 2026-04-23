import styles from "./PriorityBadge.module.css";

export default function PriorityBadge({ priority }) {
  const getClass = () => {
    switch (priority?.toLowerCase()) {
      case "high":
        return styles.high;
      case "medium":
        return styles.medium;
      case "low":
        return styles.low;
      default:
        return styles.default;
    }
  };

  return (
    <span className={`${styles.badge} ${getClass()}`}>
      {priority}
    </span>
  );
}