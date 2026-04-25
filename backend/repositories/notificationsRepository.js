const { Notification } = require("../models");

const toNull = (val) => {
  if (val === undefined || val === null || val === "" || String(val).toLowerCase() === "nan") {
    return null;
  }
  return val;
};

// GET BY USER (with Pagination)
async function getNotificationsByUserId(userId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const { count, rows } = await Notification.findAndCountAll({
    where: { user_id: Number(userId) },
    order: [
      ["is_read", "ASC"],
      ["created_at", "DESC"]
    ],
    limit: Number(limit),
    offset: Number(offset)
  });
  return { data: rows.map(r => r.toJSON()), total: count };
}

// CREATE
async function createNotification(data) {
  const notif = await Notification.create({
    user_id: toNull(data.user_id),
    type: data.type || "info",
    title: data.title || null,
    message: data.message,
    metadata: data.metadata || null,
    entity_type: toNull(data.entity_type),
    entity_id: toNull(data.entity_id),
    is_read: false
  });
  return notif.toJSON();
}

// MARK AS READ
async function markAsRead(id) {
  await Notification.update(
    { is_read: true },
    { where: { id: toNull(id) } }
  );
}

// MARK ALL AS READ
async function markAllAsRead(userId) {
  await Notification.update(
    { is_read: true },
    { where: { user_id: toNull(userId), is_read: false } }
  );
}

// DELETE
async function deleteNotification(id) {
  await Notification.destroy({
    where: { id: toNull(id) }
  });
}

// BROADCAST TO USER AND ADMINS
async function broadcastNotification(data) {
  const { getAdminIds } = require("./usersRepository");
  const recipients = new Set();
  
  if (data.user_id) recipients.add(Number(data.user_id));
  
  try {
    const adminIds = await getAdminIds();
    adminIds.forEach(id => recipients.add(Number(id)));
  } catch (err) {
    console.error("Broadcast: Failed to fetch admin IDs:", err);
  }

  const createdNotifs = [];
  for (const userId of recipients) {
    const notif = await createNotification({ ...data, user_id: userId });
    createdNotifs.push(notif);
  }
  return createdNotifs;
}

module.exports = {
  getNotificationsByUserId,
  createNotification,
  broadcastNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
