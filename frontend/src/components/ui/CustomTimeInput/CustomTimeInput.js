import React, { useState, useRef, useEffect } from 'react';
import { FiClock } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import styles from './CustomTimeInput.module.css';

const CustomTimeInput = ({ value, onChange, label, error, disabled, placeholder = "Select Time" }) => {
  const [open, setOpen] = useState(false);
  const [isTop, setIsTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const dropdownRef = useRef(null);

  // Time states: HR, MIN, SEC, Period
  const [hours, setHours] = useState("12");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");
  const [period, setPeriod] = useState("PM");

  useEffect(() => {
    if (value) {
      const match = value.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)/i);
      if (match) {
        setHours(match[1].padStart(2, '0'));
        setMinutes(match[2].padStart(2, '0'));
        setSeconds((match[3] || "00").padStart(2, '0'));
        setPeriod(match[4].toUpperCase());
      }
    }
  }, [value]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (
        ref.current && !ref.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const updatePosition = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mobile = window.innerWidth <= 1200;
    const spaceBelow = window.innerHeight - rect.bottom;

    setIsMobile(mobile);
    setIsTop(spaceBelow < 350);
    setCoords({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width
    });
  };

  const handleClick = (e) => {
    if (disabled) return;
    e.stopPropagation();
    updatePosition();
    setOpen((prev) => !prev);
  };

  const handleTimeChange = (h, m, s, p) => {
    const newTime = `${h}:${m}:${s} ${p}`;
    onChange(newTime);
  };

  const renderDropdownContent = () => (
    <div className={styles.timePickerContainer}>
      <div className={styles.column}>
        <div className={styles.label}>HR</div>
        <div className={styles.scroll}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
            const val = h.toString().padStart(2, '0');
            return (
              <div
                key={h}
                className={`${styles.option} ${hours === val ? styles.selected : ""}`}
                onClick={() => {
                  setHours(val);
                  handleTimeChange(val, minutes, seconds, period);
                }}
              >
                {val}
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.column}>
        <div className={styles.label}>MIN</div>
        <div className={styles.scroll}>
          {Array.from({ length: 60 }, (_, i) => i).map((m) => {
            const val = m.toString().padStart(2, '0');
            return (
              <div
                key={m}
                className={`${styles.option} ${minutes === val ? styles.selected : ""}`}
                onClick={() => {
                  setMinutes(val);
                  handleTimeChange(hours, val, seconds, period);
                }}
              >
                {val}
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.column}>
        <div className={styles.label}>SEC</div>
        <div className={styles.scroll}>
          {Array.from({ length: 60 }, (_, i) => i).map((s) => {
            const val = s.toString().padStart(2, '0');
            return (
              <div
                key={s}
                className={`${styles.option} ${seconds === val ? styles.selected : ""}`}
                onClick={() => {
                  setSeconds(val);
                  handleTimeChange(hours, minutes, val, period);
                }}
              >
                {val}
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.divider} />
      <div className={styles.column}>
        <div className={styles.label}>AM/PM</div>
        <div className={styles.scroll}>
          {['AM', 'PM'].map((p) => (
            <div
              key={p}
              className={`${styles.option} ${period === p ? styles.selected : ""}`}
              onClick={() => {
                setPeriod(p);
                handleTimeChange(hours, minutes, seconds, p);
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const displayValue = value || "";

  return (
    <div className={styles.wrapper} ref={ref}>
      {label && <label className={styles.inputLabel}>{label}</label>}
      <div
        className={`${styles.inputBox} ${error ? styles.inputError : ""} ${disabled ? styles.disabled : ""}`}
        onClick={handleClick}
      >
        <span className={displayValue ? styles.value : styles.placeholder}>
          {displayValue || <span className={styles.placeholderText}>{placeholder}</span>}
        </span>
        <FiClock className={styles.icon} />
      </div>

      {open && typeof document !== "undefined" && createPortal(
        <>
          <div 
            className={isMobile ? styles.mobileOverlay : styles.desktopOverlay} 
            onClick={() => setOpen(false)} 
          />
          <div
            style={isMobile ? {
              position: 'fixed',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              zIndex: 999999,
              pointerEvents: 'none'
            } : {
              position: 'fixed',
              top: isTop ? 'auto' : `${coords.bottom + 10}px`,
              bottom: isTop ? `${window.innerHeight - coords.top + 10}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 99999,
              pointerEvents: 'none'
            }}
          >
            <div
              className={`
                ${styles.dropdown} 
                ${isTop ? styles.dropdownTop : ""} 
              `}
              ref={dropdownRef}
              style={{ 
                position: 'relative', 
                top: 'auto', 
                left: 'auto', 
                transform: 'none',
                width: 'auto',
                maxWidth: '95vw',
                pointerEvents: 'auto',
                margin: 0
              }}
            >
              {!isMobile && (isTop ? <div className={styles.arrowBottom} /> : <div className={styles.arrowTop} />)}
              {renderDropdownContent()}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default CustomTimeInput;
