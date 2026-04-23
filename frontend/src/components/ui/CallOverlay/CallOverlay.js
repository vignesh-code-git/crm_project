"use client";

import { useEffect, useState } from "react";
import styles from "./CallOverlay.module.css";
import { FiMic, FiVideo, FiVideoOff, FiMicOff, FiMoreHorizontal } from "react-icons/fi";
import { MdCallEnd } from "react-icons/md";

export default function CallOverlay({ 
  entityName, 
  phoneNumber, 
  onHangUp,
  isActive,
  status // 📞 NEW: incoming status from backend polling
}) {
  const [seconds, setSeconds] = useState(0);

  // 🆔 HELPERS
  const getInitials = (name) => {
    if (!name) return "A";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const formatPhone = (phone) => {
    if (!phone) return "Unknown";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 10) {
      const last10 = cleaned.slice(-10);
      return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
    }
    return phone;
  };

  useEffect(() => {
    let interval;
    // ⏱️ Start duration ONLY if status is "in-progress" (Answered)
    if (isActive && status === "in-progress") {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isActive) {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isActive, status]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  const isConnected = status === "in-progress";

  return (
    <div className={styles.overlay}>
      <div className={styles.island}>
        <div className={styles.topInfo}>
          <div className={styles.avatar}>
            <div className={styles.initials}>
              {getInitials(entityName)}
            </div>
          </div>
          
          <div className={styles.details}>
            <h4>{entityName || "Unknown Contact"}</h4>
            <p>
              {formatPhone(phoneNumber)} - 
              <span className={styles.statusText}>
                {status === "ringing" ? " Ringing..." : 
                 status === "in-progress" ? ` Connected ${formatTime(seconds)}` : 
                 status === "busy" ? " Busy" : 
                 status === "no-answer" ? " No Answer" : 
                 status === "failed" ? " Failed" : 
                 " Calling..."}
              </span>
            </p>
          </div>

          <div className={styles.waveform}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.actionBtn} title="Mute">
            <FiMicOff />
          </button>
          <button className={styles.actionBtn} title="Video">
            <FiVideoOff />
          </button>
          <button className={styles.actionBtn} title="Keypad">
            <FiMoreHorizontal />
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.endCall}`} 
            onClick={() => onHangUp(formatTime(seconds))}
            title="End Call"
          >
            <MdCallEnd />
          </button>
        </div>
      </div>
    </div>
  );
}
