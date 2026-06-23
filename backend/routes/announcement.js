const express = require("express");
const router = express.Router();

const {
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");

router.get("/", getAllAnnouncements);
router.post("/", createAnnouncement);
router.delete("/:id", deleteAnnouncement);

module.exports = router;
