const express = require("express");
const router = express.Router();
const {
  generateCompanyCode,
  verifyCompanyCode,
  submitFeedback,
  getFeedback,
  markSeenForCompany,
} = require("../controllers/hrFeedbackController");
const { protect, coordinatorOnly } = require("../middleware/auth");
const { guestProtect } = require("../middleware/guestAuth");

router.post("/verify-code", verifyCompanyCode);
router.post("/submit", guestProtect, submitFeedback);

router.post(
  "/generate-code/:companyId",
  protect,
  coordinatorOnly,
  generateCompanyCode,
);
router.get("/", protect, coordinatorOnly, getFeedback);
router.patch(
  "/mark-seen/:companyId",
  protect,
  coordinatorOnly,
  markSeenForCompany,
);

module.exports = router;