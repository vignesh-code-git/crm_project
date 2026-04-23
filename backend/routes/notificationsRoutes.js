const express = require("express");
const router = express.Router();
const controller = require("../controllers/notificationsController");
const authMiddleware = require("../middlewares/authMiddleware");

// All notification routes are protected
router.use(authMiddleware);

router.get("/", controller.getNotifications);
router.put("/read-all", controller.markAllAsRead);
router.put("/:id/read", controller.markAsRead);
router.delete("/:id", controller.deleteNotification);

module.exports = router;
