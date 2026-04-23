import React from "react";
import styles from "./DashboardSkeletons.module.css";
import skeleton from "./Skeleton.module.css";

export const StatusBarSkeleton = () => (
  <div className={styles.statusBar}>
    {[...Array(4)].map((_, i) => (
      <div key={i} className={`${skeleton.box} ${styles.statusCard}`}>
        <div className={styles.statusContent}>
          <div className={`${skeleton.shimmer} ${styles.statusTitle}`} />
          <div className={`${skeleton.shimmer} ${styles.statusValue}`} />
        </div>
        <div className={`${skeleton.shimmer} ${styles.statusIcon}`} />
      </div>
    ))}
  </div>
);

export const ProgressBarSkeleton = () => (
  <div className={`${skeleton.box} ${styles.progressBox}`}>
    <div className={`${skeleton.shimmer} ${styles.progressHeading}`} />
    {[...Array(6)].map((_, i) => (
      <div key={i} className={styles.progressItem}>
        <div className={`${skeleton.shimmer} ${styles.progressLabel}`} />
        <div className={`${skeleton.shimmer} ${styles.progressBar}`} />
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className={`${skeleton.box} ${styles.chartBox}`}>
    <div className={`${skeleton.shimmer} ${styles.chartHeading}`} />
    <div className={styles.chartWrapper}>
      <div className={styles.yAxis}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`${skeleton.shimmer} ${styles.yLabel}`} />
        ))}
      </div>
      <div className={styles.chartArea}>
        {[...Array(12)].map((_, i) => (
          <div key={i} className={styles.chartCol}>
            <div 
              className={`${skeleton.shimmer} ${styles.chartBar}`} 
              style={{ height: `${[40, 70, 45, 90, 65, 30, 80, 55, 35, 75, 50, 60][i]}%` }} 
            />
            <div className={`${skeleton.shimmer} ${styles.xLabel}`} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

import TableSkeleton from "./TableSkeleton";

export const DashboardSkeleton = () => (
  <div className={styles.dashboardContainer}>
    <StatusBarSkeleton />
    <div className={styles.bottom}>
      <ProgressBarSkeleton />
      <ChartSkeleton />
    </div>
    <div style={{ marginTop: '24px' }}>
      <TableSkeleton rows={5} columns={4} />
    </div>
  </div>
);
