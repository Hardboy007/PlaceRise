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
// TEMPORARY — delete after use
router.delete("/clear-codes", protect, coordinatorOnly, async (req, res) => {
  const Company = require("../models/Company");
  try {
    await Company.updateMany({}, { $unset: { hrAccessCode: "" } });
    res.json({ message: "All access codes cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;