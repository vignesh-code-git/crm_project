"use client";

import styles from "./Pagination.module.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function Pagination({ page, totalPages, onPageChange }) {
  const pages = [];
  const displayPages = totalPages > 0 ? totalPages : 1;

  for (let i = 1; i <= displayPages; i++) {
    pages.push(i);
  }

  const renderPages = () => {
    if (totalPages <= 7) {
      return pages.map((p) => (
        <button
          key={p}
          className={`${styles.page} ${page === p ? styles.active : ""}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ));
    }

    const items = [];
    items.push(1, 2, 3);
    items.push("...");
    items.push(totalPages - 1, totalPages);

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
      {/* Previous */}
      <button
        className={styles.nav}
        disabled={isOnlyOnePage || page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <FiChevronLeft size={18} />
        <span className={styles.navText}>Previous</span>
      </button>

      {/* Page Numbers */}
      <div className={styles.pagesWrapper}>
        {renderPages()}
      </div>

      {/* Next */}
      <button
        className={`${styles.nav} ${styles.next}`}
        disabled={isOnlyOnePage || page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <span className={styles.navText}>Next</span>
        <FiChevronRight size={18} />
      </button>
    </div>
  );
}