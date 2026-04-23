const { Call, sequelize } = require("../models");
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

// CREATE CALL
async function createCall({ data, user_id, related_id, related_type }) {
  const call = await Call.create({
    connected_to: toNull(data.connected_to || data.connected),
    call_outcome: toNull(data.call_outcome || data.outcome),
    call_date: toNull(data.call_date || data.date),
    call_time: toNull(data.call_time || data.time),
    duration: toNull(data.duration),
    note: toNull(data.note),
    user_id: toNull(user_id),
    related_id: toNull(related_id),
    related_type: toNull(related_type),
  });
  return call.toJSON();
}

// GET CALLS
async function getCalls(related_id, related_type) {
  const sql = `
    SELECT c.*, u.first_name, u.last_name
    FROM calls c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.related_id = :related_id AND c.related_type = :related_type
    ORDER BY c.created_at DESC
  `;
  return await sequelize.query(sql, {
    replacements: { related_id: toNull(related_id), related_type: toNull(related_type) },
    type: QueryTypes.SELECT
  });
}

module.exports = {
  createCall,
  getCalls,
};
