const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      required: true,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Applied", "Shortlisted", "Selected", "Rejected"],
      default: "Applied",
    },
    resumeUrl: {
      type: String,
      default: "",
    },
    round: {
      type: Number,
      default: 0,
    },
    // Round-wise status tracking
    roundStatuses: [
      {
        roundIndex: { type: Number, required: true },
        roundName: { type: String, required: true },
        status: {
          type: String,
          enum: ["Pending", "Cleared", "Eliminated"],
          default: "Pending",
        },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    remarks: {
      type: String,
      default: "",
    },
    appliedVia: {
      type: String,
      enum: ["self", "bulk-coordinator"],
      default: "self",
    },
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Application", applicationSchema);