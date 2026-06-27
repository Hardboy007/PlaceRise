const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    erpId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "coordinator"],
      default: "student",
    },
    isFirstLogin: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
