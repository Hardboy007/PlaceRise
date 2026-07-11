const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { getMyNotifications, getUnreadCount, markAsRead, markAllRead } = require('../controllers/notificationController')

router.get('/', protect, getMyNotifications)
router.get('/unread-count', protect, getUnreadCount)
router.put('/:id/read', protect, markAsRead)
router.put('/mark-all-read', protect, markAllRead)

module.exports = router