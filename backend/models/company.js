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
    establishedYear: {
      type: Number,
    },
    employeeCount: {
      type: Number,
    },
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
    lastDate: {
      type: Date,
    },
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
    eligibleBranches: [
      {
        type: String,
      },
    ],
    eligibleCourses: [
      {
        type: String,
      },
    ],
    eligibleSchools: [
      {
        type: String,
      },
    ],
    backlogsAllowed: {
      type: Number,
      default: 0,
    },
    batch: {
      type: String,
      default: "",
    },

    // Coordinator Details
    campusDriveDate: {
      type: Date,
    },
    status: {
      type: String,
      default: "Upcoming",
    },
    domain: {
      type: String,
      default: "",
    },
    spoc: {
      type: String,
      default: "",
    },
    modeOfDrive: {
      type: String,
      default: "",
    },
    hrName: {
      type: String,
      default: "",
    },
    hrEmail: {
      type: String,
      default: "",
    },

    transportExpense: {
      type: Number,
      default: 0,
    },
    hotelExpense: {
      type: Number,
      default: 0,
    },

    dbuuRegistered: {
      type: Number,
      default: 0,
    },
    dbuuParticipated: {
      type: Number,
      default: 0,
    },
    dbuuShortlisted: {
      type: Number,
      default: 0,
    },
    dbuuSelected: {
      type: Number,
      default: 0,
    },

    otherCollegeSelected: {
      type: Number,
      default: 0,
    },

    totalSelections: {
      type: Number,
      default: 0,
    },

    processRemarks: {
      type: String,
      default: "",
    },

    hrFeedback: {
      type: String,
      default: "",
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