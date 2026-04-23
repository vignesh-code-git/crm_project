const express = require("express");
const router = express.Router();
const controller = require("../controllers/notesController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, controller.createNote);
router.get("/", authMiddleware, controller.getNotes);

module.exports = router;