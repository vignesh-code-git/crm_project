const express = require("express");
const router = express.Router();

const controller = require("../controllers/usersController");
const asyncHandler = require("../middlewares/asyncHandler");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware"); // 🔥 ADD THIS

// =========================================
// AUTH ROUTES
// =========================================
router.post("/register", asyncHandler(controller.registerUser));
router.post("/login", asyncHandler(controller.loginUser));
router.post("/logout", controller.logoutUser);

// =========================================
// PROFILE (LOGGED USER)
// =========================================
router.get(
  "/profile",
  authMiddleware,
  asyncHandler(controller.getProfile)
);

router.put(
  "/profile",
  authMiddleware,
  asyncHandler(controller.updateProfile)
);

router.delete(
  "/profile",
  authMiddleware,
  asyncHandler(controller.deleteAccount)
);

// =========================================
// GET ALL USERS (ADMIN ONLY 🔐)
// =========================================
router.get(
  "/",
  authMiddleware,
  allowRoles("admin"), // 🔥 ONLY ADMIN CAN SEE USERS
  asyncHandler(controller.getUsers)
);

module.exports = router;