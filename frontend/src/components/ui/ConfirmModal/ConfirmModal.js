"use client";

import styles from "./ConfirmModal.module.css";
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Delete", 
  loading = false 
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.overlay} onClick={loading ? null : onClose} />
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} disabled={loading}>
          <X size={20} />
        </button>

        <div className={styles.content}>
          <div className={styles.headerTitle}>
            <div className={styles.iconWrapper}>
              <AlertTriangle className={styles.icon} />
            </div>
            <h3>{title}</h3>
          </div>
          <p>{message}</p>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.cancelBtn} 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className={styles.confirmBtn} 
            onClick={onConfirm} 
            disabled={loading}
          >
            {loading ? (
              <span className={styles.loader}>Processing...</span>
            ) : (
              <>
                <Trash2 size={16} />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
