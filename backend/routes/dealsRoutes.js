const express = require("express");
const router = express.Router();
const controller = require("../controllers/dealsController");
const asyncHandler = require("../middlewares/asyncHandler");
const authMiddleware = require("../middlewares/authMiddleware");

// GET ALL
router.get("/", authMiddleware, asyncHandler(controller.getDeals));

// GET ONE
router.get("/:id", authMiddleware, asyncHandler(controller.getDealById));

// CREATE
router.post("/", authMiddleware, asyncHandler(controller.createDeal));

// BULK CREATE
router.post("/bulk", authMiddleware, asyncHandler(controller.bulkCreateDeals));

// UPDATE
router.put("/:id", authMiddleware, asyncHandler(controller.updateDeal));

// DELETE
router.delete("/:id", authMiddleware, asyncHandler(controller.deleteDeal));

// BULK DELETE
router.post("/bulk-delete", authMiddleware, asyncHandler(controller.bulkDeleteDeals));

module.exports = router;