const Notification = require('../models/Notification')

// Apni notifications dekho
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Unread count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, isRead: false })
    res.json({ count })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Ek notification read mark karo
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Saari notifications read mark karo
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getMyNotifications, getUnreadCount, markAsRead, markAllRead }