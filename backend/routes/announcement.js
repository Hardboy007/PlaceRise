const express = require("express");
const router = express.Router();

const {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const {
  protect,
  coordinatorOnly,
  checkCRCHead,
} = require("../middleware/auth");

router.get("/", getAllAnnouncements); // public — students bhi dekh sakte
router.post("/", protect, coordinatorOnly, checkCRCHead, createAnnouncement);
router.put("/:id", protect, coordinatorOnly, checkCRCHead, updateAnnouncement);
router.delete(
  "/:id",
  protect,
  coordinatorOnly,
  checkCRCHead,
  deleteAnnouncement,
);

module.exports = router;
