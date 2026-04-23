"use client";

import styles from "./page.module.css";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Link from "next/link";
import { API_BASE_URL } from "@/config/apiConfig";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();
  const params = useParams();
  const { token } = params;

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to reset password");
        return;
      }

      setMessage("Password updated successfully! Redirecting to login...");
      
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);

    } catch (err) {
      console.error(err);
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>Reset Password</h2>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#666", fontSize: "14px" }}>
          Please enter your new password below.
        </p>

        <form className={styles.form} onSubmit={handleResetPassword}>
          <div className={styles.field}>
            <label>New Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className={styles.eye}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
          </div>

          <div className={styles.field}>
            <label>Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {message && (
            <p style={{ color: "#10b981", fontSize: "14px", textAlign: "center", marginTop: "10px" }}>
              {message}
            </p>
          )}
          {error && (
            <p style={{ color: "#ef4444", fontSize: "14px", textAlign: "center", marginTop: "10px" }}>
              {error}
            </p>
          )}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <span 
            onClick={() => window.location.href = "/login"} 
            style={{ color: "#5b4ee5", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
          >
            Back to Login
          </span>
        </div>
      </div>
    </div>
  );
}
