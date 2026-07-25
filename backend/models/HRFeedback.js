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

    // Individual = feedback about one specific candidate.
    // Batch = aggregate feedback about the whole group interviewed that day.
    feedbackType: {
      type: String,
      enum: ["Individual", "Batch"],
      required: true,
    },

    // Free text — the guest HR has no access to the student directory,
    // so they identify the candidate the same way they would on a resume
    // or attendance sheet (name / ERP ID). Only used when Individual.
    studentIdentifier: { type: String, default: "" },

    round: {
      type: String,
      enum: ["Aptitude", "Technical", "Coding", "GD", "HR", "Managerial"],
      required: true,
    },

    // Only meaningful for Individual feedback — a batch doesn't have one outcome.
    result: {
      type: String,
      enum: ["Selected", "Rejected", "On Hold"],
    },

    // Individual: three specific ratings.
    ratings: {
      technical: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      problemSolving: { type: Number, min: 1, max: 5 },
    },

    // Batch: one aggregate quality rating + how many candidates were seen.
    overallRating: { type: Number, min: 1, max: 5 },
    candidatesInterviewed: { type: Number, min: 1 },

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

    // Simple, high-signal field for the placement cell.
    recommendForFuture: { type: Boolean, default: null },

    interviewDate: { type: Date, default: Date.now },

    // Drives the "new feedback" badges on the coordinator side — flipped
    // to true once a coordinator opens that company's feedback list.
    seen: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("HRFeedback", hrFeedbackSchema);
