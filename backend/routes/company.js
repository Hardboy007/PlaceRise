const express = require("express");

const {
  getAllCompanies,
  createCompany,
  getAllJobs,
  getJobById,
  deleteCompany,
} = require("../controllers/companyController");

const router = express.Router();
const { protect, coordinatorOnly } = require('../middleware/auth')

router.get('/', getAllCompanies)  // public — students bhi dekhenge
router.post('/', protect, coordinatorOnly, createCompany)
router.get('/jobs', getAllJobs)   // public
router.get('/jobs/:id', getJobById)
router.delete('/:id', protect, coordinatorOnly, deleteCompany)

module.exports = router;
