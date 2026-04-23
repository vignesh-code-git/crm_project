"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./SelectFilter.module.css";
import { FiChevronDown } from "react-icons/fi";
import { HiXMark } from "react-icons/hi2";

export default function SelectFilter({
  label = "Select",
  value = "",
  onChange,
  options = [],
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const toggleDropdown = () => {
    setOpen((prev) => !prev);
  };

  const handleSelect = (option) => {
    onChange(option);
    setOpen(false);
  };

  const clearFilter = (e) => {
    e.stopPropagation();
    onChange("");
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!ref.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.wrapper} ref={ref}>
      {/* Select box */}
      <div className={styles.selectBox} onClick={toggleDropdown}>
        <span className={styles.label}>
          {value || label}
        </span>

        <div className={styles.icons}>
          {value && (
            <HiXMark
              className={styles.clear}
              onClick={clearFilter}
            />
          )}

          <FiChevronDown
            className={`${styles.icon} ${open ? styles.rotate : ""}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className={styles.dropdown}>
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option}
                className={`${styles.option} ${
                  value === option ? styles.active : ""
                }`}
                onClick={() => handleSelect(option)}
              >
                {option}
              </div>
            ))
          ) : (
            <div className={styles.empty}>No options</div>
          )}
        </div>
      )}
    </div>
  );
}