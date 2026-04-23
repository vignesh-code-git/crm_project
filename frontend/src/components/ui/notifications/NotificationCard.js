"use client";

import React, { useState } from "react";
import {
  IoCheckmarkCircle,
  IoInformationCircle,
  IoWarning,
  IoClose,
  IoChevronDown,
  IoChevronUp
} from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";
import styles from "./notification.module.css";
import { API_BASE_URL } from "@/config/apiConfig";

export default function NotificationCard({ notification, onRead, onDelete, onClose, isToast = false }) {
  const [expanded, setExpanded] = useState(false);

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Explicitly use the ID passed into the card or from notification
    const closeId = notification.id || notification._id;
    const handler = onDelete || onClose;

    if (handler && closeId) {
      handler(closeId);
    }
  };

  // Fallback for notification structure
  let {
    type = "info",
    title = "",
    message = "",
    created_at,
    createdAt,
    timestamp,
    entity_type,
    entity_id,
    metadata: rawMetadata = {}
  } = notification;

  // Normalize time field
  const timeField = created_at || createdAt || timestamp;

  // Handle stringified metadata from some DB drivers
  let metadata = rawMetadata || {};
  if (typeof rawMetadata === "string") {
    try {
      metadata = JSON.parse(rawMetadata);
    } catch (e) {
      metadata = {};
    }
  }

  // DESCRIPTIVE TITLE FALLBACK (ENTITY)
  const displayTitle = title || (entity_type ? `${entity_type.charAt(0).toUpperCase() + entity_type.slice(1, -1)} Notification` : "Notification");

  // ICON SELECTION
  const getIcon = () => {
    switch (type) {
      case "success": return <IoCheckmarkCircle className={styles.iconSuccess} />;
      case "warning": return <IoCheckmarkCircle className={styles.iconWarning} />; // Using check for consistency if needed or warning icon
      case "error": return <IoCheckmarkCircle className={styles.iconError} />;
      case "info": return <IoCheckmarkCircle className={styles.iconInfo} />;
      default: return <IoCheckmarkCircle className={styles.iconInfo} />;
    }
  };

  // FORMAT MESSAGE
  const formatMessage = (msg) => {
    if (!msg) return "";
    const parts = msg.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // ENSURE DROPDOWN APPEARS FOR ALL NOTIFICATIONS WITH AN ENTITY
  const hasDetails = !!(entity_id && entity_type);

  const [hydratedData, setHydratedData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (isToast) return;
    if (!notification.is_read) {
      onRead?.(notification.id);
    }
  };

  const toggleExpand = async (e) => {
    e.stopPropagation();
    const newExpanded = !expanded;
    setExpanded(newExpanded);

    // 🔥 SMART HYDRATION: Fetch data if missing and we just expanded
    if (newExpanded && !hydratedData && !metadata.body && !metadata.content) {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/hydrate/${entity_type}/${entity_id}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setHydratedData(data);
        }
      } catch (err) {
        console.error("Hydration failed:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper to render "Real Values" from hydrated data
  const renderDetails = () => {
    const data = hydratedData || metadata;
    const bodyText = data.body || data.content || data.note || data.action_text;

    // 1. If it's an activity (Email, Call, Note), show the text
    if (["emails", "calls", "notes", "tasks", "meetings"].includes(entity_type)) {
      return (
        <div className={styles.bodyText}>
          {bodyText ? (
            <div dangerouslySetInnerHTML={{ __html: bodyText }} />
          ) : (
            <em className={styles.placeholder}>No detailed content available for this activity.</em>
          )}
        </div>
      );
    }

    // 2. If it's a table entity (Lead, Deal, Company, Ticket), show a grid of fields
    const fields = [];
    if (entity_type === "leads") {
      fields.push({ label: "Email", value: data.email });
      fields.push({ label: "Phone", value: data.phone });
      fields.push({ label: "Status", value: data.lead_status });
    } else if (entity_type === "deals") {
      fields.push({ label: "Amount", value: data.deal_value });
      fields.push({ label: "Stage", value: data.deal_stage });
      fields.push({ label: "Close Date", value: data.close_date });
    } else if (entity_type === "companies") {
      fields.push({ label: "Industry", value: data.industry });
      fields.push({ label: "Website", value: data.website });
    } else if (entity_type === "tickets") {
      fields.push({ label: "Priority", value: data.ticket_priority });
      fields.push({ label: "Status", value: data.ticket_status });
    }

    if (fields.length > 0) {
      return (
        <div className={styles.dataGrid}>
          {fields.map((f, i) => f.value && (
            <div key={i} className={styles.gridItem}>
              <span className={styles.gridLabel}>{f.label}:</span>
              <span className={styles.gridValue}>{f.value}</span>
            </div>
          ))}
        </div>
      );
    }

    return <div className={styles.bodyText}>{bodyText || "No additional records found."}</div>;
  };

  return (
    <div 
      className={`${styles.card} ${isToast ? styles.toastCard : ""} ${!notification.is_read ? styles.unread : ""}`}
      onClick={isToast ? undefined : handleClick}
    >
      {/* Absolute close button for toasts */}
      {isToast && (
        <button 
          type="button"
          className={styles.closeBtnToast} 
          onClick={handleClose}
        >
          <IoClose />
        </button>
      )}

      {/* HEADER SECTION */}
      <div className={styles.cardHeader}>
        <div className={styles.titleArea}>
          {getIcon()}
          <span className={styles.cardTitle}>{displayTitle}</span>
        </div>
        
        <div className={styles.actionArea}>
          {hasDetails && (
            <button className={styles.chevronBtn} onClick={toggleExpand}>
              {expanded ? <IoChevronUp /> : <IoChevronDown />}
            </button>
          )}
          
          {!isToast && (
            <button 
              type="button" 
              className={styles.closeBtn} 
              onClick={handleClose}
            >
              <IoClose />
            </button>
          )}
        </div>
      </div>

      {/* MESSAGE SECTION */}
      <div className={styles.cardBody}>
        <div className={styles.bodyTop}>
           <div className={`${styles.cardMessage} ${styles[type]}`}>
             {formatMessage(message)}
           </div>
            <div className={styles.cardTime}>
              {(() => {
                try {
                  return timeField ? formatDistanceToNow(new Date(timeField), { addSuffix: true }) : "just now";
                } catch (e) {
                  return "recently";
                }
              })()}
            </div>
         </div>

        {/* EXPANDABLE CONTENT (HYDRATED) */}
        {expanded && (
          <div className={styles.expandedContent}>
            {loading ? (
              <div className={styles.loadingSkeleton}>Fetching real values...</div>
            ) : (
              <>
                { (metadata.to || metadata.target_name || hydratedData?.company_name) && (
                  <div className={styles.metaRow}>
                    <strong>Target:</strong> {metadata.to || metadata.target_name || hydratedData?.company_name || hydratedData?.first_name}
                  </div>
                )}
                { (metadata.subject || hydratedData?.subject) && (
                  <div className={styles.metaRow}>
                    <strong>Subject:</strong> {metadata.subject || hydratedData.subject}
                  </div>
                )}
                
                {renderDetails()}
                
                {(metadata.actor_name || hydratedData?.user_name) && (
                  <div className={styles.metaRow} style={{ marginTop: '12px' }}>
                    Best regards, <br/>
                    <strong>{metadata.actor_name || hydratedData?.user_name || "The CRM Team"}</strong>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
