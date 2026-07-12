const mongoose = require("mongoose");
const jobPostingSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  role: { type: String, required: true },
  ctc: { type: Number, required: true },
  jobType: { type: String, default: 'Full Time' },
  location: { type: String, default: '' },
  lastDate: { type: Date },
  minCgpa: { type: Number, default: 0 },
  eligibleBranches: [String],
  eligibleCourses: [String],
  eligibleSchools: [String],
  maxBacklogs: { type: Number, default: 0 },
  batch: { type: String, default: '' },
  techStack: [String],
  skills: [String],
  perks: [String],
  selectionProcess: [{
    title: String,
    description: String,
    type: String,
  }],
  bond: { type: String, default: '' },
  bonus: { type: String, default: '' },
  registrationLink: { type: String, default: '' },
  status: { type: String, default: 'Active' },
  jdPdfUrl: { type: String, default: '' },
  resultsFinalized: { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('JobPosting', jobPostingSchema)