const { User } = require("../models");
const notifRepo = require("../repositories/notificationsRepository");
const { Op } = require("sequelize");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../services/emailService");

// 🔹 FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📧 Forgot password request for email:", email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });

    console.log("👤 User found:", user ? "YES" : "NO");

    if (!user) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await User.update({
      reset_token: token,
      reset_token_expiry: expiry
    }, {
      where: { email }
    });

    console.log("✅ DB Updated with token for:", email);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User";

    await sendEmail({
      to: email,
      subject: "Reset Your CRM Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f7f7fb; border-radius: 8px;">
          <h2 style="color: #111; margin-bottom: 8px;">Reset Your Password</h2>
          <p style="color: #555; margin-bottom: 24px;">Hi ${userName},</p>
          <p style="color: #555; margin-bottom: 24px;">
            We received a request to reset your password. Click the button below to set a new password.
            This link will expire in <strong>15 minutes</strong>.
          </p>
          <a href="${resetLink}"
            style="display: inline-block; padding: 13px 28px; background: #5b4ee5; color: #fff;
                   text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    res.json({ message: "Reset email sent" });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

// 🔹 RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log("🔑 Reset password request for token:", token ? token.substring(0, 10) + "..." : "NONE");

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
       where: {
         reset_token: token,
         reset_token_expiry: { [Op.gt]: new Date() }
       }
    });

    console.log("👤 Valid token found:", user ? "YES" : "NO (invalid or expired)");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null
    }, {
      where: { id: user.id }
    });

    console.log("✅ Password updated for user id:", user.id);

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: user.id,
      type: "success",
      message: "Your password has been reset successfully. If you did not perform this action, please contact support.",
      metadata: { 
        actor_name: `${user.first_name || ""} ${user.last_name || ""}`.trim()
      }
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};

const { makeCall, sendSMS } = require("../services/callsService");

exports.callUser = async (req, res) => {
  try {
    const { phone } = req.body;

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    const message = `Hello, This Is a Customer Care Notification From Your CRM System. Your verification code is ${otp}`;

    // 🔥 CALL + SMS SAME TIME
    const [smsResult, callResult] = await Promise.all([
      sendSMS(phone, message),
      makeCall(phone, message)
    ]);

    res.json({
      message: "OTP sent via SMS and Call",
      otp, // ⚠️ remove in production
      smsSid: smsResult.sid,
      callSid: callResult.sid
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ message: "Call/SMS failed" });
  }
};