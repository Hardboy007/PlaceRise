const Company = require("../models/company");
const JobPosting = require("../models/JobPosting");

// GET ALL COMPANIES
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();

    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE COMPANY
const createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);

    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL JOBS
const getAllJobs = async (req, res) => {
  try {
    const jobs = await JobPosting.find().populate("companyId");

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//GET JOB BY ID
const getJobById = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id).populate("companyId");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllCompanies, createCompany, getAllJobs, getJobById };
