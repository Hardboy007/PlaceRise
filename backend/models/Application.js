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

    remarks: {
      type: String,
      default: "",
    },

    // Who actually created this application — student applied themselves,
    // or a coordinator applied on their behalf via Bulk Apply.
    // Without this field, Mongoose (strict mode by default) silently
    // drops the `appliedVia` value the controller sets on create(), so
    // every application looked identical regardless of who applied.
    appliedVia: {
      type: String,
      enum: ["self", "bulk-coordinator"],
      default: "self",
    },

    // Which coordinator (User) triggered a bulk-apply for this
    // application — undefined/null for self-applied ones.
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Application", applicationSchema);
