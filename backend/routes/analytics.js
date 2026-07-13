const express = require('express')
const router = express.Router()
const { protect, coordinatorOnly } = require('../middleware/auth')
const { getAnalytics, exportAnalyticsExcel } = require('../controllers/analyticsController')

router.get('/', protect, coordinatorOnly, getAnalytics)
router.get('/export', protect, coordinatorOnly, exportAnalyticsExcel)

module.exports = router