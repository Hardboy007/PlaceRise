const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  updateStudent,
} = require('../controllers/studentController');

router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.put('/:id', updateStudent);

module.exports = router;