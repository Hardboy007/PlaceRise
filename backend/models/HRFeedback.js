const mongoose = require("mongoose");

const hrFeedbackSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    school: { type: String, required: true },
    course: { type: String, required: true },
    round: {
      type: String,
      enum: ["Aptitude", "Technical", "Coding", "GD", "HR", "Managerial"],
      required: true,
    },
    result: {
      type: String,
      enum: ["Selected", "Rejected", "On Hold"],
      required: true,
    },
    ratings: {
      technical: { type: Number, min: 1, max: 5, required: true },
      communication: { type: Number, min: 1, max: 5, required: true },
      problemSolving: { type: Number, min: 1, max: 5, required: true },
    },
    rejectionReasons: {
      type: [String],
      enum: [
        "Weak technical/DSA",
        "Poor communication",
        "Lack of confidence",
        "Weak project knowledge",
        "Behavioral fit",
        "Other",
      ],
      default: [],
    },
    otherReasonNote: { type: String, default: "" },
    oneLineFeedback: { type: String, required: true },
    recurringIssue: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("HRFeedback", hrFeedbackSchema);