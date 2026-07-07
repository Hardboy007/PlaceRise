const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  getAllStudents,
  getStudentById,
  getMyProfile,
  updateStudent,
  onboardStudent,
  updateNotificationPreferences,
  bulkImportStudents,
  exportStudentsExcel,
} = require("../controllers/studentController");
const { protect, coordinatorOnly } = require("../middleware/auth");

// Coordinator only
router.get("/", protect, coordinatorOnly, getAllStudents);
router.get("/export", protect, coordinatorOnly, exportStudentsExcel);
router.post(
  "/bulk-import",
  protect,
  coordinatorOnly,
  upload.single("file"),
  bulkImportStudents,
);
// Student own profile
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateStudent);
router.put("/me/onboard", protect, onboardStudent);
router.put("/me/notifications", protect, updateNotificationPreferences);
// Read only — coordinator only
router.get("/:id", protect, coordinatorOnly, getStudentById);

module.exports = router;
