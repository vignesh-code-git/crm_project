"use client";

import styles from "./ProfileViewModal.module.css";
import {
  HiOutlineXMark,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineBuildingOffice
} from "react-icons/hi2";

export default function ProfileViewModal({ isOpen, onClose, user }) {
  if (!isOpen) return null;

  const infoItems = [
    { label: "First Name", value: user?.first_name, icon: <HiOutlineUser /> },
    { label: "Last Name", value: user?.last_name, icon: <HiOutlineUser /> },
    { label: "Email Address", value: user?.email, icon: <HiOutlineEnvelope /> },
    { label: "Phone Number", value: user?.phone || "Not set", icon: <HiOutlinePhone /> },
    { label: "Company", value: user?.company_name || "Not set", icon: <HiOutlineBuildingOffice /> },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>My Profile</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
            <div className={styles.nameHeader}>
              <h4>{user?.first_name} {user?.last_name}</h4>
              <span className={styles.roleTag}>{user?.role || "User"}</span>
            </div>
          </div>

          <div className={styles.infoGrid}>
            {infoItems.map((item, idx) => (
              <div key={idx} className={styles.infoRow}>
                <div className={styles.iconBox}>{item.icon}</div>
                <div className={styles.details}>
                  <label>{item.label}</label>
                  <span>{item.value || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerTip}>To edit these details, please go to Settings.</p>
        </div>
      </div>
    </div>
  );
}
