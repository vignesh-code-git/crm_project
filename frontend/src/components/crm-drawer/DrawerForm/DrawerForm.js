"use client";

import styles from "./DrawerForm.module.css";
import {
  FiChevronDown,
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiMenu,
  FiImage
} from "react-icons/fi";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import EmojiPicker from "emoji-picker-react";

import { useState, useEffect, useRef } from "react";

import {
  FiPaperclip,
  FiLink,
  FiSmile,
  FiTrash2,
  FiFileText,
  FiDownload,
  FiType,
  FiMonitor,
  FiFolder,
  FiX
} from "react-icons/fi";

import { showInfo } from "@/services/toastService";
import { API_BASE_URL } from "@/config/apiConfig";
import DateFilter from "@/components/crm-table/filters/DateFilter/DateFilter";
import CustomDateInput from "@/components/ui/CustomDateInput/CustomDateInput";
import CustomTimeInput from "@/components/ui/CustomTimeInput/CustomTimeInput";

export default function DrawerForm({
  fields,
  data,
  onSave,
  onClose,
  emailMode,
  entityType,
  activityType,
  selectedLeadId,
  entity,
  user
}) {

  const [errors, setErrors] = useState({});
  const showRedBorder = !activityType; // Only for Leads, Deals, Companies, Tickets

  const [values, setValues] = useState(() => {
    const init = { ...data };
    (fields || []).forEach(f => {
      if (f.defaultValue !== undefined && init[f.name] === undefined) {
        init[f.name] = f.defaultValue;
      }
    });

    // ✅ ROBUST LEAD INITIALIZATION FOR CONVERSION
    if (selectedLeadId && !init.lead_id) {
      init.lead_id = selectedLeadId;
    }

    // ✅ ROBUST MULTI-OWNER INITIALIZATION
    if (user?.role === "admin") {
      const rawOwners = data?.owner_ids || data?.owner_id;
      init.owner_id = Array.isArray(rawOwners)
        ? rawOwners.map(Number)
        : (rawOwners ? [Number(rawOwners)] : []);
    } else {
      // For standard users, ensure a single owner_id (Prioritize the logged-in user if they are an owner)
      const rawOwners = data?.owner_ids || data?.owner_id;
      const ownerList = Array.isArray(rawOwners) ? rawOwners.map(Number) : (rawOwners ? [Number(rawOwners)] : []);

      if (ownerList.includes(Number(user?.id))) {
        init.owner_id = Number(user.id);
      } else {
        init.owner_id = ownerList.length > 0 ? ownerList[0] : Number(user?.id);
      }
    }

    // ✅ FORCE RECIPIENTS IF MISSING
    if (emailMode && !init.recipients && entity?.email) {
      init.recipients = entity.email;
    }
    return init;
  });

  // Keep internal values in sync when entity or fields change
  useEffect(() => {
    setValues(prev => {
      // If we are editing an existing record and it hasn't changed, don't overwrite local edits
      if (data?.id && prev.id === data.id) return prev;

      const newValues = { ...data };

      // Re-apply defaults from fields (like lead_id from selectedLeadId)
      (fields || []).forEach(f => {
        if (f.defaultValue !== undefined && (newValues[f.name] === undefined || newValues[f.name] === "")) {
          newValues[f.name] = f.defaultValue;
        }
      });

      // Special case: Ensure selectedLeadId is synced if passed from parent
      if (selectedLeadId && (!newValues.lead_id || newValues.lead_id === "")) {
        newValues.lead_id = selectedLeadId;
      }

      if (user?.role === "admin") {
        const rawOwners = data?.owner_ids || data?.owner_id;
        newValues.owner_id = Array.isArray(rawOwners)
          ? rawOwners.map(Number)
          : (rawOwners ? [Number(rawOwners)] : []);
      }
      return newValues;
    });
  }, [data?.id, user?.role, fields, selectedLeadId]);

  const [openDropdown, setOpenDropdown] = useState(null);

  const formRef = useRef(null);
  const savedRangeRef = useRef(null);
  const editorRef = useRef({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [attachmentIds, setAttachmentIds] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [linkPopup, setLinkPopup] = useState({ visible: false, url: "" });

  // 📎 ATTACHMENT MENU STATES
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState([]);

  const fetchExistingAttachments = async () => {
    if (!entityType || !entity?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/attachments?related_type=${entityType}&related_id=${entity.id}`, { credentials: "include" });
      const files = await res.json();
      setExistingAttachments(Array.isArray(files) ? files : []);
    } catch (err) {
      console.error("Fetch existing attachments failed:", err);
    }
  };

  const handleSelectExisting = (file) => {
    // Add to attachments tray if not already there
    if (!attachmentIds.includes(file.id)) {
      setAttachmentIds(prev => [...prev, file.id]);
      setAttachments(prev => [...prev, {
        id: file.id,
        name: file.file_name,
        size: file.file_size,
        url: file.file_url,
        type: file.mime_type
      }]);
    }
    setShowCustomPicker(false);
  };

  /* ✅ DETECT CONVERTED */
  const isConverted =
    data?.lead_status?.toLowerCase() === "converted";

  const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    savedRangeRef.current = sel.getRangeAt(0);
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const format = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleFileUpload = (fieldName, typeOfFile = "image") => {
    const input = document.createElement("input");
    input.type = "file";

    // User requested icons work for all types
    if (typeOfFile === "image") {
      input.accept = "image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";
    }

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("attachment_type", activityType || (emailMode ? "email" : "note"));
      formData.append("attachment_id", 0);
      formData.append("related_id", data?.id || selectedLeadId || 0);
      formData.append("related_type", entityType);
      formData.append("user_id", user?.id || 1);

      try {
        const res = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          body: formData
        });

        const dataRes = await res.json();

        if (!dataRes?.url) {
          alert("Upload failed");
          return;
        }

        // Store ATTACHMENT ID for linking after save
        if (dataRes.attachment?.id) {
          setAttachmentIds(prev => [...prev, dataRes.attachment.id]);
        }

        const editor = editorRef.current[fieldName];
        if (!editor) return;
        editor.focus();

        let selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          const range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // ALWAYS ADD TO ATTACHMENTS TRAY (AS PER USER REQUEST)
        // We do not insert inline images anymore to ensure "only text shows here"
        setAttachments(prev => [...prev, {
          id: dataRes.attachment?.id || Date.now(),
          name: file.name,
          size: file.size,
          url: dataRes.url,
          type: file.type // Store type to differentiate in UI
        }]);

        setTimeout(() => {
          handleChange(fieldName, editor.innerHTML);
        }, 0);

      } catch (err) {
        console.error("Upload error:", err);
      }
    };

    input.click();
  };

  const toggleLinkPopup = (fieldName) => {
    saveSelection();
    setLinkPopup(prev => ({ ...prev, visible: !prev.visible, url: "" }));
  };

  const confirmLink = (fieldName) => {
    const editor = editorRef.current[fieldName];
    let url = linkPopup.url.trim();

    if (editor && url) {
      // Ensure absolute URL
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }

      editor.focus();
      restoreSelection();

      const selection = window.getSelection();

      // If we still have no selection inside the editor, collapse it to the end
      if (!editor.contains(selection.anchorNode)) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      if (selection.isCollapsed) {
        const html = `<a href="${url}" target="_blank" style="color:#2563eb; text-decoration:underline;">${url}</a>`;
        document.execCommand("insertHTML", false, html);
      } else {
        document.execCommand("createLink", false, url);
        // FORCE TARGET BLANK for createLink
        const links = editor.getElementsByTagName("a");
        for (let l of links) {
          if (l.getAttribute("href") === url) {
            l.setAttribute("target", "_blank");
            l.style.color = "#2563eb";
            l.style.textDecoration = "underline";
          }
        }
      }

      setTimeout(() => {
        handleChange(fieldName, editor.innerHTML);
      }, 0);
    }
    setLinkPopup({ visible: false, url: "" });
  };

  const onEmojiClick = (emojiObject, fieldName) => {
    const editor = editorRef.current[fieldName];
    if (!editor) return;
    editor.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (name, value) => {
    setValues((prev) => {
      const nextValues = { ...prev, [name]: value };

      // ✅ AUTO-FILL COMPANY FROM LEAD SELECTION (DEALS)
      if (name === "lead_id" && entityType === "deals") {
        const leadField = (fields || []).find((f) => f.name === "lead_id");
        const selectedOption = leadField?.options?.find(
          (opt) => String(opt.value) === String(value)
        );

        if (selectedOption) {
          nextValues.company_id = selectedOption.company_id || "";
        }
      }

      return nextValues;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    let newErrors = {};

    if (emailMode) {
      // Email validation removed per user request
    }

    (fields || []).forEach(f => {
      if (f.required) {
        const val = values[f.name];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          newErrors[f.name] = `${f.label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const updated = { ...values };
    Object.keys(editorRef.current).forEach((key) => {
      const editor = editorRef.current[key];
      if (editor) {
        updated[key] = editor.innerHTML;
      }
    });

    // ✅ ADD ATTACHMENT IDS TO DATA
    if (attachmentIds.length > 0) {
      updated.attachment_ids = attachmentIds;
    }

    onSave(updated);
  };

  if (emailMode) {
    return (
      <div className={styles.emailComposer}>
        <div className={styles.emailHeaderRow}>
          <div className={styles.emailSubjectRow}>
            <input
              placeholder="Recipients"
              className={`${styles.emailInput} ${errors.recipients ? styles.inputError : ""}`}
              value={values.recipients || ""}
              onChange={(e) => handleChange("recipients", e.target.value)}
            />
            <span className={styles.ccbcc}>Cc Bcc</span>
          </div>
          {errors.recipients && <span className={styles.errorText} style={{ marginLeft: '6px' }}>{errors.recipients}</span>}
          <div className={styles.emailSubjectRow}>
            <input
              placeholder="Subject"
              className={`${styles.emailInput} ${errors.subject ? styles.inputError : ""}`}
              value={values.subject || ""}
              onChange={(e) => handleChange("subject", e.target.value)}
            />
          </div>
          {errors.subject && <span className={styles.errorText} style={{ marginLeft: '6px' }}>{errors.subject}</span>}
        </div>

        <div className={`${styles.emailRichEditor} ${errors.body ? styles.inputError : ""}`}>
          <div
            ref={(el) => {
              if (el && !editorRef.current["body"]) {
                el.innerHTML = values.body || "";
                editorRef.current["body"] = el;
              }
            }}
            className={`${styles.emailEditableBody} ${errors.body && showRedBorder ? styles.inputError : ""}`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              saveSelection();
              handleChange("body", e.currentTarget.innerHTML);
            }}
            onClick={(e) => {
              saveSelection();
              if (e.target.tagName === "A") {
                e.preventDefault();
                window.open(e.target.href, "_blank");
              }
            }}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            placeholder="Body Text"
          />
          {errors.body && <span className={styles.errorText} style={{ margin: '8px' }}>{errors.body}</span>}

          {/* ATTACHMENT TRAY */}
          {attachments.length > 0 && (
            <div className={styles.composerMediaFooter}>
              {attachments.map((file) => (
                <div key={file.id} className={styles.horizontalMediaCard}>
                  <div className={styles.cardPreviewLeft}>
                    {file.type?.startsWith("image/") ? (
                      <img src={file.url} alt="" className={styles.thumbnail} />
                    ) : (
                      <FiFileText size={20} color="#64748b" />
                    )}
                  </div>
                  <div className={styles.cardInfo}>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>

                  <div className={styles.removeIconSmall} onClick={() => {
                    setAttachments(attachments.filter(a => a.id !== file.id));
                    setAttachmentIds(attachmentIds.filter(id => id !== file.id));
                  }}>
                    &times;
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Formatting Bar */}
        {showFormatting && (
          <div className={styles.formattingBar}>
            <FiBold className={styles.toolIcon} onMouseDown={(e) => { e.preventDefault(); format("bold"); }} />
            <FiItalic className={styles.toolIcon} onMouseDown={(e) => { e.preventDefault(); format("italic"); }} />
            <FiUnderline className={styles.toolIcon} onMouseDown={(e) => { e.preventDefault(); format("underline"); }} />
          </div>
        )}

        <div className={styles.emailFooter}>
          <div className={styles.footerLeft}>
            <div className={styles.sendSplitBtn}>
              <button className={styles.sendMain} onClick={handleSubmit}>Send</button>
              <div className={styles.sendArrow}><FiChevronDown /></div>
            </div>

            <div className={styles.toolbarIcons}>
              <FiType
                className={`${styles.tool} ${showFormatting ? styles.activeTool : ""}`}
                onClick={() => setShowFormatting(!showFormatting)}
              />

              <div className={styles.toolWrapper}>
                <FiPaperclip
                  className={`${styles.tool} ${showAttachMenu ? styles.activeTool : ""}`}
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                />

                {showAttachMenu && (
                  <div className={styles.attachMenu}>
                    <div className={styles.attachOption} onClick={() => {
                      handleFileUpload("body", "file");
                      setShowAttachMenu(false);
                    }}>
                      <FiMonitor size={14} />
                      <span>System Upload</span>
                    </div>
                    <div className={styles.attachOption} onClick={() => {
                      fetchExistingAttachments();
                      setShowCustomPicker(true);
                      setShowAttachMenu(false);
                    }}>
                      <FiFolder size={14} />
                      <span>Custom Upload</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.toolWrapper}>
                <FiLink className={styles.tool} onClick={() => toggleLinkPopup("body")} />
                {linkPopup.visible && (
                  <div className={styles.linkPopup}>
                    <input
                      type="text"
                      placeholder="https://..."
                      className={styles.linkUrlInput}
                      value={linkPopup.url}
                      onChange={(e) => setLinkPopup({ ...linkPopup, url: e.target.value })}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmLink("body");
                        if (e.key === 'Escape') setLinkPopup({ visible: false, url: "" });
                      }}
                    />
                    <button className={styles.linkConfirmBtn} onClick={() => confirmLink("body")}>Insert</button>
                  </div>
                )}
              </div>
              <FiSmile className={styles.tool} onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
              <FiImage className={styles.tool} onClick={() => handleFileUpload("body", "image")} />
            </div>

            {showEmojiPicker && (
              <div className={styles.emojiPickerContainer}>
                <EmojiPicker onEmojiClick={(emoji) => onEmojiClick(emoji, "body")} />
              </div>
            )}

            {showCustomPicker && (
              <div className={styles.customPickerOverlay} onClick={() => setShowCustomPicker(false)}>
                <div className={styles.customPickerModal} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.pickerHeader}>
                    <span>Select from CRM Files</span>
                    <FiX onClick={() => setShowCustomPicker(false)} className={styles.closeIcon} />
                  </div>
                  <div className={styles.pickerList}>
                    {existingAttachments.length === 0 ? (
                      <p className={styles.emptyText}>No existing attachments found for this entity.</p>
                    ) : (
                      existingAttachments.map((f) => (
                        <div key={f.id} className={styles.pickerItem} onClick={() => handleSelectExisting(f)}>
                          <div className={styles.pickerLeft}>
                            {f.mime_type?.startsWith("image/") ? (
                              <img src={f.file_url} alt="" className={styles.pickerThumb} />
                            ) : (
                              <FiFileText size={20} color="#64748b" />
                            )}
                          </div>
                          <div className={styles.pickerInfo}>
                            <div className={styles.pickerName}>{f.file_name}</div>
                            <div className={styles.pickerMeta}>
                              {(f.file_size / 1024).toFixed(1)} KB · {f.attachment_type || "File"}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <FiTrash2 className={styles.trashIcon} onClick={() => {
            const b = editorRef.current["body"];
            if (b) b.innerHTML = "";
            handleChange("body", "");
            setAttachments([]);
            setAttachmentIds([]);
            showInfo("Draft cleared");
          }} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={formRef}
      className={`
        ${styles.form}
        ${entityType ? styles[`form_${entityType}`] : ""}
        ${activityType ? styles[`form_${activityType}`] : ""}
      `}
      onClick={() => setOpenDropdown(null)}
    >
      {fields.map((field, index) => {
        const Icon = field.icon;
        return (
          <div
            key={field.name || index}
            className={`${styles.group} ${styles[`field_${field.name}`]}`}
          >
            <label>
              {field.label}
              {field.required && <span className={styles.required}> *</span>}
            </label>

            {field.name === "lead_status" && isConverted ? (
              <div className={styles.inputWrapper}>
                <input type="text" value="Converted" disabled />
              </div>
            ) : (
              <>
                {field.type === "phone" && (
                  <PhoneInput
                    country={"in"}
                    value={values[field.name]?.replace("+", "") || ""}
                    onChange={(phone) => handleChange(field.name, "+" + phone)}
                    inputClass={`${styles.phoneInput} ${errors[field.name] && showRedBorder ? styles.inputError : ""}`}
                    containerClass={styles.phoneContainer}
                    buttonClass={styles.flagButton}
                    dropdownClass={styles.flagDropdown}
                  />
                )}

                {field.type === "textarea" && (
                  <textarea
                    className={`${styles.textarea} ${errors[field.name] && showRedBorder ? styles.inputError : ""}`}
                    value={values[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                )}

                {field.type === "rich_textarea" && (
                  <div className={`${styles.richEditor} ${errors[field.name] && showRedBorder ? styles.inputError : ""}`}>
                    <div className={styles.toolbar}>
                      <FiBold onMouseDown={(e) => { e.preventDefault(); format("bold"); }} />
                      <FiItalic onMouseDown={(e) => { e.preventDefault(); format("italic"); }} />
                      <FiUnderline onMouseDown={(e) => { e.preventDefault(); format("underline"); }} />
                      <FiList onMouseDown={(e) => { e.preventDefault(); format("insertUnorderedList"); }} />
                      <FiMenu onMouseDown={(e) => { e.preventDefault(); format("insertOrderedList"); }} />
                      <FiImage onMouseDown={(e) => {
                        e.preventDefault();
                        handleFileUpload(field.name, "image");
                      }} />
                      <FiPaperclip onMouseDown={(e) => {
                        e.preventDefault();
                        handleFileUpload(field.name, "file");
                      }} />
                    </div>

                    <div
                      ref={(el) => {
                        if (el && !editorRef.current[field.name]) {
                          el.innerHTML = values[field.name] || "";
                          editorRef.current[field.name] = el;
                        }
                      }}
                      className={`${styles.editor} ${errors[field.name] && showRedBorder ? styles.inputError : ""}`}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        saveSelection();
                        handleChange(field.name, e.currentTarget.innerHTML);
                      }}
                      onClick={saveSelection}
                      onKeyUp={saveSelection}
                    />

                    {/* ✅ ATTACHMENT TRAY FOR NOTES */}
                    {attachments.length > 0 && field.name === activityType && (
                      <div className={styles.composerMediaFooter}>
                        {attachments.map((file) => (
                          <div key={file.id} className={styles.compactMediaCard}>
                            <div className={styles.cardPreviewLeft}>
                              {file.type?.startsWith("image/") ? (
                                <img src={file.url} alt="" className={styles.thumbnail} />
                              ) : (
                                <FiFileText size={16} color="#64748b" />
                              )}
                            </div>
                            <div className={styles.cardInfo}>
                              <div className={styles.fileName}>{file.name}</div>
                              <div className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                            <div className={styles.removeIconSmall} onClick={() => {
                              setAttachments(attachments.filter(a => a.id !== file.id));
                              setAttachmentIds(attachmentIds.filter(id => id !== file.id));
                            }}>
                              &times;
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {field.type !== "select" &&
                  field.type !== "phone" &&
                  field.type !== "textarea" &&
                  field.type !== "rich_textarea" && (
                    <>
                      {field.type === "date" ? (
                        activityType?.toLowerCase() === "meeting" ? (
                          <CustomDateInput
                            value={values[field.name]}
                            onChange={(val) => handleChange(field.name, val)}
                            placeholder={field.placeholder || "Select Date"}
                            disabled={field.disabled}
                            error={errors[field.name] && showRedBorder}
                            centered={true}
                            compact={true}
                          />
                        ) : (
                          <DateFilter
                            value={values[field.name]}
                            onChange={(val) => handleChange(field.name, val)}
                            label={field.placeholder || "Select Date"}
                            disabled={field.disabled}
                            error={errors[field.name] && showRedBorder}
                          />
                        )
                      ) : field.type === "time" ? (
                        <CustomTimeInput
                          value={values[field.name]}
                          onChange={(val) => handleChange(field.name, val)}
                          placeholder={field.placeholder || "Select Time"}
                          disabled={field.disabled}
                          error={errors[field.name] && showRedBorder}
                        />
                      ) : (
                        <div className={`${styles.inputWrapper} ${errors[field.name] && showRedBorder ? styles.inputError : ""}`}>
                          {Icon && <Icon className={styles.icon} />}
                          <input
                            type={field.type === "number" ? "number" : "text"}
                            placeholder={field.placeholder || ""}
                            value={values[field.name] || ""}
                            disabled={field.disabled}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}

                {field.type === "select" && field.name === "attendees" && (
                  <AttendeesDropdown
                    field={field}
                    error={errors[field.name] && showRedBorder}
                    value={values[field.name] || []}
                    open={openDropdown === field.name}
                    toggle={() =>
                      setOpenDropdown(openDropdown === field.name ? null : field.name)
                    }
                    onChange={(val) => {
                      handleChange(field.name, val);
                    }}
                  />
                )}

                {field.type === "select" && field.name === "owner_id" && (
                  field.disabled ? (
                    <div className={styles.inputWrapper}>
                      <input
                        type="text"
                        value={
                          field.multiple
                            ? (values[field.name] || [])
                              .map(v => field.options?.find(o => String(o.value) === String(v))?.label)
                              .filter(Boolean)
                              .join(", ")
                            : field.options?.find(o => String(o.value) === String(values[field.name]))?.label || ""
                        }
                        disabled
                      />
                    </div>
                  ) : field.multiple ? (
                    <AttendeesDropdown
                      field={field}
                      error={errors[field.name] && showRedBorder}
                      value={values[field.name] || []}
                      open={openDropdown === field.name}
                      toggle={() =>
                        setOpenDropdown(openDropdown === field.name ? null : field.name)
                      }
                      onChange={(val) => handleChange(field.name, val)}
                    />
                  ) : (
                    <CustomDropdown
                      field={field}
                      error={errors[field.name] && showRedBorder}
                      value={values[field.name]}
                      open={openDropdown === field.name}
                      toggle={() =>
                        setOpenDropdown(openDropdown === field.name ? null : field.name)
                      }
                      onChange={(val) => {
                        handleChange(field.name, val);
                        setOpenDropdown(null);
                      }}
                    />
                  )
                )}

                {field.type === "select" && field.name !== "owner_id" && field.name !== "attendees" && (
                  field.disabled ? (
                    <div className={styles.inputWrapper}>
                      <input
                        type="text"
                        value={
                          field.options?.find(o => String(o.value) === String(values[field.name]))?.label ||
                          values[`${field.name.replace('_id', '')}_name`] ||
                          values[field.name] ||
                          ""
                        }
                        disabled
                      />
                    </div>
                  ) : field.multiple ? (
                    <AttendeesDropdown
                      field={field}
                      error={errors[field.name] && showRedBorder}
                      value={values[field.name] || []}
                      open={openDropdown === field.name}
                      toggle={() =>
                        setOpenDropdown(openDropdown === field.name ? null : field.name)
                      }
                      onChange={(val) => handleChange(field.name, val)}
                    />
                  ) : (
                    <CustomDropdown
                      field={field}
                      error={errors[field.name] && showRedBorder}
                      value={values[field.name]}
                      open={openDropdown === field.name}
                      toggle={() =>
                        setOpenDropdown(openDropdown === field.name ? null : field.name)
                      }
                      onChange={(val) => {
                        handleChange(field.name, val);
                        setOpenDropdown(null);
                      }}
                    />
                  )
                )}
                {errors[field.name] && <span className={styles.errorText}>{errors[field.name]}</span>}
              </>
            )}
          </div>
        );
      })}

      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        <button className={styles.saveBtn} onClick={handleSubmit}>Save</button>
      </div>

    </div>
  );
}

function CustomDropdown({ field, value, open, toggle, onChange, error }) {
  const normalizedOptions = (field.options || []).map((opt) => {
    if (typeof opt === "object") return opt;
    return { label: String(opt), value: opt };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  return (
    <div className={styles.dropdownWrapper}>
      <div
        className={`${styles.dropdownHeader} ${error ? styles.inputError : ""}`}
        onClick={(e) => { e.stopPropagation(); toggle(); }}
      >
        {selectedOption ? (
          selectedOption.label
        ) : (
          <span className={styles.placeholderText}>{field.placeholder || "Select"}</span>
        )}
        <FiChevronDown
          className={`${styles.arrow} ${open ? styles.rotate : ""}`}
        />
      </div>
      {open && (
        <div
          className={styles.dropdownList}
          onClick={(e) => e.stopPropagation()}
        >
          {normalizedOptions.map((opt, idx) => (
            <div
              key={`${field.name}-${opt.value}-${idx}`}
              className={`${styles.dropdownItem} ${value === opt.value ? styles.activeItem : ""
                }`}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendeesDropdown({ field, value = [], open, toggle, onChange, error }) {
  const normalizedOptions = (field.options || []).map((opt) => {
    if (typeof opt === "object") return opt;
    return { label: String(opt), value: opt };
  });

  const normalizedValue = Array.isArray(value) ? value : [];

  const getHeaderLabel = () => {
    const labelMap = {
      leads: "Lead Owner",
      companies: "Company Owner",
      deals: "Deal Owner",
      tickets: "Ticket Owner",
    };
    const defaultLabel = labelMap[field.entityType] || "Multi Owners";

    if (normalizedValue.length === 0) return defaultLabel;

    const labels = normalizedValue
      .map((v) => {
        const item = normalizedOptions.find((o) => o.value === v);
        return item?.label;
      })
      .filter(Boolean);

    if (labels.length === 1) return labels[0];
    return labels.join(", ");
  };

  return (
    <div className={styles.dropdownWrapper}>
      <div
        className={`${styles.dropdownHeader} ${error ? styles.inputError : ""}`}
        onClick={(e) => { e.stopPropagation(); toggle(); }}
      >
        {normalizedValue.length > 0 ? (
          getHeaderLabel()
        ) : (
          <span className={styles.placeholderText}>{getHeaderLabel()}</span>
        )}
        <FiChevronDown
          className={`${styles.arrow} ${open ? styles.rotate : ""}`}
        />
      </div>
      {open && (
        <div
          className={styles.dropdownList}
          onClick={(e) => e.stopPropagation()}
        >
          {normalizedOptions.map((opt, idx) => {
            const isSelected = value.includes(opt.value);
            return (
              <div
                key={`${field.name}-${opt.value}-${idx}`}
                className={`${styles.dropdownItem} ${isSelected ? styles.activeItem : ""
                  }`}
                onClick={() => {
                  const updated = isSelected
                    ? value.filter(v => v !== opt.value)
                    : [...value, opt.value];
                  onChange(updated);
                }}
              >
                <span style={{ marginRight: 8 }}>
                  {isSelected ? "✔" : "☐"}
                </span>
                <span>👤 {opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}