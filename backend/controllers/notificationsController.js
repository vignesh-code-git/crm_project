const repo = require("../repositories/notificationsRepository");

// GET ALL FOR USER
exports.getNotifications = async (req, res) => {
  try {
    const data = await repo.getNotificationsByUserId(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// MARK AS READ
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await repo.markAsRead(id);
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
  try {
    await repo.markAllAsRead(req.user.id);
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE NOTIFICATION
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await repo.deleteNotification(id);
    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
