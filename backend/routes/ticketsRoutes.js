// [routes/ticketsRoutes.js]
const express = require("express");
const router = express.Router();
const controller = require("../controllers/ticketsController");
const asyncHandler = require("../middlewares/asyncHandler");
const authMiddleware = require("../middlewares/authMiddleware");

// GET ALL (🔐 PROTECTED)
router.get("/", authMiddleware, asyncHandler(controller.getTickets));

// GET ONE
router.get("/:id", authMiddleware, asyncHandler(controller.getTicketById));

// CREATE
router.post("/", authMiddleware, asyncHandler(controller.createTicket));

// BULK CREATE
router.post("/bulk", authMiddleware, asyncHandler(controller.bulkCreateTickets));

// UPDATE
router.put("/:id", authMiddleware, asyncHandler(controller.updateTicket));

// DELETE
router.delete("/:id", authMiddleware, asyncHandler(controller.deleteTicket));

// BULK DELETE
router.post("/bulk-delete", authMiddleware, asyncHandler(controller.bulkDeleteTickets));

module.exports = router;