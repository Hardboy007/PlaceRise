const express = require("express");
const router = express.Router();
const { loginLimiter } = require("../middleware/security");
const { protect } = require("../middleware/auth");
const {
  login,
  changePassword,
  studentLogin,
  coordinatorLogin,
  forgotPassword,
  resetPassword,
  sendEmailOtp,
  verifyEmailOtp,
} = require("../controllers/authController");

router.post("/login", loginLimiter, login);
router.put("/change-password", protect, changePassword);
router.post("/student/login", studentLogin);
router.post("/coordinator/login", coordinatorLogin);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.post("/send-email-otp", protect, sendEmailOtp);
router.post("/verify-email-otp", protect, verifyEmailOtp);

module.exports = router;
