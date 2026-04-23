const express = require("express");
const router = express.Router();
const controller = require("../controllers/emailsController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, controller.createEmail);
router.get("/", authMiddleware, controller.getEmails);

module.exports = router;
