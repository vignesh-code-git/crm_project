import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { GoCalendar } from 'react-icons/go';
import { createPortal } from 'react-dom';
import styles from './CustomDateInput.module.css';

const CustomDateInput = ({ selectedDate, onChange, label, error, disabled, compact = false }) => {
  const [open, setOpen] = useState(false);
  const [isTop, setIsTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const dropdownRef = useRef(null);

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
    // Increased threshold to 1200px to cover more tablet/mobile devices
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

  const handleSelect = (date) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      {label && <label className={styles.inputLabel}>{label}</label>}
      <div
        className={`${styles.inputBox} ${error ? styles.inputError : ""} ${disabled ? styles.disabled : ""}`}
        onClick={handleClick}
      >
        <span className={selectedDate ? styles.value : styles.placeholder}>
          {selectedDate ? selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Select Date"}
        </span>
        <GoCalendar className={styles.icon} />
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
                ${compact ? styles.compactDropdown : ""}
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
              {!isMobile && <div className={isTop ? styles.arrowBottom : styles.arrowTop} />}
              <div className={styles.inner}>
                <DatePicker
                  inline
                  selected={selectedDate}
                  onChange={handleSelect}
                />
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default CustomDateInput;
