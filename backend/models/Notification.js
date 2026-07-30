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
        // Added for ApplicationsManagementPage coordinator actions —
        // without these, Notification.create() was throwing a validation
        // error (silently swallowed by the caller's try/catch) every time
        // a coordinator bulk-applied a student or removed an application,
        // so those two notification types were never actually being saved.
        "BULK_APPLIED",
        "APPLICATION_REMOVED",
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