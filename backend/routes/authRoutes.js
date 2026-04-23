// [routes/authRoutes.js]
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Forgot password
router.post("/forgot-password", authController.forgotPassword);

// Reset password
router.post("/reset-password/:token", authController.resetPassword);

router.post("/call", authController.callUser);


module.exports = router;