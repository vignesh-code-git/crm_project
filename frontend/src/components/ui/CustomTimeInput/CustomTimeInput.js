"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./CustomTimeInput.module.css";
import { FiClock } from "react-icons/fi";

export default function CustomTimeInput({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  error = false,
  centered = false,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const [isTop, setIsTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef(null);
  const dropdownRef = useRef(null);

  // Parse "HH:mm:ss" -> { hour12, minute, second, ampm }
  const parseTime = (val) => {
    if (!val) return { h: "12", m: "00", s: "00", a: "AM" };
    const [hh, mm, ss] = val.split(":");
    let h24 = parseInt(hh, 10);
    const a = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return {
      h: h12.toString().padStart(2, "0"),
      m: (mm || "00").toString().padStart(2, "0"),
      s: (ss || "00").toString().padStart(2, "0"),
      a: a
    };
  };

  const timeState = parseTime(value);

  const handleUpdate = (type, val) => {
    let { h, m, s, a } = timeState;
    if (type === 'h') h = val;
    if (type === 'm') m = val;
    if (type === 's') s = val;
    if (type === 'a') a = val;

    let h24 = parseInt(h, 10);
    if (a === "PM" && h24 !== 12) h24 += 12;
    if (a === "AM" && h24 === 12) h24 = 0;

    const finalVal = `${h24.toString().padStart(2, "0")}:${m}:${s}`;
    onChange(finalVal);
  };

  const toggleDropdown = (e) => {
    if (disabled) return;
    e.stopPropagation();

    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const mobile = window.innerWidth <= 768;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      setIsMobile(mobile);
      setIsTop(spaceBelow < 250);
    }

    setOpen((prev) => !prev);
  };

  const handleClickOutside = (e) => {
    if (
      ref.current && !ref.current.contains(e.target) &&
      (!dropdownRef.current || !dropdownRef.current.contains(e.target))
    ) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Render arrays

  // Render arrays
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
  const seconds = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
  const ampms = ["AM", "PM"];

  const displayValue = value ? `${timeState.h}:${timeState.m}:${timeState.s} ${timeState.a}` : "";

  const renderDropdownContent = () => (
    <div className={styles.dialContainer}>
      <div className={styles.column}>
        <div className={styles.colHeader}>Hr</div>
        <div className={styles.scrollArea}>
          {hours.map(h => (
            <div
              key={h}
              className={`${styles.dialItem} ${timeState.h === h ? styles.activeItem : ""}`}
              onClick={() => handleUpdate('h', h)}
            >
              {h}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.column}>
        <div className={styles.colHeader}>Min</div>
        <div className={styles.scrollArea}>
          {minutes.map(m => (
            <div
              key={m}
              className={`${styles.dialItem} ${timeState.m === m ? styles.activeItem : ""}`}
              onClick={() => handleUpdate('m', m)}
            >
              {m}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.column}>
        <div className={styles.colHeader}>Sec</div>
        <div className={styles.scrollArea}>
          {seconds.map(s => (
            <div
              key={s}
              className={`${styles.dialItem} ${timeState.s === s ? styles.activeItem : ""}`}
              onClick={() => handleUpdate('s', s)}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.column}>
        <div className={styles.colHeader}>AM/PM</div>
        <div className={styles.scrollArea}>
          {ampms.map(a => (
            <div
              key={a}
              className={`${styles.dialItem} ${timeState.a === a ? styles.activeItem : ""}`}
              onClick={() => handleUpdate('a', a)}
            >
              {a}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.wrapper} ref={ref}>
      <div
        className={`
          ${styles.inputBox} 
          ${error ? styles.errorBox : ""} 
          ${disabled ? styles.disabledBox : ""}
          ${centered ? styles.centeredText : ""}
          ${compact ? styles.compactBox : ""}
        `}
        onClick={toggleDropdown}
      >
        <span className={displayValue ? styles.value : styles.placeholder}>
          {displayValue || <span className={styles.placeholderText}>{placeholder}</span>}
        </span>
        <FiClock className={styles.icon} />
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
              {renderDropdownContent()}
            </div>
          </>,
          document.body
        ) : (
          <div
            className={`
              ${styles.dropdown} 
              ${isTop ? styles.dropdownTop : ""} 
            `}
            style={{
              position: 'absolute',
              top: isTop ? 'auto' : 'calc(100% + 10px)',
              bottom: isTop ? 'calc(100% + 10px)' : 'auto',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000
            }}
          >
            {isTop && <div className={styles.arrowBottom} />}
            {!isTop && <div className={styles.arrowTop} />}
            {renderDropdownContent()}
          </div>
        )
      )}
    </div>
  );
}
