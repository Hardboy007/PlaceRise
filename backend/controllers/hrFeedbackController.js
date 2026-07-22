const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Company = require("../models/company");
const HRFeedback = require("../models/HRFeedback");

// ── Coordinator: generate/regenerate an access code for a company ──
const generateCompanyCode = async (req, res) => {
  try {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "A1B2C3D4"
    const company = await Company.findByIdAndUpdate(
      req.params.companyId,
      { hrAccessCode: code },
      { new: true },
    );
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json({ code: company.hrAccessCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Guest: verify company name + access code, issue short-lived token ──
const verifyCompanyCode = async (req, res) => {
  try {
    const { companyName, accessCode } = req.body;
    if (!companyName || !accessCode) {
      return res
        .status(400)
        .json({ message: "Company name and access code are required" });
    }

    const company = await Company.findOne({
      name: companyName,
      hrAccessCode: accessCode.toUpperCase(),
    });

    if (!company) {
      return res
        .status(401)
        .json({ message: "Invalid company name or access code" });
    }

    const token = jwt.sign(
      { type: "hr-guest", companyId: company._id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({ token, companyName: company.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Guest: submit feedback (requires guestProtect) ──
const submitFeedback = async (req, res) => {
  try {
    const {
      school,
      course,
      round,
      result,
      ratings,
      rejectionReasons,
      otherReasonNote,
      oneLineFeedback,
      recurringIssue,
    } = req.body;

    if (
      !school ||
      !course ||
      !round ||
      !result ||
      !ratings ||
      !oneLineFeedback
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const feedback = await HRFeedback.create({
      companyId: req.guestCompanyId,
      school,
      course,
      round,
      result,
      ratings,
      rejectionReasons: rejectionReasons || [],
      otherReasonNote: otherReasonNote || "",
      oneLineFeedback,
      recurringIssue: recurringIssue || "",
    });

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Coordinator: view all feedback, optionally filtered ──
const getFeedback = async (req, res) => {
  try {
    const { companyId, school, course } = req.query;
    const filter = {};
    if (companyId) filter.companyId = companyId;
    if (school) filter.school = school;
    if (course) filter.course = course;

    const feedback = await HRFeedback.find(filter)
      .populate("companyId", "name")
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateCompanyCode,
  verifyCompanyCode,
  submitFeedback,
  getFeedback,
};
