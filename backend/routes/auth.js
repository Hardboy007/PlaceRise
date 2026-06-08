const express = require('express')
const router = express.Router()
const { studentLogin, coordinatorLogin } = require('../controllers/authController')

router.post('/student/login', studentLogin)
router.post('/coordinator/login', coordinatorLogin)

module.exports = router