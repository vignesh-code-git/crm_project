const express = require("express");
const router = express.Router();
const controller = require("../controllers/activitiesController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, controller.getActivities);
router.post("/", authMiddleware, controller.createActivity);

module.exports = router;
