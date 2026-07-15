const mongoose = require("mongoose");

// Har coordinator ke kaam (job post, select/reject, NOC approve/reject,
// attendance drive, announcement) ki ek entry yahan save hoti hai —
// CoordinatorProfile ke "Recent Activity" section isi se data leta hai.
const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: { type: String, required: true }, // e.g. "Posted a new job — SDE at TCS"
    type: {
      type: String,
      enum: [
        "job",
        "application",
        "noc",
        "attendance",
        "announcement",
        "other",
      ],
      default: "other",
    },
    refId: { type: mongoose.Schema.Types.ObjectId }, // optional link to the source doc
  },
  { timestamps: true },
);

module.exports = mongoose.model("Activity", activitySchema);