const express = require("express");
const { uploadPDF } = require('../config/cloudinary')

const {
  getAllCompanies,
  createCompany,
  getAllJobs,
  getJobById,
  deleteCompany,
  uploadJobPDF
} = require("../controllers/companyController");

const router = express.Router();
const { protect, coordinatorOnly } = require('../middleware/auth')

router.get('/', getAllCompanies)  // public — students bhi dekhenge
router.post('/', protect, coordinatorOnly, createCompany)
router.get('/jobs', getAllJobs)   // public
router.get('/jobs/:id', getJobById)
router.delete('/:id', protect, coordinatorOnly, deleteCompany)
router.post('/jobs/:id/upload-pdf', protect, coordinatorOnly, uploadPDF.single('pdf'), uploadJobPDF)

module.exports = router;
