"use client";

import styles from "./page.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/config/apiConfig";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send reset link");
        return;
      }

      setMessage("Reset link sent! Please check your email inbox.");
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
        <h2 className={styles.title}>Forgot Password</h2>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#666", fontSize: "14px" }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form className={styles.form} onSubmit={handleResetRequest}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Sending..." : "Send Reset Link"}
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
