const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { studentLogin, coordinatorLogin, changePassword } = require('../controllers/authController')

router.put('/change-password', protect, changePassword)
router.post('/student/login', studentLogin)
router.post('/coordinator/login', coordinatorLogin)

module.exports = router