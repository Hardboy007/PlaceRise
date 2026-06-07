const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Personal
    name:   { type: String },
    email:  { type: String },
    phone:  { type: String },
    dob:    { type: String },
    gender: { type: String },
    city:   { type: String },
    state:  { type: String },

    // Academic
    school:       { type: String },
    course:       { type: String },
    branch:       { type: String },
    batch:        { type: String },
    cgpa:         { type: Number },
    tenthMarks:   { type: Number },
    twelfthMarks: { type: Number },
    backlogs:     { type: Number, default: 0 },

    // Placement
    skills:            [{ type: String }],
    resume:            { type: String },
    placementStatus:   { type: String, enum: ["Not Placed", "Placed"], default: "Not Placed" },
    selectedCompanies: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);