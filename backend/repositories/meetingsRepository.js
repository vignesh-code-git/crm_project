const { Meeting, sequelize } = require("../models");
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

// CREATE MEETING
async function createMeeting({ data, user_id, related_id, related_type }) {
    const attendeeNames = typeof (data.attendee_names || data.attendees) === 'string'
      ? (data.attendee_names || data.attendees).split(',').map(n => n.trim()).filter(Boolean)
      : (data.attendee_names || data.attendees || []);

    const uniqueNames = [...new Set(attendeeNames)]; // 🔥 Deduplicate

    const meeting = await Meeting.create({
      title: toNull(data.title),
      start_date: toNull(data.start_date || data.startDate),
      start_time: toNull(data.start_time || data.startTime),
      end_time: toNull(data.end_time || data.endTime),
      location: toNull(data.location),
      reminder: toNull(data.reminder),
      note: toNull(data.note),
      attendee_ids: data.attendee_ids || [],
      attendees_count: uniqueNames.length, // 🔥 AUTOMATIC COUNT
      user_id: toNull(user_id),
      related_id: toNull(related_id),
      related_type: toNull(related_type),
      attendee_names: uniqueNames,
    });
  return meeting.toJSON();
}

// GET MEETINGS
async function getMeetings(related_id, related_type) {
  const sql = `
    SELECT m.*, u.first_name, u.last_name
    FROM meetings m
    LEFT JOIN users u ON m.user_id = u.id
    WHERE m.related_id = :related_id AND m.related_type = :related_type
    ORDER BY m.created_at DESC
  `;
  return await sequelize.query(sql, {
    replacements: { related_id: toNull(related_id), related_type: toNull(related_type) },
    type: QueryTypes.SELECT
  });
}

module.exports = {
  createMeeting,
  getMeetings,
};
