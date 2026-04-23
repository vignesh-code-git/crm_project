"use client";

import { useState, useEffect } from "react";
import styles from "./ActivityItem.module.css";
import { API_BASE_URL } from "@/config/apiConfig";

import { FiChevronDown, FiCalendar, FiClock, FiEye, FiDownload, FiFile, FiPaperclip } from "react-icons/fi";
import {
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleLine,
  RiTicket2Line,
  RiHandCoinLine,
  RiExchangeLine
} from "react-icons/ri";

export default function ActivityItem({ activity, entityType }) {
  const [open, setOpen] = useState(false);
  // Ensure we are comparing Booleans correctly
  const deriveChecked = () => {
    const val = activity.task_completed ?? activity.data?.task_completed;
    return val === true || val === 1 || val === 'true';
  };

  const [checked, setChecked] = useState(deriveChecked());

  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);

  const [outcome, setOutcome] = useState(activity.data?.outcome || activity.data?.call_outcome || "");
  const [duration, setDuration] = useState(activity.data?.duration || "");

  const [now, setNow] = useState(Date.now());

  // 🔥 Sync internal state if prop changes from backend
  useEffect(() => {
    const isDone = Boolean(activity.task_completed || activity.data?.task_completed);
    setChecked(isDone);
  }, [activity.task_completed, activity.data?.task_completed]);

  useEffect(() => {
    if (checked || !activity.data?.due_date && !activity.data?.dueDate) return;

    // 🔥 Tick every second for an "INSTANT" color change experience
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [checked, activity.data?.due_date, activity.data?.dueDate]);

  const type = activity.type?.toLowerCase();
  const d = activity.data || {};

  const date = new Date(activity.createdAt || activity.created_at).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  function calculateDuration(start, end) {
    if (!start || !end) return "";
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    const diff = (endTime - startTime) / 60000;
    if (diff <= 0) return "";
    if (diff >= 60) {
      const hrs = Math.floor(diff / 60);
      return `${hrs} hr`;
    }
    return `${diff} min`;
  }

  const handleToggle = async (e) => {
    e.stopPropagation();
    const newValue = !checked;
    setChecked(newValue);

    try {
      console.log(`🌐 TOGGLING TASK ID: ${activity.id} TO: ${newValue}`); // 🔥 DEBUG LOG
      const res = await fetch(`${API_BASE_URL}/api/tasks/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔥 REQUIRED FOR AUTH
        body: JSON.stringify({ 
          task_completed: newValue,
          status: newValue ? "Completed" : "Pending" // ✅ SYNC STATUS ENUM
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ TASK UPDATE FAILED:", res.status, errorText);
        alert(`Save failed: ${res.status}. Check console for details.`);
        // Revert UI if it failed
        setChecked(!newValue);
      }
    } catch (err) {
      console.error("Toggle task network error:", err);
      setChecked(!newValue);
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const getTitle = () => {
    // 🔥 Improved name detection for the "Past" layout
    const name = activity.user_name ||
      (activity.first_name ? `${activity.first_name} ${activity.last_name || ""}` : "") ||
      d.sender || d.author || d.organizer || "";

    const cleanName = name.trim();

    switch (type) {
      case "note": return `Note by ${cleanName}`;
      case "email": return `Logged Email - ${d.subject || ""} by ${cleanName}`;
      case "call": return `Call by ${cleanName}`;
      case "task": return `Task assigned to ${d.assigned_to || d.assignedTo || ""} by ${cleanName}`;
      case "meeting": return `Meeting ${d.title || ""} by ${cleanName}`;
      case "activity":
        const isTicket = activity.related_type === "tickets" || activity.type_db === "ticket_creation";
        const isDeal = activity.related_type === "deals" || activity.type_db === "deal_creation";

        if (isTicket) return { text: "Ticket activity", icon: null };
        if (isDeal) return { text: "Deal activity", icon: null };

        return { text: "System Activity", icon: <RiExchangeLine className={styles.activityIcon} /> };
      default: return type;
    }
  };

  const getPreview = () => {
    // 🔥 Standardize preview logic for original structure
    const content = activity.content || d.note || d.body || d.action_text || "";
    return content.replace(/<[^>]+>/g, "").slice(0, 50);
  };

  const renderAttachments = (attachments) => {
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) return null;
    return (
      <div className={styles.attachmentsSection}>
        <div className={styles.sectionHeader}>
          <FiPaperclip />
          <span>Attachments ({attachments.length})</span>
        </div>
        <div className={styles.attachmentsFooter}>
          {attachments.map((file, idx) => (
            <div key={idx} className={styles.attachmentCard}>
              <div className={styles.attachmentPreview}>
                {file.file_type === "image" || file.mime_type?.startsWith("image/") ? (
                  <img src={file.file_url} alt={file.file_name} />
                ) : (
                  <FiFile className={styles.fileIcon} />
                )}
                <div className={styles.hoverActionsOverlay}>
                  <div
                    className={styles.actionIcon}
                    title="View"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.file_url, "_blank");
                    }}
                  >
                    <FiEye />
                  </div>
                  <div
                    className={styles.actionIcon}
                    title="Download"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file.file_url, file.file_name);
                    }}
                  >
                    <FiDownload />
                  </div>
                </div>
              </div>
              <div className={styles.attachmentInfo}>
                <span className={styles.fileName}>{file.file_name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBody = () => {
    switch (type) {
      case "note":
        // 🔥 Robust content detection for notes
        let noteContent = activity.content || activity.note || d.note || d.content || "";

        // ✂️ STRIP IMAGES FROM CONTENT SECTION (per user request)
        // We remove <img> tags from the rich text to ensure "only text shows here"
        noteContent = noteContent.replace(/<img[^>]*>/g, "");

        return (
          <>
            <p
              className={styles.noteText}
              dangerouslySetInnerHTML={{ __html: noteContent }}
            />
            {renderAttachments(activity.attachments)}
          </>
        );
      case "email":
        // 🔥 Robust content detection for emails
        let emailContent = activity.content || d.body || "";

        // ✂️ STRIP IMAGES FROM CONTENT SECTION (per user request)
        emailContent = emailContent.replace(/<img[^>]*>/g, "");

        return (
          <div className={styles.emailContainer}>
            <div className={styles.emailHeaders}>
              <p><strong>To:</strong> {d.recipients || d.to}</p>
              <p><strong>Subject:</strong> {d.subject || "No Subject"}</p>
            </div>
            <div
              className={styles.emailContent}
              dangerouslySetInnerHTML={{ __html: emailContent }}
            />
            {renderAttachments(activity.attachments)}
          </div>
        );
      case "call":
        return (
          <>
            <div className={styles.metaBox}>
              <div className={styles.field}>
                <span>Outcome <span className={styles.required}>*</span></span>
                <input
                  type="text"
                  className={styles.textInput}
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Outcome"
                  disabled
                />
              </div>
              <div className={styles.field}>
                <span>Duration <span className={styles.required}>*</span></span>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Duration"
                    disabled
                  />
                  <FiClock className={styles.clockIcon} />
                </div>
              </div>
            </div>
            {d.note && <p className={styles.noteText} style={{ marginTop: '12px' }}>{d.note}</p>}
          </>
        );
      case "task":
        const taskDueDate = d.dueDate || d.due_date;
        const taskTime = d.time || d.due_time;
        const taskType = d.taskType || d.task_type;
        const taskAssignedTo = d.assignedTo || d.assigned_to;

        return (
          <>
            <div className={styles.metaBox}>
              <div>
                <span>Due Date & Time</span>
                <p>
                  {taskDueDate ? new Date(taskDueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  {" "}{taskTime ? new Date(`1970-01-01T${taskTime}`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : ""}
                </p>
              </div>
              <div><span>Priority</span><p>{d.priority}</p></div>
              <div><span>Type</span><p>{taskType}</p></div>
              <div><span>Assigned To</span><p>{taskAssignedTo}</p></div>
            </div>
            <p className={styles.noteText}>{d.note}</p>
          </>
        );
      case "meeting":
        const durationValue = calculateDuration(d.startTime || d.start_time, d.endTime || d.end_time);
        const meetingStartDate = d.startDate || d.start_date;
        const meetingStartTime = d.startTime || d.start_time;

        return (
          <>
            <p className={styles.organized}>Organized by {d.organizer || activity.user_name}</p>
            <div className={styles.metaBox}>
              {(meetingStartDate || meetingStartTime) && (
                <div>
                  <span>Date & Time</span>
                  <p>
                    {meetingStartDate ? new Date(meetingStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                    {" "}{meetingStartTime ? `at ${new Date(`1970-01-01T${meetingStartTime}`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : ""}
                  </p>
                </div>
              )}
              {durationValue && (
                <div><span>Duration</span><p>{durationValue}</p></div>
              )}
              <div><span>Attendees</span><p>{d.attendeesCount || d.attendees_count || 2}</p></div>
            </div>

            {(d.attendeeNames || d.attendee_names || d.note) && (
              <div className={styles.meetingDetails}>
                {(d.attendeeNames || d.attendee_names) && (
                  <p className={styles.attendeesList}>
                    <strong>Attendees:</strong> {d.attendeeNames || d.attendee_names}
                  </p>
                )}
                {d.note && (
                  <p className={styles.noteText} style={{ marginTop: (d.attendeeNames || d.attendee_names) ? '8px' : '0' }}>
                    {d.note}
                  </p>
                )}
              </div>
            )}
          </>
        );
      case "activity":
        const isDeal = activity.related_type === "deals" || activity.type_db === "deal_creation";
        const isTicket = activity.related_type === "tickets" || activity.type_db === "ticket_creation";
        const isCreation = activity.type_db?.includes("creation");

        if (isCreation) {
          if (isDeal) {
            const dateStr = new Date(activity.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const timeStr = new Date(activity.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            return (
              <div className={styles.activityBody}>
                <p className={styles.noteText}>
                  This deal was created by <strong>{activity.user_name}</strong> {dateStr} at {timeStr}
                </p>
              </div>
            );
          }
          if (isTicket) {
            const dateStr = new Date(activity.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
            const timeStr = new Date(activity.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

            return (
              <div className={styles.creationRow}>
                <p className={styles.creationTextBlue}>
                  This ticket was created by <strong>{activity.user_name}</strong>
                </p>
                <span className={styles.creationDateRight}>
                  {dateStr} at {timeStr}
                </span>
              </div>
            );
          }
        }

        // Default or Status Change
        return (
          <div className={styles.activityBody}>
            <p className={styles.noteText}>
              <strong>{activity.user_name}</strong> {d.action_text?.replace(/\*\*/g, "")}
            </p>
          </div>
        );
      default: return null;
    }
  };

  const titleResult = getTitle();
  const titleText = typeof titleResult === "string" ? titleResult : titleResult.text;
  const titleIcon = typeof titleResult === "object" ? titleResult.icon : null;

  const isCreation = activity.type_db?.includes("creation");
  const isSystemActivity = type === "activity";

  // 🔥 CENTER DESIGN: Only for Leads. 
  // Companies, Deals, and Tickets details pages use standard left-aligned cards per user request.
  const shouldCenter = isSystemActivity && entityType !== "companies" && entityType !== "deals" && entityType !== "tickets";
  const shouldShowHeaderless = isCreation && entityType !== "companies";

  // 🔥 SPECIAL LAYOUT FOR CREATION (Headerless)
  if (shouldShowHeaderless) {
    return (
      <div className={styles.item}>
        <div className={`${styles.creationBody} ${shouldCenter ? styles.centeredBody : ""}`}>
          {renderBody()}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.item}>
      <div
        className={`${styles.header} ${shouldCenter ? styles.centeredHeader : ""}`}
        onClick={() => !isSystemActivity && setOpen(!open)}
        style={{ cursor: isSystemActivity ? 'default' : 'pointer' }}
      >
        <div className={`${styles.left} ${shouldCenter ? styles.centeredLeft : ""}`}>
          {!isSystemActivity && (
            <FiChevronDown className={open ? styles.rotate : styles.arrow} />
          )}
          {titleIcon}
          <div className={`${styles.textBlock} ${shouldCenter ? styles.centeredTextBlock : ""}`}>
            <span className={styles.title}>{titleText}</span>
            {type === "task" ? (
              <div className={styles.taskRow}>
                {checked ? (
                  <RiCheckboxCircleLine className={styles.checkboxActive} onClick={handleToggle} />
                ) : (
                  <RiCheckboxBlankCircleLine className={styles.checkbox} onClick={handleToggle} />
                )}
                <p className={checked ? styles.previewActive : styles.preview}>{getPreview()}</p>
              </div>
            ) : (
              !isSystemActivity && !open && <p className={styles.preview}>{getPreview()}</p>
            )}
          </div>
        </div>
        {(!isSystemActivity || !shouldCenter) && (
          <div className={styles.date}>
            {type === "task" ? (
              (() => {
                const taskDueDate = d.dueDate || d.due_date;
                const taskTime = d.time || d.due_time;
                let isItOverdue = false;
                
                if (!checked && taskDueDate) {
                  const due = new Date(taskDueDate);
                  if (taskTime) {
                    const [h, m] = taskTime.split(':');
                    due.setHours(parseInt(h), parseInt(m), 0);
                  } else {
                    due.setHours(23, 59, 59);
                  }
                  isItOverdue = now > due.getTime();
                }

                return (
                  <div className={styles.overdueRow}>
                    <FiCalendar className={isItOverdue ? styles.calendarRed : styles.calendar} />
                    <span className={isItOverdue ? styles.overdueRed : styles.overdue}>Overdue :</span>
                    <span className={`${styles.dateText} ${isItOverdue ? styles.redText : ""}`}>
                      <p>
                        {taskDueDate ? new Date(taskDueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                        {" "}{taskTime ? new Date(`1970-01-01T${taskTime}`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : ""}
                      </p>
                    </span>
                  </div>
                );
              })()
            ) : date}
          </div>
        )}
      </div>
      {(open || isSystemActivity) && (
        <div className={`${styles.body} ${shouldCenter ? styles.centeredBody : ""}`}>
          {renderBody()}
        </div>
      )}
    </div>
  );
}