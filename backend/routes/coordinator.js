const express = require("express");
const router = express.Router();
const { protect, coordinatorOnly } = require("../middleware/auth");
const {
  createCoordinator,
  getMyProfile,
  updateMyProfile,
  updateNotificationPreferences,
  getRecentActivity,
} = require("../controllers/coordinatorController");

router.post("/", protect, coordinatorOnly, createCoordinator);
router.get("/me", protect, coordinatorOnly, getMyProfile);
router.put("/me", protect, coordinatorOnly, updateMyProfile);
router.put(
  "/me/notifications",
  protect,
  coordinatorOnly,
  updateNotificationPreferences,
);
router.get("/me/activity", protect, coordinatorOnly, getRecentActivity);

module.exports = router;
