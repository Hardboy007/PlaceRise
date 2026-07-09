const express = require('express')
const router = express.Router()
const { protect, coordinatorOnly } = require('../middleware/auth')
const { startSession, getSessionAttendance, markAttendance, manualMark, closeSession, exportAttendancePDF } = require('../controllers/attendanceController')

router.post('/start', protect, coordinatorOnly, startSession)
router.get('/:sessionId', protect, getSessionAttendance)
router.post('/mark', protect, markAttendance)
router.post('/:sessionId/manual', protect, coordinatorOnly, manualMark)
router.put('/:sessionId/close', protect, coordinatorOnly, closeSession)
router.get('/:sessionId/export', protect, coordinatorOnly, exportAttendancePDF)

module.exports = router