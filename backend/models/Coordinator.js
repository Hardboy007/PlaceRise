const mongoose = require("mongoose");

const coordinatorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: "",
  },
  designation: {
    type: String,
    default: "",
  },
  department: {
    type: String,
    default: "",
  },
  school: {
    type: String,
    required: true,
  },
  activeSince: {
    type: String,
    default: () => new Date().getFullYear().toString(),
  },
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    newCompanyAlerts: { type: Boolean, default: false },
    weeklyReport: { type: Boolean, default: true },
  },
  role: {
    type: String,
    default: "coordinator",
    enum: ["coordinator"],
    immutable: true,
  },
  subRole: {
    type: String,
    enum: ["crc_head", "placement_coordinator"],
    default: "placement_coordinator",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  signatureUrl: { type: String, default: "" },
  profilePhoto: { type: String, default: "" },

  emailVerified: { type: Boolean, default: false },
  emailOtpHash: { type: String },
  emailOtpExpires: { type: Date },
  emailOtpAttempts: { type: Number, default: 0 },
});

module.exports = mongoose.model("Coordinator", coordinatorSchema);
