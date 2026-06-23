const express = require("express");
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  updateStudent,
} = require("../controllers/studentController");
const { protect, coordinatorOnly } = require('../middleware/auth')

router.get('/', protect, coordinatorOnly, getAllStudents)
router.get('/:id', protect, getStudentById)
router.put('/:id', protect, updateStudent)

module.exports = router;
