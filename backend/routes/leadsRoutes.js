const express = require("express");
const router = express.Router();
const controller = require("../controllers/leadsController");
const asyncHandler = require("../middlewares/asyncHandler");
const authMiddleware = require("../middlewares/authMiddleware");

// GET ALL
router.get("/", authMiddleware, asyncHandler(controller.getLeads));

// GET ONE
router.get("/:id", authMiddleware, asyncHandler(controller.getLeadById));

// CREATE
router.post("/", authMiddleware, asyncHandler(controller.createLead));

// BULK CREATE
router.post("/bulk", authMiddleware, asyncHandler(controller.bulkCreateLeads));

// CONVERT
router.post("/:id/convert", authMiddleware, asyncHandler(controller.convertLead));

// QUALIFIED
router.get("/qualified", authMiddleware, asyncHandler(controller.getQualifiedLeads));

// UPDATE
router.put("/:id", authMiddleware, asyncHandler(controller.updateLead));

// DELETE
router.delete("/:id", authMiddleware, asyncHandler(controller.deleteLead));

// BULK DELETE
router.post("/bulk-delete", authMiddleware, asyncHandler(controller.bulkDeleteLeads));

module.exports = router;