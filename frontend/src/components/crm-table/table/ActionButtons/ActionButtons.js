"use client";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import styles from "./ActionButtons.module.css";

export default function ActionButtons({ onEdit, onDelete }) {

  return (
    <div className={styles.actions}>

      <FiEdit2
        className={styles.edit}
        onClick={onEdit}
      />

      <FiTrash2
        className={styles.delete}
        onClick={onDelete}
      />

    </div>
  );
}