const mongoose = require("mongoose");

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  issuingOrganization: { type: String, required: true, trim: true },
  issueMonth: { type: Number, min: 1, max: 12 },
  issueYear: { type: Number },
  expMonth: { type: Number, min: 1, max: 12 },
  expYear: { type: Number },
  credentialId: { type: String, default: "", maxlength: 80 },
  credentialUrl: { type: String, default: "" },
  skills: [{ type: String }],
  fileUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

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
    about: { type: String },
    linkedinUrl: { type: String },
    // Parent contact — used for email notifications about applications
    parentEmail: { type: String, default: "" },
    parentPhone: { type: String, default: "" },
    parentName: { type: String, default: "" },

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
    // Marksheet files (Cloudinary URLs). Uploaded once during onboarding,
    // profile page pe sirf view hota hai.
    tenthMarksheet: { type: String, default: "" },
    twelfthMarksheet: { type: String, default: "" },
    backlogs: { type: Number, default: 0 },
    resumeData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Tracks how the current resume file got here — "onboarding" (uploaded
    // during the onboarding wizard) or "manual" (uploaded from the profile
    // page). Used by the profile page to decide which resume actions
    // (Replace / Build with AI / Edit) to show.
    resumeSource: {
      type: String,
      enum: ["onboarding", "manual", null],
      default: null,
    },
    profilePhoto: { type: String, default: null },

    // Placement
    skills: [{ type: String }],
    certifications: { type: [certificationSchema], default: [] },
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
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "JobPosting" }],

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

// Indexes for faster queries
studentSchema.index({ userId: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ branch: 1 });
studentSchema.index({ batch: 1, branch: 1 });
studentSchema.index({ email: 1 });

module.exports = mongoose.model("Student", studentSchema);
