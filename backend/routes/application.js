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
} = require("../controllers/applicationController");
const { protect, coordinatorOnly } = require('../middleware/auth')


router.post('/', protect, createApplication)
router.get('/my', protect, getMyApplications)
router.get('/job/:jobId', protect, coordinatorOnly, getJobApplications)
router.put('/:id/status', protect, coordinatorOnly, updateApplicationStatus)
// "I applied by mistake" fix — coordinator can permanently remove an
// application (not just change its status). See withdrawApplication for
// the resultsFinalized guard + placementStatus recompute + notification.
router.delete('/:id', protect, coordinatorOnly, withdrawApplication)
router.get('/job/:jobId/export', protect, coordinatorOnly, exportJobApplications)
router.post('/job/:jobId/bulk-apply', protect, coordinatorOnly, bulkApply)

module.exports = router;