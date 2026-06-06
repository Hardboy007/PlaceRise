const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    about: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    establishedYear: Number,
    employeeCount: Number,
    turnover: {
      type: String,
      default: "",
    },

    // Job Description
    role: {
      type: String,
      required: true,
    },
    ctc: {
      type: Number,
      required: true,
    },
    jobType: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    lastDate: Date,
    bond: {
      type: String,
      default: "",
    },
    bonus: {
      type: String,
      default: "",
    },
    registrationLink: {
      type: String,
      default: "",
    },

    // Eligibility
    minCgpa: {
      type: Number,
      default: 0,
    },
    eligibleBranches: [String],
    eligibleCourses: [String],
    eligibleSchools: [String],
    backlogsAllowed: {
      type: Number,
      default: 0,
    },
    batch: {
      type: String,
      default: "",
    },

    // Status
    status: {
      type: String,
      default: "Upcoming",
    },

    // Content
    techStack: [String],
    skills: [String],
    perks: [String],

    selectionProcess: [
      {
        title: String,
        description: String,
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Company", companySchema);