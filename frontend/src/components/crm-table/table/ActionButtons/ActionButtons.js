"use client";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { HiOutlineShieldCheck } from "react-icons/hi";
import styles from "./ActionButtons.module.css";

export default function ActionButtons({ onEdit, onDelete, onSpecial }) {

  return (
    <div className={styles.actions}>

      {onSpecial && (
        <HiOutlineShieldCheck
          className={styles.special}
          onClick={onSpecial}
          title="Permissions"
        />
      )}

      <FiEdit2
        className={styles.edit}
        onClick={onEdit}
      />

      {onDelete && (
        <FiTrash2
          className={styles.delete}
          onClick={onDelete}
        />
      )}
    </div>
  );
}