const express = require("express");
const router = express.Router();
const { protect, coordinatorOnly } = require("../middleware/auth");
const {
  startSession,
  getActiveSession,
  getSessionAttendance,
  markAttendance,
  manualMark,
  closeSession,
  exportAttendancePDF,
} = require("../controllers/attendanceController");

router.post("/start", protect, coordinatorOnly, startSession);
router.get("/active", protect, coordinatorOnly, getActiveSession);
router.post("/mark", protect, markAttendance);
router.get("/:sessionId/export", protect, coordinatorOnly, exportAttendancePDF);
router.get("/:sessionId", protect, getSessionAttendance);
router.post("/:sessionId/manual", protect, coordinatorOnly, manualMark);
router.put("/:sessionId/close", protect, coordinatorOnly, closeSession);

module.exports = router;
