const mongoose = require("mongoose");

const roleGroupSchema = new mongoose.Schema(
  {
    eligibleBranches: [String],
    role: { type: String, required: true },
    ctc: { type: Number, required: true },
    skills: [String],
    selectionProcess: [String],
  },
  { _id: true }, // _id rehne do — edit ke time RoleGroupBox isko key/identify ke liye use karega
);

const jobPostingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    jobType: { type: String, default: "Full Time" },
    location: { type: String, default: "" },
    lastDate: { type: Date },
    lastTime: { type: String, default: "" }, // NEW
    minCgpa: { type: Number, default: 0 },
    minTenthPercentage: { type: Number, default: 0 },
    minTwelfthPercentage: { type: Number, default: 0 },
    maxBacklogs: { type: Number, default: 0 },
    batch: { type: String, default: "" },
    bondDetails: { type: String, default: "" },
registrationLink: { type: String, default: "" },
    perks: [String],
    roleGroups: {
      type: [roleGroupSchema],
      validate: (v) => Array.isArray(v) && v.length > 0, // kam se kam 1 role group zaroori
    },
    bond: { type: String, default: "" },
    bonus: { type: String, default: "" },
    registrationLink: { type: String, default: "" },
    status: { type: String, default: "Active" },
    jdPdfUrl: { type: String, default: "" },
    resultsFinalized: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("JobPosting", jobPostingSchema);