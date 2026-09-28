const express = require("express");
const router = express.Router();
const { loginLimiter } = require("../middleware/security");
const { protect, coordinatorOnly } = require("../middleware/auth");
const {
  changePassword,
  studentLogin,
  coordinatorLogin,
  forgotPassword,
  resetPassword,
  sendEmailOtp,
  verifyEmailOtp,
  sendCoordinatorOtp,
  verifyCoordinatorOtp,
} = require("../controllers/authController");

router.post("/student/login", loginLimiter, studentLogin);
router.post("/coordinator/login", loginLimiter, coordinatorLogin);
router.put("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// Student email OTP
router.post("/send-email-otp", protect, sendEmailOtp);
router.post("/verify-email-otp", protect, verifyEmailOtp);

// Coordinator / CRC Head email OTP
router.post("/coordinator/send-otp", protect, coordinatorOnly, sendCoordinatorOtp);
router.post("/coordinator/verify-otp", protect, coordinatorOnly, verifyCoordinatorOtp);

module.exports = router;