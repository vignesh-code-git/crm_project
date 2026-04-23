"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./EntityDetails.module.css";
import { FaChevronDown } from "react-icons/fa";
import { HiPencilAlt } from "react-icons/hi";
import { FiChevronDown } from "react-icons/fi";
import { formatPhone } from "@/utils/phoneFormat"; // ✅ use util

import useLeads from "@/hooks/useEntities";

export default function EntityDetails({
  entity,
  fields,
  aboutTitle,
  onUpdate,
  entityType,
  isOpen: propIsOpen,
  onToggle: propOnToggle,
  editMode: propEditMode,
  setEditMode: propSetEditMode,
  hideHeader = false
}) {
  const { updateEntity } = useLeads(entityType);

  const [localIsOpen, setLocalIsOpen] = useState(true);
  const [localEditMode, setLocalEditMode] = useState(false);

  const isOpen = propIsOpen !== undefined ? propIsOpen : localIsOpen;
  const setIsOpen = propOnToggle !== undefined ? propOnToggle : setLocalIsOpen;
  const editMode = propEditMode !== undefined ? propEditMode : localEditMode;
  const setEditMode = propSetEditMode !== undefined ? propSetEditMode : setLocalEditMode;

  const [formData, setFormData] = useState(entity);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef(null);

  const statusOptions = ["New", "Open", "In Progress", "Closed"];

  useEffect(() => {
    if (!editMode) {
      setFormData(entity);
    }
  }, [entity, editMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!statusRef.current?.contains(e.target)) {
        setStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ DATE FORMAT
  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    const updatedEntity = {
      ...entity,
      ...formData,
      updated_at: new Date().toISOString(),
    };

    updateEntity(updatedEntity);
    onUpdate?.(updatedEntity);

    setFormData(updatedEntity);
    setEditMode(false);
  };

  const handleCancel = () => {
    setFormData(entity);
    setEditMode(false);
  };

  const toggleEdit = () => {
    if (editMode) handleCancel();
    else setEditMode(true);
  };

  return (
    <div className={styles.details}>
      {/* HEADER */}
      {!hideHeader && (
        <div className={styles.header}>
          <div
            className={styles.title}
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaChevronDown
              className={`${styles.arrow} ${isOpen ? styles.rotate : ""
                }`}
            />
            {aboutTitle || "Details"}
          </div>

          <HiPencilAlt
            className={styles.edit}
            onClick={toggleEdit}
          />
        </div>
      )}

      {/* CONTENT */}
      {isOpen && (
        <div className={styles.container}>
          {fields.map((field) => {
            const key = field.key;
            const value = formData[key];

            if (value === undefined) return null;

            const isDate =
              key.includes("date") || key.includes("created");
            const isStatus = key === "lead_status";

            return (
              <div key={key} className={styles.row}>
                {/* LABEL */}
                <span className={styles.label}>
                  {field.label}
                </span>

                {/* EDIT MODE */}
                {editMode ? (
                  isDate ? (
                    <span className={styles.value}>
                      {formatDate(value)}
                    </span>
                  ) : isStatus ? (
                    <div
                      className={styles.wrapper}
                      ref={statusRef}
                    >
                      <div
                        className={styles.selectBox}
                        onClick={() =>
                          setStatusOpen(!statusOpen)
                        }
                      >
                        <span
                          className={styles.selectLabel}
                        >
                          {value || "Select"}
                        </span>

                        <FiChevronDown
                          className={`${styles.selectIcon
                            } ${statusOpen
                              ? styles.rotate
                              : ""
                            }`}
                        />
                      </div>

                      {statusOpen && (
                        <div className={styles.dropdown}>
                          {statusOptions.map((status) => (
                            <div
                              key={status}
                              className={styles.option}
                              onClick={() => {
                                handleChange(key, status);
                                setStatusOpen(false);
                              }}
                            >
                              {status}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                  key === "description" ? (
                    <textarea
                      className={styles.textarea}
                      value={value || ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                  ) : (
                    <input
                      className={styles.input}
                      value={value || ""}
                      onChange={(e) => {
                        let inputValue = e.target.value;

                        // ✅ PHONE INPUT CLEANING
                        if (key === "phone") {
                          inputValue =
                            inputValue.replace(/\D/g, "");

                          // allow up to 13 digits (cc + number)
                          inputValue =
                            inputValue.slice(0, 13);
                        }

                        handleChange(key, inputValue);
                      }}
                    />
                  )
                  )
                ) : (
                  // VIEW MODE
                  <span className={styles.value}>
                    {isDate
                      ? formatDate(value)
                      : key === "phone"
                        ? formatPhone(value) // ✅ from utils
                        : value}
                  </span>
                )}
              </div>
            );
          })}

          {/* ACTIONS */}
          {editMode && (
            <div className={styles.actions}>
              <button
                className={styles.cancel}
                onClick={handleCancel}
              >
                Cancel
              </button>

              <button
                className={styles.save}
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}