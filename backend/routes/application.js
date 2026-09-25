const express = require("express");
const router = express.Router();
const {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  exportJobApplications,
  bulkApply,
  updateRoundStatus,
  bulkUpdateRoundStatus,
} = require("../controllers/applicationController");
const { protect, coordinatorOnly, checkCRCHead } = require("../middleware/auth");

router.post("/", protect, createApplication);
router.get("/my", protect, getMyApplications);
router.get("/job/:jobId", protect, coordinatorOnly, getJobApplications);
// "I applied by mistake" fix — coordinator can permanently remove an
// application (not just change its status). See withdrawApplication for
// the resultsFinalized guard + placementStatus recompute + notification.
router.delete("/:id", protect, coordinatorOnly, checkCRCHead, withdrawApplication);
router.get(
  "/job/:jobId/export",
  protect,
  coordinatorOnly,
  exportJobApplications,
);
router.put("/job/:jobId/bulk-round-status", protect, coordinatorOnly, checkCRCHead, bulkUpdateRoundStatus);
router.put("/:id/round-status", protect, coordinatorOnly, checkCRCHead, updateRoundStatus);
router.put("/:id/status", protect, coordinatorOnly, checkCRCHead, updateApplicationStatus);
router.post("/job/:jobId/bulk-apply", protect, coordinatorOnly, checkCRCHead, bulkApply);

module.exports = router;