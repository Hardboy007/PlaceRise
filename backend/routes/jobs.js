const express = require("express");
const router = express.Router();
const {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");
const { protect, coordinatorOnly, checkCRCHead } = require("../middleware/auth");

router.get("/", protect, getJobs);
router.post("/", protect, coordinatorOnly, checkCRCHead, createJob);
router.put("/:id", protect, coordinatorOnly, checkCRCHead, updateJob);
router.delete("/:id", protect, coordinatorOnly, checkCRCHead, deleteJob);

module.exports = router;