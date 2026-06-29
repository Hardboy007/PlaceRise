const express = require('express');
const router = express.Router();
const { protect, coordinatorOnly } = require('../middleware/auth');
const { createCoordinator } = require('../controllers/coordinatorController');

router.post('/', protect, coordinatorOnly, createCoordinator);

module.exports = router;