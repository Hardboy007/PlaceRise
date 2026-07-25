const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Company = require("../models/company"); 
const HRFeedback = require("../models/HRFeedback");
const Notification = require("../models/Notification");
const Coordinator = require("../models/Coordinator");

const generateCompanyCode = async (req, res) => {
  try {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
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

const submitFeedback = async (req, res) => {
  try {
    const {
      school,
      course,
      feedbackType,
      studentIdentifier,
      round,
      result,
      ratings,
      overallRating,
      candidatesInterviewed,
      rejectionReasons,
      otherReasonNote,
      oneLineFeedback,
      recurringIssue,
      recommendForFuture,
    } = req.body;

    if (!school || !course || !feedbackType || !round || !oneLineFeedback) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (feedbackType === "Individual") {
      // studentIdentifier optional — HR may not always have the name handy
      if (
        !result ||
        !ratings?.technical ||
        !ratings?.communication ||
        !ratings?.problemSolving
      ) {
        return res.status(400).json({
          message: "Result and all three ratings are required for individual feedback",
        });
      }
    } else if (feedbackType === "Batch") {
      if (!overallRating) {
        return res.status(400).json({
          message: "Overall rating is required for batch feedback",
        });
      }
    } else {
      return res.status(400).json({ message: "Invalid feedback type" });
    }

    const feedback = await HRFeedback.create({
      companyId: req.guestCompanyId,
      school,
      course,
      feedbackType,
      studentIdentifier: studentIdentifier || "",
      round,
      result: feedbackType === "Individual" ? result : undefined,
      ratings: feedbackType === "Individual" ? ratings : undefined,
      overallRating: feedbackType === "Batch" ? overallRating : undefined,
      candidatesInterviewed: candidatesInterviewed || undefined,
      rejectionReasons: rejectionReasons || [],
      otherReasonNote: otherReasonNote || "",
      oneLineFeedback,
      recurringIssue: recurringIssue || "",
      recommendForFuture:
        typeof recommendForFuture === "boolean" ? recommendForFuture : null,
    });

    try {
      const company = await Company.findById(req.guestCompanyId);
      const coordinators = await Coordinator.find({}, "userId");
      const notifDocs = coordinators
        .filter((c) => c.userId)
        .map((c) => ({
          userId: c.userId,
          type: "HR_FEEDBACK",
          title: "New HR feedback received",
          message: `${company?.name || "A recruiter"} shared ${
            feedbackType === "Individual" ? "individual candidate" : "batch"
          } feedback for ${school} · ${course}`,
          link: "/coordinator/hr-feedback",
        }));
      if (notifDocs.length) await Notification.insertMany(notifDocs);
    } catch (notifyErr) {
      console.warn("HR feedback notification failed:", notifyErr.message);
    }

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

const markSeenForCompany = async (req, res) => {
  try {
    await HRFeedback.updateMany(
      { companyId: req.params.companyId, seen: false },
      { seen: true },
    );
    res.json({ message: "Marked as seen" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateCompanyCode,
  verifyCompanyCode,
  submitFeedback,
  getFeedback,
  markSeenForCompany,
};