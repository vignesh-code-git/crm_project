// [routes/companiesRoutes.js]
const express = require("express");
const router = express.Router();
const controller = require("../controllers/companiesController");
const asyncHandler = require("../middlewares/asyncHandler");
const authMiddleware = require("../middlewares/authMiddleware");

// GET ALL
router.get("/", authMiddleware, asyncHandler(controller.getCompanies));

// GET ONE
router.get("/:id", authMiddleware, asyncHandler(controller.getCompanyById));

// CREATE
router.post("/", authMiddleware, asyncHandler(controller.createCompany));

// BULK CREATE
router.post("/bulk", authMiddleware, asyncHandler(controller.bulkCreateCompanies));

// UPDATE
router.put("/:id", authMiddleware, asyncHandler(controller.updateCompany));

// DELETE
router.delete("/:id", authMiddleware, asyncHandler(controller.deleteCompany));

// BULK DELETE
router.post("/bulk-delete", authMiddleware, asyncHandler(controller.bulkDeleteCompanies));

module.exports = router;