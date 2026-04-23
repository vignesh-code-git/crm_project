"use client";

import { useState, useEffect } from "react";
import styles from "./ProfileModal.module.css";
import { 
  HiOutlineXMark, 
  HiOutlineUser, 
  HiOutlineEnvelope, 
  HiOutlinePhone, 
  HiOutlineBuildingOffice, 
  HiOutlineGlobeAlt, 
  HiOutlineBriefcase, 
  HiOutlineLockClosed,
  HiOutlineShieldCheck
} from "react-icons/hi2";
import { showSuccess, showError } from "@/services/toastService";
import { API_BASE_URL } from "@/config/apiConfig";

export default function ProfileModal({ isOpen, onClose, user, onUpdate }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_name: "",
    industry_type: "",
    country: "",
    password: "",
    confirm_password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      console.log("🛠️ PROFILE DATA RECEIVED:", user);
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        company_name: user.company_name || "",
        industry_type: user.industry_type || "",
        country: user.country || "",
        password: "",
        confirm_password: "",
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛡️ PASSWORD VALIDATION
    if (formData.password !== "" || formData.confirm_password !== "") {
      if (formData.password !== formData.confirm_password) {
        showError("Passwords do not match!");
        return;
      }
      if (formData.password.length < 6) {
        showError("Password must be at least 6 characters long");
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload = { ...formData };
      delete payload.confirm_password;
      
      // If password is empty, don't send it to backend to avoid empty update
      if (!payload.password) delete payload.password;

      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update profile");
      }

      const updated = await res.json();
      showSuccess("Profile updated successfully!");
      if (onUpdate) onUpdate(updated);
      onClose();
    } catch (err) {
      console.error(err);
      showError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Account Settings</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>

        <div className={styles.scrollArea}>
          <form onSubmit={handleSubmit}>
            
            {/* 👤 PERSONAL INFO */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <HiOutlineUser />
                Personal Information
              </div>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>First Name</label>
                  <div className={styles.inputWrapper}>
                    <HiOutlineUser />
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="First name"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Last Name</label>
                  <div className={styles.inputWrapper}>
                    <HiOutlineUser />
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Email Address</label>
                  <div className={styles.inputWrapper}>
                    <HiOutlineEnvelope />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Phone Number</label>
                  <div className={styles.inputWrapper}>
                    <HiOutlinePhone />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 🏢 COMPANY INFO */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <HiOutlineBuildingOffice />
                Company Details
              </div>
              <div className={styles.formGrid}>
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label>Company Name</label>
                  <div className={styles.inputWrapper}>
                    <HiOutlineBuildingOffice />
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Industry</label>
                  <div className={styles.inputWrapper}>
                    <HiOutlineBriefcase />
                    <input
                      type="text"
                      value={formData.industry_type}
                      onChange={(e) => setFormData({ ...formData, industry_type: e.target.value })}
                      placeholder="e.g. Technology"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Country</label>
                  <div className={styles.inputWrapper}>
                    <HiOutlineGlobeAlt />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. India"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 🔐 SECURITY */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <HiOutlineLockClosed />
                Security & Password
              </div>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>New Password</label>
                  <div className={styles.inputWrapper}>
                    <HiOutlineLockClosed />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Confirm New Password</label>
                  <div className={styles.inputWrapper}>
                    <HiOutlineShieldCheck />
                    <input
                      type="password"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.saveBtn} 
            disabled={isSaving}
            onClick={handleSubmit}
          >
            {isSaving ? "Saving Changes..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
