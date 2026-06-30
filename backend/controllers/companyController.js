const Company = require("../models/company");
const JobPosting = require("../models/JobPosting");
const Application = require("../models/Application");

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

// DELETE COMPANY (cascade: also deletes its jobs + applications on those jobs)
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    // Find all jobs posted by this company
    const jobs = await JobPosting.find({ companyId: company._id }).select(
      "_id",
    );
    const jobIds = jobs.map((j) => j._id);

    // Delete all applications tied to those jobs (if any exist)
    if (jobIds.length > 0) {
      await Application.deleteMany({ jobId: { $in: jobIds } });
    }

    // Delete all jobs posted by this company
    await JobPosting.deleteMany({ companyId: company._id });

    // Finally delete the company itself
    await Company.findByIdAndDelete(company._id);

    res.json({
      message: "Company deleted successfully",
      deletedJobs: jobIds.length,
    });
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

module.exports = {
  getAllCompanies,
  createCompany,
  getAllJobs,
  getJobById,
  deleteCompany,
};
