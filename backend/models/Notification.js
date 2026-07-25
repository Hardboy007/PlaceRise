const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "JD_POSTED",
        "STATUS_CHANGED",
        "ANNOUNCEMENT",
        "ATTENDANCE_LIVE",
        "NOC_REQUEST",
        "NOC_STATUS",
        "HR_FEEDBACK",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
