const express = require("express");
const router = express.Router();
const { resumeLimiter, uploadLimiter } = require("../middleware/security"); 
const upload = require("../middleware/upload");
const {
  getAllStudents,
  getStudentById,
  getMyProfile,
  updateStudent,
  onboardStudent,
  updateNotificationPreferences,
  uploadProfilePhoto,
  uploadMarksheet,
  addCertification,
  uploadResume,
  generateResume,
  bulkImportStudents,
  exportStudentsExcel,
  saveJob,
  unsaveJob,
  getSavedJobs,
  bulkCgpaUpdate,
  deleteStudent,
  cleanupOrphanedApplications,
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
router.patch("/bulk-cgpa-update", protect, coordinatorOnly, bulkCgpaUpdate);
// Student own profile
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateStudent);
router.put("/me/onboard", protect, onboardStudent);
router.put("/me/notifications", protect, updateNotificationPreferences);
router.post("/me/resume", protect, uploadLimiter, upload.single("file"), uploadResume);
router.post("/me/marksheet", protect, uploadLimiter, upload.single("file"), uploadMarksheet);
router.post(
  "/me/certifications",
  protect,
  upload.single("file"),
  addCertification,
);
router.post(
  "/me/profile-photo",
  protect,
  upload.single("file"),
  uploadProfilePhoto,
);
router.post("/me/generate-resume", protect, resumeLimiter, generateResume);
router.post("/save-job/:jobId", protect, saveJob);
router.delete("/save-job/:jobId", protect, unsaveJob);
router.get("/saved-jobs", protect, getSavedJobs);
// Read only — coordinator only
router.get("/:id", protect, coordinatorOnly, getStudentById);
router.delete("/cleanup-orphaned", protect, coordinatorOnly, cleanupOrphanedApplications);
router.delete("/:id", protect, coordinatorOnly, deleteStudent);

module.exports = router;