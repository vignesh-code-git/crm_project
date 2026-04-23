const { Note, sequelize } = require("../models");
const { QueryTypes } = require("sequelize");
const attachmentsRepo = require("./attachmentsRepository");

// ==========================
// 🔥 HELPERS
// ==========================
const toNull = (val) => {
  if (val === undefined || val === null || val === "" || String(val).toLowerCase() === "nan") {
    return null;
  }
  return val;
};

// ==========================
// 🔥 REPOSITORY
// ==========================

// CREATE NOTE
exports.createNote = async ({ data, user_id, related_id, related_type }) => {
  const content = data.content || data.note || "";
  
  const note = await Note.create({
    content: content,
    related_id: toNull(related_id),
    related_type: toNull(related_type),
    user_id: toNull(user_id),
  });
  
  const noteId = note.id;
  console.log("🚀 DB SUCCESS: Note created ID:", noteId);
  
  // 🔥 LINK ATTACHMENTS
  if (data.attachment_ids && data.attachment_ids.length > 0) {
    await attachmentsRepo.linkAttachments(data.attachment_ids, "note", noteId);
  }
  
  return note.toJSON();
};

// GET NOTES
exports.getNotes = async (related_id, related_type) => {
  const sql = `
    SELECT 
        n.*, 
        u.first_name, 
        u.last_name,
        COALESCE(
          (SELECT json_agg(a.*) 
           FROM attachments a 
           WHERE a.attachment_id = n.id 
           AND a.attachment_type = 'note'), 
          '[]'
        ) as attachments
    FROM notes n
    LEFT JOIN users u ON n.user_id = u.id
    WHERE n.related_id = :related_id AND n.related_type = :related_type
    ORDER BY n.created_at DESC
  `;
  return await sequelize.query(sql, {
    replacements: { related_id: toNull(related_id), related_type: toNull(related_type) },
    type: QueryTypes.SELECT
  });
};

// UPLOAD ATTACHMENT
exports.createAttachment = async (args) => {
  // Delegate back to attachmentsRepo just in case other files expect it here
  return await attachmentsRepo.createAttachment(args);
};