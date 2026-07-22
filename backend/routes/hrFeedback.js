const express = require("express");
const router = express.Router();
const {
  generateCompanyCode,
  verifyCompanyCode,
  submitFeedback,
  getFeedback,
} = require("../controllers/hrFeedbackController");
const { protect, coordinatorOnly } = require("../middleware/auth");
const { guestProtect } = require("../middleware/guestAuth");

// Guest (HR) routes — no student/coordinator auth
router.post("/verify-code", verifyCompanyCode);
router.post("/submit", guestProtect, submitFeedback);

// Coordinator routes
router.post(
  "/generate-code/:companyId",
  protect,
  coordinatorOnly,
  generateCompanyCode,
);
router.get("/", protect, coordinatorOnly, getFeedback);

module.exports = router;