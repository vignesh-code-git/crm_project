"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./EntityProfile.module.css";
import { IoCopy } from "react-icons/io5";
import { TbCopyCheckFilled } from "react-icons/tb";
import { FiChevronDown } from "react-icons/fi";
import useEntity from "@/hooks/useEntities";

export default function EntityProfile({ entity, entityType, onUpdate }) {
  const { updateEntity } = useEntity(entityType);
  const [copied, setCopied] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const stageRef = useRef(null);

  const dealStages = [
    "Presentation Scheduled",
    "Qualified to Buy",
    "Contract Sent",
    "Appointment Scheduled",
    "Decision Maker Bought-In",
    "Closed Won",
    "Closed Lost"
  ];

  const ticketStatuses = [
    "New",
    "Open",
    "In Progress",
    "Wait for Customer",
    "Resolved",
    "Closed"
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (!stageRef.current?.contains(e.target)) {
        setStageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleSelect = (newValue) => {
    const field = entityType === "deals" ? "deal_stage" : "ticket_status";
    const updated = {
      ...entity,
      [field]: newValue,
      updated_at: new Date().toISOString(),
    };
    updateEntity(updated);
    onUpdate?.(updated);
    setStageOpen(false);
  };

  // ✅ NAME
  const getName = () => {
    if (entityType === "leads") {
      return `${entity?.first_name || ""} ${entity?.last_name || ""}`.trim();
    }

    if (entityType === "companies") {
      return entity?.company_name || "No Name";
    }

    if (entityType === "deals") {
      return entity?.deal_name || "No Name";
    }

    if (entityType === "tickets") {
      return entity?.ticket_name || "No Name";
    }

    return "No Name";
  };

  // ✅ SUBTITLE
  const getSubtitle = () => {
    if (entityType === "leads") return entity?.job_title;
    if (entityType === "companies") return entity?.industry;
    if (entityType === "deals") return entity?.amount;
    if (entityType === "tickets") return null; // Handled by interactive dropdown

    return null;
  };

  // ✅ EXTRA LINE (3rd row)
  const getExtra = () => {
    if (entityType === "companies") return entity?.domain_name;
    if (entityType === "deals") return entity?.deal_stage;

    return null;
  };

  const name = getName();
  const subtitle = getSubtitle();
  const extra = getExtra();

  const copyEmail = () => {
    if (entity?.email) {
      navigator.clipboard.writeText(entity.email);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  return (
    <div className={styles.profile}>

      {/* Avatar */}
      <div className={styles.avatar}></div>

      <div className={styles.info}>
        {/* NAME */}
        <h2>{name}</h2>

        {/* SUBTITLE */}
        {subtitle && (
          <p className={styles.sub}>
            {subtitle}
          </p>
        )}

        {/* EXTRA / INTERACTIVE STAGE (DEALS & TICKETS) */}
        {(entityType === "deals" || entityType === "tickets") ? (
          <div className={styles.stageWrapper} ref={stageRef}>
            <div
              className={styles.stageBox}
              onClick={() => setStageOpen(!stageOpen)}
            >
              <span className={styles.stageLabel}>
                {entityType === "deals" ? "Stage :" : "Status :"} {entityType === "deals" ? entity?.deal_stage : entity?.ticket_status || "New"}
              </span>
              <FiChevronDown
                className={`${styles.chevron} ${
                  stageOpen ? styles.rotate : ""
                }`}
              />
            </div>

            {stageOpen && (
              <div className={styles.dropdown}>
                {(entityType === "deals" ? dealStages : ticketStatuses).map((val) => (
                  <div
                    key={val}
                    className={`${styles.option} ${
                      (entityType === "deals" ? entity.deal_stage : entity.ticket_status) === val
                        ? styles.active
                        : ""
                    }`}
                    onClick={() => handleSelect(val)}
                  >
                    {val}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          extra && <p className={styles.extra}>{extra}</p>
        )}

        {/* CONTACT INFO (EMAIL & PHONE) */}
        <div className={styles.contactBlock}>
          {(entity?.email || entity?.lead_email) && (
            <div className={styles.contactRow}>
              <span className={styles.contactValue}>{entity.email || entity.lead_email}</span>
              {copied ? (
                <TbCopyCheckFilled className={styles.copy} />
              ) : (
                <IoCopy onClick={copyEmail} className={styles.copy} />
              )}
            </div>
          )}

          {(entity?.phone || entity?.lead_phone) && (
            <div className={styles.contactRow}>
              <span className={styles.contactValue}>{entity.phone || entity.lead_phone}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}