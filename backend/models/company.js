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

    hrAccessCode: {
      type: String,
      default: null,
    },
    recruiterContacts: [
      {
        companyName: { type: String, default: "" },
        pocName: { type: String, default: "" },
        managedBy: { type: String, default: "" },
        status: {
          type: String,
          enum: [
            "Not Contacted",
            "Visited",
            "In Talk",
            "Confirmation Required",
          ],
          default: "Not Contacted",
        },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        notes: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.Company || mongoose.model("Company", companySchema);
