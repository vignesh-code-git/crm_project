import React from "react";
import styles from "./TableSkeleton.module.css";
import skeleton from "./Skeleton.module.css";

export default function TableSkeleton({ rows = 6, columns = 6 }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {[...Array(columns)].map((_, i) => (
          <div key={i} className={styles.headerCell}>
            <div className={`${skeleton.shimmer} ${styles.headerBar}`} />
          </div>
        ))}
      </div>
      <div className={styles.body}>
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {[...Array(columns)].map((_, colIndex) => (
              <div key={colIndex} className={styles.cell}>
                <div className={`${skeleton.shimmer} ${styles.bar}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
