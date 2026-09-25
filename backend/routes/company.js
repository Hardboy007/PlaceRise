const express = require("express");
const { uploadPDF } = require("../config/cloudinary");

const {
  getAllCompanies,
  createCompany,
  getAllJobs,
  getJobById,
  deleteCompany,
  updateCompany,
  uploadJobPDF,
} = require("../controllers/companyController");

const router = express.Router();
const {
  protect,
  coordinatorOnly,
  checkCRCHead,
} = require("../middleware/auth");

router.get("/", getAllCompanies); // public — students bhi dekhenge
router.post("/", protect, coordinatorOnly, checkCRCHead, createCompany);
router.get("/jobs", getAllJobs); // public
router.get("/jobs/:id", getJobById);
router.delete("/:id", protect, coordinatorOnly, checkCRCHead, deleteCompany);
router.put("/:id", protect, coordinatorOnly, checkCRCHead, updateCompany);
router.post(
  "/jobs/:id/upload-pdf",
  protect,
  coordinatorOnly,
  checkCRCHead,
  uploadPDF.single("pdf"),
  uploadJobPDF,
);

module.exports = router;
