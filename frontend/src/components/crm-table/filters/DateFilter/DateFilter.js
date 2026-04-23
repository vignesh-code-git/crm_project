"use client";

import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import styles from "./DateFilter.module.css";
import { GoCalendar } from "react-icons/go";
import { HiXMark } from "react-icons/hi2";

export default function DateFilter({
  value,
  onChange,
  label = "Select Date",
}) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  const ref = useRef(null);
  const dropdownRef = useRef(null);

  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  const handleSelect = (date) => {
    if (!date) return;

    const formatted = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
    onChange(formatted);
    setOpen(false);
  };

  const toggleCalendar = () => {
    setOpen((prev) => !prev);
  };

  const clearDate = (e) => {
    e.stopPropagation();
    onChange("");
  };

  // Close outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (!ref.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ESC close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // Prevent overflow
  useEffect(() => {
    if (!open) return;

    const rect = dropdownRef.current?.getBoundingClientRect();

    if (rect && rect.right > window.innerWidth) {
      setAlignRight(true);
    } else {
      setAlignRight(false);
    }
  }, [open]);

  return (
    <div className={styles.wrapper} ref={ref}>
      {/* 🔽 Input */}
      <div className={styles.filterBox} onClick={toggleCalendar}>
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

      {/* 📅 Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className={`${styles.dropdown} ${
            alignRight ? styles.right : ""
          }`}
        >
          <DatePicker
            inline
            selected={selectedDate}
            onChange={handleSelect}
            formatWeekDay={(name) => {
              const today = new Date().getDay();

              const days = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ];

              const index = days.indexOf(name);

              let color = "#6b7280";

              if (index === 0) color = "#ef4444";
              if (index === today) color = "#3b82f6";

              return (
                <span style={{ color, fontWeight: 600 }}>
                  {name.slice(0, 2)}
                </span>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}