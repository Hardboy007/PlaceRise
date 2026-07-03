const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Personal
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    dob: { type: String },
    gender: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },

    // Academic
    college: { type: String },
    rollNo: { type: String },
    school: { type: String },
    branch: { type: String },
    course: { type: String },
    batch: { type: String },
    cgpa: { type: Number },
    tenthMarks: { type: Number },
    twelfthMarks: { type: Number },
    backlogs: { type: Number, default: 0 },

    // Placement
    skills: [{ type: String }],
    resume: { type: String },
    placementStatus: {
      type: String,
      enum: ["Not Placed", "Placed"],
      default: "Not Placed",
    },
    selectedCompanies: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "JobPosting" }],
      default: [],
    },

    // Notification preferences
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
      jobAlerts: { type: Boolean, default: false },
      profileViews: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      smsNotifications: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Student", studentSchema);

