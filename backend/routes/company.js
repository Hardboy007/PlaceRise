const express = require("express");

const {
  getAllCompanies,
  createCompany,
  getAllJobs,
} = require("../controllers/companyController");

const router = express.Router();

router.get("/", getAllCompanies);

router.post("/", createCompany);

router.get("/jobs", getAllJobs);

module.exports = router;
