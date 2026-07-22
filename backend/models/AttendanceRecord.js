const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    mode: { type: String, enum: ["QR", "Manual"], default: "QR" },
    isLate: { type: Boolean, default: false },
    markedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.AttendanceRecord ||
  mongoose.model("AttendanceRecord", attendanceRecordSchema);