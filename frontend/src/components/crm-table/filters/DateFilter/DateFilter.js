"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import styles from "./DateFilter.module.css";
import { GoCalendar } from "react-icons/go";
import { HiXMark } from "react-icons/hi2";

export default function DateFilter({
  value,
  onChange,
  label = "Select Date",
  error = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [isTop, setIsTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef(null);
  const dropdownRef = useRef(null);

  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  const handleSelect = (date) => {
    if (!date) return;
    const formatted = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
    onChange(formatted);
    setOpen(false);
  };

  const toggleCalendar = (e) => {
    if (disabled) return;
    e.stopPropagation();

    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const mobile = window.innerWidth <= 1024;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      setIsMobile(mobile);
      setIsTop(spaceBelow < 350);
    }

    setOpen((prev) => !prev); // Toggle logic: Click open / Click close
  };

  const clearDate = (e) => {
    if (disabled) return;
    e.stopPropagation();
    onChange("");
    setOpen(false);
  };

  // Close outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className={styles.wrapper} ref={ref}>
      {/* 🔽 Visible Filter Box */}
      <div
        className={`${styles.filterBox} ${error ? styles.errorBox : ""} ${disabled ? styles.disabledBox : ""}`}
        onClick={toggleCalendar}
      >
        <span className={styles.label}>
          {value || label}
        </span>

        <div className={styles.icons}>
          {value && (
            <HiXMark
              className={styles.clear}
              onClick={clearDate}
            />
          )}
          <GoCalendar className={styles.icon} />
        </div>
      </div>

      {/* 📅 Calendar Dropdown */}
      {open && (
        isMobile && typeof document !== "undefined" ? createPortal(
          <>
            <div className={styles.mobileOverlay} onClick={() => setOpen(false)} />
            <div className={`${styles.dropdown} ${styles.mobileDropdown}`} ref={dropdownRef} style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 99999
            }}>
              <div className={styles.inner}>
                <DatePicker
                  inline
                  selected={selectedDate}
                  onChange={handleSelect}
                />
              </div>
            </div>
          </>,
          document.body
        ) : (
          <>
            <div className={styles.mobileOverlay} onClick={() => setOpen(false)} />
            <div className={`${styles.dropdown} ${isTop ? styles.dropdownTop : ""}`} ref={dropdownRef}>
              <div className={styles.inner}>
                <DatePicker
                  inline
                  selected={selectedDate}
                  onChange={handleSelect}
                />
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}