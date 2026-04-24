"use client";

import styles from "./Pagination.module.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Pagination({ page, totalPages, onPageChange }) {
  const renderPages = () => {
    if (totalPages <= 0) return null;

    const items = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (page <= 3) {
        items.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        items.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        items.push(1, "...", page, "...", totalPages);
      }
    }

    return items.map((p, idx) => (
      p === "..." ? (
        <span key={`dots-${idx}`} className={styles.dots}>...</span>
      ) : (
        <button
          key={p}
          className={`${styles.page} ${page === p ? styles.active : ""}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      )
    ));
  };

  const isOnlyOnePage = totalPages <= 1;

  return (
    <div className={styles.pagination}>
      <button
        className={styles.nav}
        disabled={isOnlyOnePage || page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <FiChevronLeft size={18} />
        <span className={styles.navText}>Previous</span>
      </button>

      <div className={styles.pagesWrapper}>
        {renderPages()}
      </div>

      <button
        className={styles.nav}
        disabled={isOnlyOnePage || page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <span className={styles.navText}>Next</span>
        <FiChevronRight size={18} />
      </button>
    </div>
  );
}