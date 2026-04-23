"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { FiChevronDown } from "react-icons/fi";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { API_BASE_URL } from "@/config/apiConfig";

export default function RegisterForm() {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    company_name: "",
    industry_type: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const options = ["IT", "Finance", "Healthcare", "Education"];

  const validate = () => {
    let errors = {};
    if (!form.first_name) errors.first_name = "First name is required";
    if (!form.last_name) errors.last_name = "Last name is required";
    // Email is now optional per user request
    // if (!form.email) errors.email = "Email is required";
    if (!form.phone) errors.phone = "Phone number is required";
    if (!form.password) errors.password = "Password is required";
    if (!form.company_name) errors.company_name = "Company name is required";
    if (!form.industry_type) errors.industry_type = "Industry type is required";
    if (!form.country) errors.country = "Country is required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      console.log("✅ Registered:", data);
      router.push("/login");

    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };


  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {error && <div className={styles.errorAlert}>{error}</div>}
        <h2 className={styles.title}>Register</h2>

        <div className={styles.formGrid}>
          {/* First Name */}
          <div className={styles.field}>
            <label>First Name</label>
            <input
              type="text"
              placeholder="Enter your first name"
              className={fieldErrors.first_name ? styles.inputError : ""}
              onChange={(e) => handleChange("first_name", e.target.value)}
            />
            {fieldErrors.first_name && <span className={styles.errorMessage}>{fieldErrors.first_name}</span>}
          </div>

          {/* Last Name */}
          <div className={styles.field}>
            <label>Last Name</label>
            <input
              type="text"
              placeholder="Enter your last name"
              className={fieldErrors.last_name ? styles.inputError : ""}
              onChange={(e) => handleChange("last_name", e.target.value)}
            />
            {fieldErrors.last_name && <span className={styles.errorMessage}>{fieldErrors.last_name}</span>}
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className={fieldErrors.email ? styles.inputError : ""}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            {fieldErrors.email && <span className={styles.errorMessage}>{fieldErrors.email}</span>}
          </div>

          {/* Phone */}
          <div className={styles.field}>
            <label>Phone Number</label>
            <PhoneInput
              country={"in"}
              value={form.phone}
              onChange={(phone) => handleChange("phone", "+" + phone)}
              inputClass={`${styles.phoneInput} ${fieldErrors.phone ? styles.inputError : ""}`}
              containerClass={styles.phoneContainer}
              buttonClass={styles.flagButton}
              dropdownClass={styles.flagDropdown}
            />
            {fieldErrors.phone && <span className={styles.errorMessage}>{fieldErrors.phone}</span>}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className={fieldErrors.password ? styles.inputError : ""}
              onChange={(e) => handleChange("password", e.target.value)}
            />
            {fieldErrors.password && <span className={styles.errorMessage}>{fieldErrors.password}</span>}
          </div>

          {/* Company */}
          <div className={styles.field}>
            <label>Company Name</label>
            <input
              type="text"
              placeholder="Enter your company name"
              className={fieldErrors.company_name ? styles.inputError : ""}
              onChange={(e) => handleChange("company_name", e.target.value)}
            />
            {fieldErrors.company_name && <span className={styles.errorMessage}>{fieldErrors.company_name}</span>}
          </div>

          {/* Industry */}
          <div className={styles.field}>
            <label>Industry Type</label>

            <div className={styles.dropdown}>
              <div
                className={`${styles.control} ${fieldErrors.industry_type ? styles.inputError : ""}`}
                onClick={() => setOpen(!open)}
              >
                {form.industry_type || "Choose"}
                <FiChevronDown className={`${styles.arrow} ${open ? styles.rotate : ""}`} />
              </div>

              {open && (
                <div className={styles.menu}>
                  {options.map((item) => (
                    <div
                      key={item}
                      className={`${styles.option} ${form.industry_type === item ? styles.activeOption : ""}`}
                      onClick={() => {
                        handleChange("industry_type", item);
                        setOpen(false);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {fieldErrors.industry_type && <span className={styles.errorMessage}>{fieldErrors.industry_type}</span>}
          </div>

          {/* Country */}
          <div className={styles.field}>
            <label>Country or Region</label>
            <input
              type="text"
              placeholder="Enter your country"
              className={fieldErrors.country ? styles.inputError : ""}
              onChange={(e) => handleChange("country", e.target.value)}
            />
            {fieldErrors.country && <span className={styles.errorMessage}>{fieldErrors.country}</span>}
          </div>
        </div>

        <button className={styles.button} onClick={handleRegister} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </div>

      <p className={styles.login}>
        Already have an account?{" "}
        <Link href="/login">Login</Link>
      </p>
    </div>
  );
}