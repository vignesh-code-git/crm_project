const express = require("express");
const router = express.Router();
const controller = require("../controllers/searchController");
const authMiddleware = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

// Global Search
router.get("/", authMiddleware, asyncHandler(controller.search));

module.exports = router;
