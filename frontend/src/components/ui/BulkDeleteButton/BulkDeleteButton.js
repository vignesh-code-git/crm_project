"use client";

import styles from "./BulkDeleteButton.module.css";
import { Trash2 } from "lucide-react";

export default function BulkDeleteButton({ count, onDelete, loading }) {
  if (count === 0) return null;

  return (
    <button
      className={styles.button}
      onClick={onDelete}
      disabled={loading}
    >
      <Trash2 size={16} />
      <span>Delete ({count})</span>
    </button>
  );
}
