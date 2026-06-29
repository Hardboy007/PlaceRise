const express = require("express");
const router = express.Router();
const {
  createJob,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");
const { protect, coordinatorOnly } = require("../middleware/auth");

router.post("/", protect, coordinatorOnly, createJob);
router.put("/:id", protect, coordinatorOnly, updateJob);
router.delete("/:id", protect, coordinatorOnly, deleteJob);

module.exports = router;
