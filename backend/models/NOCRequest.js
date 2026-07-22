const mongoose = require("mongoose");

const nocRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    type: { type: String, enum: ["NOC", "LOR"], required: true },
    purpose: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    rejectionReason: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    proofUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("NOCRequest", nocRequestSchema);
