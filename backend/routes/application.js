const express = require("express");
const router = express.Router();
const {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
} = require("../controllers/applicationController");
const { protect, coordinatorOnly } = require('../middleware/auth')


router.post('/', protect, createApplication)
router.get('/my', protect, getMyApplications)
router.get('/job/:jobId', protect, coordinatorOnly, getJobApplications)
router.put('/:id/status', protect, coordinatorOnly, updateApplicationStatus)

module.exports = router;
