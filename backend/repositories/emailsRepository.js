const { Email, sequelize } = require("../models");
const { QueryTypes } = require("sequelize");

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

const attachmentsRepo = require("./attachmentsRepository");

// CREATE EMAIL
async function createEmail({ data, user_id, related_id, related_type }) {
  const email = await Email.create({
    recipients: toNull(data.recipients),
    subject: toNull(data.subject),
    body: toNull(data.body),
    user_id: toNull(user_id),
    related_id: toNull(related_id),
    related_type: toNull(related_type),
  });

  const emailId = email.id;
  
  // 🔥 LINK ATTACHMENTS
  if (data.attachment_ids && data.attachment_ids.length > 0) {
    await attachmentsRepo.linkAttachments(data.attachment_ids, "email", emailId);
  }

  return email.toJSON();
}

// GET EMAILS
async function getEmails(related_id, related_type) {
  const sql = `
    SELECT 
        e.*, 
        u.first_name, 
        u.last_name,
        COALESCE(
          (SELECT json_agg(a.*) 
           FROM attachments a 
           WHERE a.attachment_id = e.id 
           AND a.attachment_type = 'email'), 
          '[]'
        ) as attachments
    FROM emails e
    LEFT JOIN users u ON e.user_id = u.id
    WHERE e.related_id = :related_id AND e.related_type = :related_type
    ORDER BY e.created_at DESC
  `;
  return await sequelize.query(sql, {
    replacements: { related_id: toNull(related_id), related_type: toNull(related_type) },
    type: QueryTypes.SELECT
  });
}

module.exports = {
  createEmail,
  getEmails,
};
