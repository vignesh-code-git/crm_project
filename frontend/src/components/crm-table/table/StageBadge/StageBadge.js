import styles from "./StageBadge.module.css";

export default function StatusBadge({ status }) {
  return <span className={styles.badge}>{status}</span>;
}