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
// ADMIN ROUTES (🔐)
// =========================================
router.get(
  "/",
  authMiddleware,
  allowRoles("admin"),
  asyncHandler(controller.getUsers)
);

router.post(
  "/",
  authMiddleware,
  allowRoles("admin"),
  asyncHandler(controller.registerUser)
);

router.post(
  "/bulk",
  authMiddleware,
  allowRoles("admin"),
  asyncHandler(controller.bulkCreateUsers)
);

router.post(
  "/bulk-delete",
  authMiddleware,
  allowRoles("admin"),
  asyncHandler(controller.bulkDeleteUsers)
);

router.put(
  "/:id",
  authMiddleware,
  allowRoles("admin"),
  asyncHandler(controller.updateUserAdmin)
);

router.delete(
  "/:id",
  authMiddleware,
  allowRoles("admin"),
  asyncHandler(controller.deleteUserAdmin)
);

module.exports = router;