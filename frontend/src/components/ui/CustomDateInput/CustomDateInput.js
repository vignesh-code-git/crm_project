"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./CustomDateInput.module.css";
import { GoCalendar } from "react-icons/go";

export default function CustomDateInput({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  error = false,
  centered = false,
  compact = false,
  extraCompact = false // 🔥 Added extraCompact prop
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
    if (!open) {
      const rect = ref.current.getBoundingClientRect();
      const mobile = window.innerWidth <= 768;
      const spaceBelow = window.innerHeight - rect.bottom;

      setIsMobile(mobile);
      setIsTop(spaceBelow < 350);
    }
    setOpen((prev) => !prev);
  };

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
    <div className={styles.container} ref={ref}>
      <div
        className={`${styles.inputBox} ${disabled ? styles.disabled : ""} ${error ? styles.inputError : ""}`}
        onClick={toggleCalendar}
      >
        <span className={styles.value}>
          {value || <span className={styles.placeholder}>{placeholder}</span>}
        </span>
        <GoCalendar className={styles.icon} />
      </div>

      {open && (
        isMobile && typeof document !== "undefined" ? createPortal(
          <>
            <div className={styles.mobileBackdrop} onClick={() => setOpen(false)} />
            <div
              className={`${styles.dropdown} ${styles.mobileDropdown}`}
              ref={dropdownRef}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 99999
              }}
            >
              <div className={styles.inner}>
                <DatePicker
                  inline
                  selected={selectedDate}
                  onChange={handleSelect}
                  formatWeekDay={(nameOfDay) => nameOfDay.substring(0, 2)}
                />
              </div>
            </div>
          </>,
          document.body
        ) : (
          <>
            <div
              className={`
                ${styles.dropdown} 
                ${isTop ? styles.dropdownTop : ""} 
                ${compact ? styles.compactDropdown : ""}
              `}
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: isTop ? 'auto' : 'calc(100% + 10px)',
                bottom: isTop ? 'calc(100% + 10px)' : 'auto',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000
              }}
            >
              {/* Standard Arrows for Desktop */}
              {isTop && <div className={styles.arrowBottom} />}
              {!isTop && <div className={styles.arrowTop} />}

              <div className={styles.inner}>
                <DatePicker
                  inline
                  selected={selectedDate}
                  onChange={handleSelect}
                  formatWeekDay={(nameOfDay) => nameOfDay.substring(0, 3)}
                />
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
