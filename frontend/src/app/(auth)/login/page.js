"use client";

import styles from "./page.module.css";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "@/config/apiConfig";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const validate = () => {
    let errors = {};
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      console.log("✅ Login success:", data);

      if (data.user.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/leads");
      }

    } catch (err) {
      console.error(err);
      setError("Network error. Please try again later.");
      setLoading(false);
    }
  };



  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {error && <div className={styles.errorAlert}>{error}</div>}
        <h2 className={styles.title}>Log in</h2>

        <form className={styles.form} onSubmit={handleLogin} noValidate>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className={fieldErrors.email ? styles.inputError : ""}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
              }}
            />
            {fieldErrors.email && <span className={styles.errorMessage}>{fieldErrors.email}</span>}
          </div>

          <div className={styles.field}>
            <div className={styles.passwordLabel}>
              <label>Password</label>
              <a
                href="/forgot-password"
                className={styles.forgot}
                style={{ textDecoration: "none" }}
              >
                Forgot password?
              </a>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className={fieldErrors.password ? styles.inputError : ""}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                }}
              />
              <span
                className={styles.eye}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>
            {fieldErrors.password && <span className={styles.errorMessage}>{fieldErrors.password}</span>}
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>

      <p className={styles.register}>
        Don't have an account?{" "}
        <Link href="/register">Sign up</Link>
      </p>
    </div>
  );
}