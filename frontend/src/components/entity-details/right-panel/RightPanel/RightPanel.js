"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./RightPanel.module.css";
import { FiChevronDown, FiFile } from "react-icons/fi";
import { RiSparkling2Line } from "react-icons/ri";
import { API_BASE_URL } from "@/config/apiConfig";

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentCard({ att }) {
  const isImage = att.mime_type?.startsWith("image/");
  const size = formatFileSize(att.file_size);

  return (
    <a
      href={att.file_url}
      target="_blank"
      rel="noreferrer"
      className={styles.attachCard}
      title={att.file_name}
    >
      <div className={styles.attachThumb}>
        {isImage ? (
          <img src={att.file_url} alt={att.file_name} className={styles.thumbImg} />
        ) : (
          <FiFile size={20} className={styles.thumbIcon} />
        )}
      </div>
      <div className={styles.attachInfo}>
        <span className={styles.attachName}>{att.file_name}</span>
        <span className={styles.attachMeta}>
          {size}
          {att.attachment_type && ` · ${att.attachment_type}`}
        </span>
      </div>
    </a>
  );
}

export default function RightPanel({ entityId, entityType, refreshKey }) {
  const [open, setOpen] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const fetchAttachments = () => {
    if (!entityType || !entityId) return;
    fetch(
      `${API_BASE_URL}/api/attachments?related_type=${entityType}&related_id=${entityId}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => setAttachments(Array.isArray(data) ? data : []))
      .catch(() => setAttachments([]));
  };

  useEffect(() => {
    fetchAttachments();
  }, [entityType, entityId, refreshKey]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("related_type", entityType);
    formData.append("attachment_type", "custom");   // ✅ stored as 'custom'
    formData.append("attachment_id", entityId || 0);
    formData.append("related_id", entityId || 0);   // ✅ proper entity link

    try {
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (res.ok) fetchAttachments();
    } catch (err) {
      console.log("Upload error:", err);
    }
    e.target.value = "";
  };

  // Split into custom-uploaded vs activity attachments
  const customAttachments = attachments.filter((a) => a.attachment_type === "custom");
  const activityAttachments = attachments.filter((a) => a.attachment_type !== "custom");

  return (
    <div className={styles.panel}>

      {/* AI Lead Summary */}
      <div className={styles.aiCard}>
        <div className={styles.aiHeader}>
          <RiSparkling2Line size={16} />
          <span>AI Lead Summary</span>
        </div>
        <p className={styles.aiText}>
          There are no activities associated with this lead and further
          details are needed to provide a comprehensive summary.
        </p>
      </div>

      {/* Attachments */}
      <div className={styles.attachments}>
        <div className={styles.attachHeader}>
          <div className={styles.left}>
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setOpen(!open)}
              aria-label="Toggle attachments"
            >
              <FiChevronDown
                size={22}
                className={`${styles.icon} ${open ? styles.iconOpen : ""}`}
              />
            </button>
            <span className={open ? styles.titleOpen : ""}>
              Attachments
            </span>
          </div>

          <button
            type="button"
            className={styles.addBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={styles.plus}>+</span> Add
          </button>

          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </div>

        {open && (
          <div className={styles.attachList}>

            {/* ── Custom Uploaded section ── */}
            <p className={styles.sectionLabel}>Custom Uploaded</p>
            {customAttachments.length === 0 ? (
              <p className={styles.attachText}>No custom files uploaded yet.</p>
            ) : (
              customAttachments.map((att) => (
                <AttachmentCard key={att.id} att={att} />
              ))
            )}

            {/* ── Activity Attachments section ── */}
            <div className={styles.sectionSeparator} />
            <p className={styles.sectionLabel}>
              From Activities
            </p>
            {activityAttachments.length === 0 ? (
              <p className={styles.attachText}>No Activity files uploaded yet.</p>
            ) : (
              activityAttachments.map((att) => (
                <AttachmentCard key={att.id} att={att} />
              ))
            )}

          </div>
        )}
      </div>

    </div>
  );
}