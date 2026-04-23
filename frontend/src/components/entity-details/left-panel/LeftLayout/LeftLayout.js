"use client";

import { useState, useRef } from "react";
import styles from "./LeftLayout.module.css";
import { useRouter } from "next/navigation";

import EntityProfile from "@/components/entity-details/left-panel/EntityProfile/EntityProfile";
import EntityDetails from "@/components/entity-details/left-panel/EntityDetails/EntityDetails";

import { entityConfig } from "@/config/leftPanel/leftPanelConfig";

import { HiOutlineChevronLeft } from "react-icons/hi";
import { MdEmail } from "react-icons/md";
import { PiNoteFill } from "react-icons/pi";
import { BiSolidPhone } from "react-icons/bi";
import { BiSolidCalendar } from "react-icons/bi";
import { HiMiniPencilSquare } from "react-icons/hi2";
import { FaArrowDown, FaChevronDown } from "react-icons/fa6";
import { HiPencilAlt } from "react-icons/hi";

export default function LeftPanel({
  entity,
  entityType,
  onAction,
  onUpdate
}) {

  const router = useRouter();
  const panelRef = useRef(null);

  const [arrowOpacity, setArrowOpacity] = useState(1);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleScroll = () => {
    if (!panelRef.current) return;

    const scrollTop = panelRef.current.scrollTop;
    const fadeDistance = 80;

    const opacity = Math.max(1 - scrollTop / fadeDistance, 0);
    setArrowOpacity(opacity);
  };

  // ✅ GET CONFIG
  const config = entityConfig[entityType];

  // ✅ FIX: map created_at → date (for EntityDetails)
  const mappedEntity = {
    ...entity,
    date: entity?.created_at
      ? new Date(entity.created_at).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short",
      })
      : "",
  };

  return (
    <div
      className={styles.panel}
      ref={panelRef}
      onScroll={handleScroll}
    >

      <div className={styles.stickyHeader}>
        {/* BACK */}
        <div
          className={styles.back}
          onClick={() => router.push(config.route)}
        >
          <HiOutlineChevronLeft className={styles.backIcon} />
          <span className={styles.backText}>
            {config.label}
          </span>
        </div>

        {/* PROFILE */}
        <EntityProfile
          entity={entity}
          entityType={entityType}
          onUpdate={onUpdate}
        />

        {/* ACTIONS */}
        <div className={styles.actions}>

          <button className={styles.actionBtn} onClick={() => onAction?.("note")}>
            <div className={styles.iconBox}><HiMiniPencilSquare /></div>
            <span>Note</span>
          </button>

          <button className={styles.actionBtn} onClick={() => onAction?.("email")}>
            <div className={styles.iconBox}><MdEmail /></div>
            <span>Email</span>
          </button>

          <button className={styles.actionBtn} onClick={() => onAction?.("call")}>
            <div className={styles.iconBox}><BiSolidPhone /></div>
            <span>Call</span>
          </button>

          <button className={styles.actionBtn} onClick={() => onAction?.("task")}>
            <div className={styles.iconBox}><PiNoteFill /></div>
            <span>Task</span>
          </button>

          <button className={styles.actionBtn} onClick={() => onAction?.("meeting")}>
            <div className={styles.iconBox}><BiSolidCalendar /></div>
            <span>Meeting</span>
          </button>

        </div>

        {/* SECTION HEADER (Sticky & Touched) */}
        <div className={styles.sectionHeader}>
          <div
            className={styles.sectionTitle}
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          >
            <FaChevronDown
              className={`${styles.sectionArrow} ${isDetailsOpen ? styles.sectionRotate : ""
                }`}
            />
            {config.aboutTitle || "Details"}
          </div>

          <HiPencilAlt
            className={styles.sectionEdit}
            onClick={() => setIsEditMode(!isEditMode)}
          />
        </div>
      </div>


      {/* DETAILS */}
      <EntityDetails
        entity={mappedEntity}
        fields={config.fields}
        aboutTitle={config.aboutTitle}
        onUpdate={onUpdate}
        entityType={entityType}
        isOpen={isDetailsOpen}
        onToggle={setIsDetailsOpen}
        editMode={isEditMode}
        setEditMode={setIsEditMode}
        hideHeader={true}
      />

      {/* SCROLL HINT */}
      <div
        className={styles.scrollHint}
        style={{ opacity: arrowOpacity }}
      >
        <FaArrowDown />
      </div>

    </div>
  );
}