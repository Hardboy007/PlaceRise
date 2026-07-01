const express = require("express");
const router = express.Router();
const upload = require('../middleware/upload')
const {
  getAllStudents,
  getStudentById,
  updateStudent,
  bulkImportStudents,
  exportStudentsExcel,
} = require("../controllers/studentController");
const { protect, coordinatorOnly } = require('../middleware/auth')

router.get('/', protect, coordinatorOnly, getAllStudents)
router.get('/export', protect, coordinatorOnly, exportStudentsExcel)
router.get('/:id', protect, getStudentById)
router.put('/:id', protect, updateStudent)
router.post('/bulk-import', protect, coordinatorOnly, upload.single('file'), bulkImportStudents)

module.exports = router;
