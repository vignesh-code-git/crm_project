"use client";

import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./CustomDateInput.module.css";
import { GoCalendar } from "react-icons/go";

export default function CustomDateInput({ value, onChange, placeholder = "Select date", disabled = false, error = false }) {
  const [open, setOpen] = useState(false);
  const [isTop, setIsTop] = useState(false);
  const ref = useRef(null);

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
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If space below is less than 350px, open upwards
      if (spaceBelow < 350) {
        setIsTop(true);
      } else {
        setIsTop(false);
      }
    }
  }, [open]);

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
        <div className={`${styles.dropdown} ${isTop ? styles.dropdownTop : ""}`}>
          <DatePicker
            inline
            selected={selectedDate}
            onChange={handleSelect}
          />
        </div>
      )}
    </div>
  );
}
