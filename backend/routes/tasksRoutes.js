const express = require("express");
const router = express.Router();
const controller = require("../controllers/tasksController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, controller.createTask);
router.get("/", authMiddleware, controller.getTasks);
router.patch("/:id", authMiddleware, controller.updateTask);

module.exports = router;
