"use client";

import styles from "./Pagination.module.css";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

export default function Pagination({ page, totalPages, onPageChange }) {

  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className={styles.pagination}>

      {/* Previous */}
      <button
        className={styles.nav}
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <FiArrowLeft /> Previous
      </button>

      {/* Page Numbers */}
      {pages.map((p) => (
        <button
          key={p}
          className={`${styles.page} ${page === p ? styles.active : ""}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {/* Next */}
      <button
        className={styles.nav}
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next <FiArrowRight />
      </button>

    </div>
  );
}