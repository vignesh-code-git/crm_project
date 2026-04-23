import styles from "./StatusBadge.module.css";

export default function StatusBadge({ status }) {
  const getStatusClass = () => {
    const s = status?.toLowerCase() || "";
    
    // Core (Originals)
    if (s === "new") return styles.new;
    if (s === "open") return styles.open;
    if (s === "in progress") return styles.progress;
    if (s === "closed") return styles.closed;

    // Milestones (Professional)
    if (s === "qualified") return styles.qualified;
    if (s === "converted") return styles.converted;
    if (s === "contacted") return styles.contacted;
    
    // Additional Unique States
    if (s === "disqualified") return styles.disqualified;
    if (s === "qualified to buy") return styles.qualifiedBuy;
    if (s === "closed won") return styles.won;
    if (s === "closed lost") return styles.lost;
    if (s === "nurturing") return styles.nurturing;
    if (s === "pending") return styles.pending;
    if (s === "resolved") return styles.resolved;

    return styles.default;
  };

  return (
    <span className={`${styles.badge} ${getStatusClass()}`}>
      {status}
    </span>
  );
}