"use client";

import { FiSearch } from "react-icons/fi";
import styles from "./SearchFilter.module.css";

export default function SearchBar({
  value = "",
  onChange,
  placeholder = "Search...",
}) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const clearSearch = () => {
    onChange("");
  };

  return (
    <div className={styles.wrapper}>
      {/* 🔍 Icon */}
      <FiSearch className={styles.icon} size={18} />

      {/* 🔤 Input */}
      <input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />

      {/* ❌ Clear button (optional UX improvement) */}
      {value && (
        <button
          className={styles.clear}
          onClick={clearSearch}
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
}