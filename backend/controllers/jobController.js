const JobPosting = require('../models/JobPosting')

// POST /api/jobs
const createJob = async (req, res) => {
  try {
    const job = await JobPosting.create(req.body)
    res.status(201).json(job)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PUT /api/jobs/:id
const updateJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!job) return res.status(404).json({ message: 'Job not found' })
    res.json(job)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// DELETE /api/jobs/:id
const deleteJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndDelete(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })
    res.json({ message: 'Job deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { createJob, updateJob, deleteJob }