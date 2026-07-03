const JobPosting = require("../models/JobPosting");

// GET /api/jobs
// Returns all active job postings, newest first, with company name populated.
// (Students' dashboard/company-list pages need this — it didn't exist before.)
const getJobs = async (req, res) => {
  try {
    const jobs = await JobPosting.find({ status: "Active" })
      .populate("companyId", "name")
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/jobs
const createJob = async (req, res) => {
  try {
    const job = await JobPosting.create(req.body);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/jobs/:id
const updateJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/jobs/:id
const deleteJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getJobs, createJob, updateJob, deleteJob };