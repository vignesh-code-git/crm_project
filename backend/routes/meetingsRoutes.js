const express = require("express");
const router = express.Router();
const controller = require("../controllers/meetingsController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, controller.createMeeting);
router.get("/", authMiddleware, controller.getMeetings);

module.exports = router;
