"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./settings.module.css";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineBuildingOffice,
  HiOutlineGlobeAlt,
  HiOutlineBriefcase,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeSlash
} from "react-icons/hi2";
import { showSuccess, showError, showInfo } from "@/services/toastService";
import { API_BASE_URL } from "@/config/apiConfig";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // FETCH PROFILE ON MOUNT
  useEffect(() => {
    document.title = "Settings | CRM";
    fetch(`${API_BASE_URL}/api/users/profile`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          company_name: data.company_name || "",
          industry_type: data.industry_type || "",
          country: data.country || "",
          password: "",
          confirm_password: "",
        });
      })
      .catch(err => {
        console.error("Fetch error:", err);
        showError("Failed to load profile");
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    if (formData.password !== "" || formData.confirm_password !== "") {
      if (formData.password !== formData.confirm_password) {
        showError("Passwords do not match!");
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = { ...formData };
      delete payload.confirm_password;
      if (!payload.password) delete payload.password;

      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update profile");

      showSuccess("Settings updated successfully!");
    } catch (err) {
      showError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("Are you ABSOLUTELY sure? This action is permanent and will delete all your data.");
    if (!confirm) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete account");

      showInfo("Your account has been removed. Redirecting...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      showError(err.message);
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container} style={{ textAlign: "center", paddingTop: "100px" }}>
          <p style={{ color: "#64748b", fontSize: "16px", fontWeight: "600" }}>Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Account Settings</h1>
          <p>Manage your professional profile and security preferences.</p>
        </div>

        {/* 👤 PERSONAL INFO */}
        <div className={styles.card}>
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
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <div className={styles.inputWrapper}>
                  <HiOutlineEnvelope />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
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
        </div>

        {/* 🏢 COMPANY DETAILS */}
        <div className={styles.card}>
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
              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
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
        </div>

        {/* 🔐 SECURITY */}
        <div className={styles.card}>
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
                    type={showPassword ? "text" : "password"}
                    className={styles.passwordInput}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="new-password"
                  />
                  <button 
                    type="button" 
                    className={styles.eyeButton}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <HiOutlineEyeSlash className={styles.eyeIcon} /> : <HiOutlineEye className={styles.eyeIcon} />}
                  </button>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <HiOutlineShieldCheck />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={styles.passwordInput}
                    placeholder="••••••••"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    autoComplete="new-password"
                  />
                  <button 
                    type="button" 
                    className={styles.eyeButton}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <HiOutlineEyeSlash className={styles.eyeIcon} /> : <HiOutlineEye className={styles.eyeIcon} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACCOUNT MANAGEMENT */}
        <div className={`${styles.card} ${styles.dangerZone}`}>
          <div className={styles.dangerBody}>
            <div className={styles.dangerInfo}>
              <h4>Delete Account</h4>
              <p>Once you delete your account, there is no going back. Please be certain.</p>
            </div>
            <button
              className={styles.deleteBtn}
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              <HiOutlineTrash /> {isDeleting ? "Deleting..." : "Permanently Delete"}
            </button>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={() => router.push("/companies")}
          >
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving Changes..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
