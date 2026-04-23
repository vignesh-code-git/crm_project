const { Notification } = require("../models");

const toNull = (val) => {
  if (val === undefined || val === null || val === "" || String(val).toLowerCase() === "nan") {
    return null;
  }
  return val;
};

// GET BY USER
async function getNotificationsByUserId(userId) {
  return await Notification.findAll({
    where: { user_id: toNull(userId) },
    order: [
      ["is_read", "ASC"],
      ["created_at", "DESC"]
    ]
  });
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

module.exports = {
  getNotificationsByUserId,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
