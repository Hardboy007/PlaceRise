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
    markedAt: { type: Date, default: Date.now },
    mode: { type: String, enum: ["QR", "Manual"], default: "QR" },
    isLate: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Ek student ek session mein sirf ek baar mark ho sakta hai
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);
