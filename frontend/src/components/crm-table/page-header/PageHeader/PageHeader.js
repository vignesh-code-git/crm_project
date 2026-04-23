"use client";
import styles from "./PageHeader.module.css";

export default function PageHeader({ title, onImport, onCreate, onExport, children }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        
        {/* Page Title */}
        <h1 className={styles.title}>{title}</h1>

        {/* Header Buttons */}
        <div className={styles.actions}>
          {children}
          {onExport && (
            <button
              className={`${styles.baseBtn} ${styles.exportBtn}`}
              onClick={onExport}
            >
              Export
            </button>
          )}
          <button
            className={`${styles.baseBtn} ${styles.importBtn}`}
            onClick={onImport}
          >
            Import
          </button>

          <button
            className={`${styles.baseBtn} ${styles.createBtn}`}
            onClick={onCreate}
          >
            Create
          </button>
        </div>

      </div>
    </div>
  );
}