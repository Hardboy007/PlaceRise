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

    location: {
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
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.Company || mongoose.model("Company", companySchema);
