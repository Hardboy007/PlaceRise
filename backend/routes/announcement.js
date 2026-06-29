const express = require("express");
const router = express.Router();

const {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect, coordinatorOnly } = require('../middleware/auth');

router.get('/', getAllAnnouncements)                               // public — students bhi dekh sakte
router.post('/', protect, coordinatorOnly, createAnnouncement)
router.put('/:id', protect, coordinatorOnly, updateAnnouncement)
router.delete('/:id', protect, coordinatorOnly, deleteAnnouncement)

module.exports = router;
