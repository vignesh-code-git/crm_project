"use client";

import { FiX, FiCheck } from "react-icons/fi";
import { HiOutlineShieldCheck } from "react-icons/hi";
import styles from "./PermissionsModal.module.css";

export default function PermissionsModal({ isOpen, onClose, userName }) {
  if (!isOpen) return null;

  const permissions = [
    {
      label: "Full System Authority",
      desc: "Complete administrative access across all CRM modules and entities."
    },
    {
      label: "User Management",
      desc: "Ability to create, modify roles, and permanently remove system accounts."
    },
    {
      label: "Data Administration",
      desc: "Bulk import and export capabilities for high-volume record management."
    },
    {
      label: "Security & Auditing",
      desc: "Access to all audit logs, system settings, and security configurations."
    },
    {
      label: "Financial Oversight",
      desc: "Full visibility and management of deals, pipelines, and revenue reports."
    }
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX />
          </button>
          
          <div className={styles.iconWrapper}>
            <HiOutlineShieldCheck />
          </div>
          
          <h2>Account Permissions</h2>
          <p>Administrative access for <strong>{userName}</strong></p>
        </div>

        <div className={styles.content}>
          <div className={styles.permissionGrid}>
            {permissions.map((p, idx) => (
              <div key={idx} className={styles.permissionItem}>
                <div className={styles.checkIcon}>
                  <FiCheck />
                </div>
                <div className={styles.text}>
                  <span className={styles.label}>{p.label}</span>
                  <span className={styles.desc}>{p.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.footerBtn} onClick={onClose}>
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
