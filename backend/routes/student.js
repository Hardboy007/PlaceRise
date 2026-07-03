const express = require("express");
const router = express.Router();
const upload = require('../middleware/upload')
const {
  getAllStudents,
  getStudentById,
  getMyProfile,
  updateStudent,
  updateNotificationPreferences,
  bulkImportStudents,
  exportStudentsExcel,
} = require("../controllers/studentController");
const { protect, coordinatorOnly } = require('../middleware/auth')

router.get('/', protect, coordinatorOnly, getAllStudents)
router.get('/export', protect, coordinatorOnly, exportStudentsExcel)
router.get('/me', protect, getMyProfile)
router.put('/me/notifications', protect, updateNotificationPreferences)
router.get('/:id', protect, getStudentById)
router.put('/:id', protect, updateStudent)
router.post('/bulk-import', protect, coordinatorOnly, upload.single('file'), bulkImportStudents)

module.exports = router;