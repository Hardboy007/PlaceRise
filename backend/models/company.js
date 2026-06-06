const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },

    about: {
      type: String,
      default: "",
    },

    industry: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    establishedYear: {
      type: Number,
    },

    status: {
      type: String,
      default: "Upcoming",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Company", companySchema);