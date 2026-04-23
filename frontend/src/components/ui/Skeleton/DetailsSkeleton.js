import React from "react";
import styles from "./DetailsSkeleton.module.css";
import skeleton from "./Skeleton.module.css";

export default function DetailsSkeleton() {
  return (
    <div className={styles.container}>
      {/* Left Panel */}
      <div className={styles.leftPanel}>
        <div className={styles.leftHeaderSkeleton}>
          {/* Back Button Skeleton */}
          <div className={styles.backSkeleton}>
            <div className={`${skeleton.shimmer} ${styles.iconSmall}`} />
            <div className={`${skeleton.shimmer} ${styles.backTextSkeleton}`} />
          </div>

          <div className={styles.profileBox}>
            <div className={`${skeleton.shimmer} ${styles.avatar}`} />
            <div className={styles.profileText}>
              <div className={`${skeleton.shimmer} ${styles.name}`} />
              <div className={styles.emailRowSkeleton}>
                <div className={`${skeleton.shimmer} ${styles.subtitle}`} />
                <div className={`${skeleton.shimmer} ${styles.iconSmall}`} />
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className={styles.actionBarSkeleton}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={styles.actionItemSkeleton}>
                <div className={`${skeleton.shimmer} ${styles.actionIconBox}`} />
                <div className={`${skeleton.shimmer} ${styles.actionText}`} />
              </div>
            ))}
          </div>

          {/* Details Section Header */}
          <div className={styles.sectionHeaderSkeleton}>
            <div className={styles.sectionTitleGroup}>
              <div className={`${skeleton.shimmer} ${styles.sectionArrow}`} />
              <div className={`${skeleton.shimmer} ${styles.sectionTitle}`} />
            </div>
            <div className={`${skeleton.shimmer} ${styles.sectionEdit}`} />
          </div>
        </div>

        <div className={styles.leftContentSkeleton}>

          <div className={styles.detailsList}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles.detailItem}>
                <div className={`${skeleton.shimmer} ${styles.label}`} />
                <div className={`${skeleton.shimmer} ${styles.valueInput}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Panel */}
      <div className={styles.centerPanel}>
        <div className={styles.stickyHeaderSkeleton}>
          <div className={styles.activityHeaderSkeleton}>
            <div className={`${skeleton.shimmer} ${styles.searchBarSkeleton}`} />
            <div className={`${skeleton.shimmer} ${styles.convertBtnSkeleton}`} />
          </div>
          <div className={styles.tabsHeaderSkeleton}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${skeleton.shimmer} ${styles.tab}`} />
            ))}
          </div>
        </div>

        <div className={styles.activityFeed}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.activityItem}>
              <div className={styles.activityHeader}>
                <div className={styles.activityLeft}>
                  <div className={`${skeleton.shimmer} ${styles.activityIcon}`} />
                  <div className={styles.activityTextGroup}>
                    <div className={`${skeleton.shimmer} ${styles.activityTitle}`} />
                    <div className={`${skeleton.shimmer} ${styles.activityPreview}`} />
                  </div>
                </div>
                <div className={`${skeleton.shimmer} ${styles.activityDate}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className={styles.rightPanel}>
        {/* AI Summary Card */}
        <div className={styles.aiSummarySkeleton}>
          <div className={`${skeleton.shimmer} ${styles.aiHeaderTitle}`} />
          <div className={`${skeleton.shimmer} ${styles.aiTextLine}`} />
          <div className={`${skeleton.shimmer} ${styles.aiTextLine}`} />
        </div>

        {/* Attachments Section */}
        <div className={styles.attachmentsSkeleton}>
          <div className={styles.attachHeaderSkeleton}>
            <div className={`${skeleton.shimmer} ${styles.attachIcon}`} />
            <div className={`${skeleton.shimmer} ${styles.attachTitle}`} />
            <div className={`${skeleton.shimmer} ${styles.addBtnSkeleton}`} />
          </div>
          <div className={styles.attachListSkeleton}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={styles.attachItemSkeleton}>
                <div className={`${skeleton.shimmer} ${styles.attachThumb}`} />
                <div className={styles.attachInfoSkeleton}>
                  <div className={`${skeleton.shimmer} ${styles.attachNameSkeleton}`} />
                  <div className={`${skeleton.shimmer} ${styles.attachMetaSkeleton}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
