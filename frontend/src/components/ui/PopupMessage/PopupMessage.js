"use client";

import styles from "./PopupMessage.module.css";
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo } from "react-icons/fi";

export default function PopupMessage({ 
  title, 
  message, 
  type = "error", 
  onClose,
  show = false 
}) {
  if (!show) return null;

  const Icon = type === "error" ? FiAlertCircle : type === "success" ? FiCheckCircle : FiInfo;

  return (
    <div className={styles.wrapper} onClick={onClose}>
      <div className={styles.overlay} />
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={`${styles.iconWrapper} ${styles[type]}`}>
            <Icon />
          </div>
          <h3>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className={styles.content}>
          <p className={styles[type]}>{message}</p>
        </div>
      </div>
    </div>
  );
}
