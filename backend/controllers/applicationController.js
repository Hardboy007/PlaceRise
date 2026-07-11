const Application = require("../models/Application");
const Student = require("../models/Student");
const JobPosting = require("../models/JobPosting");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("../config/email");

// Student apply kare
const createApplication = async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.id;

    //Student dhundho
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    // Job dhundho aur expiry check karo
    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (new Date(job.lastDate) < new Date()) {
      return res
        .status(400)
        .json({ message: "Application deadline has passed" });
    }
    // Eligibility check
    if (
      job.eligibleBranches &&
      !job.eligibleBranches.includes("All") &&
      job.eligibleBranches.length > 0
    ) {
      const student = await Student.findOne({ userId });
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const isEligible =
        job.eligibleBranches.includes(student.course) ||
        job.eligibleBranches.includes(student.branch);

      if (!isEligible) {
        return res
          .status(403)
          .json({ message: "You are not eligible for this job" });
      }
    }
    // Already applied check karo
    const alreadyApplied = await Application.findOne({
      studentId: student._id,
      jobId,
    });
    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    // 3 selected restriction check
    const selectedCount = await Application.countDocuments({
      studentId: student._id,
      status: "Selected",
    });
    if (selectedCount >= 3) {
      return res
        .status(400)
        .json({ message: "You have been selected in 3 companies already" });
    }

    const application = await Application.create({
      studentId: student._id,
      jobId,
      status: "Applied",
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student apni applications dekhe
const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const applications = await Application.find({
      studentId: student._id,
    }).populate({
      path: "jobId",
      populate: { path: "companyId" },
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Coordinator ek JD ki saari applications dekhe
const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    // FIXED: was .populate("studentId") — a flat populate that only pulls
    // fields living directly on the Student document (name, email, course,
    // cgpa, etc). erpId lives on the User model, so student.userId was
    // coming back as just an ObjectId string, and student.userId.erpId was
    // always undefined on the frontend. Nested populate below resolves
    // studentId -> then resolves studentId.userId -> erpId/email, matching
    // what getAllStudents already does in studentController.js.
    const applications = await Application.find({ jobId }).populate({
      path: "studentId",
      populate: { path: "userId", select: "erpId email" },
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Coordinator status change kare
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Applied", "Shortlisted", "Selected", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const application = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // PlacementStatus update
    if (status === "Selected") {
      await Student.findByIdAndUpdate(application.studentId, {
        placementStatus: "Placed",
      });
    } else {
      const anySelected = await Application.findOne({
        studentId: application.studentId,
        status: "Selected",
        _id: { $ne: id },
      });
      if (!anySelected) {
        await Student.findByIdAndUpdate(application.studentId, {
          placementStatus: "Not Placed",
        });
      }
    }

    // Notification + Email — sirf meaningful statuses pe
    if (["Shortlisted", "Selected", "Rejected"].includes(status)) {
      setImmediate(async () => {
        try {
          const student = await Student.findById(
            application.studentId,
          ).populate("userId", "email");

          if (!student?.userId) return;

          const job = await JobPosting.findById(application.jobId).populate(
            "companyId",
            "name",
          );

          const companyName = job?.companyId?.name || "Company";
          const role = job?.role || "Role";

          const notifTitle =
            status === "Selected"
              ? `🎉 Congratulations! Selected at ${companyName}`
              : status === "Shortlisted"
                ? `✅ Shortlisted at ${companyName}`
                : `❌ Application Update — ${companyName}`;

          const notifMessage = `Your application for ${role} at ${companyName} has been ${status}.`;

          // In-app notification
          await Notification.create({
            userId: student.userId._id,
            type: "STATUS_CHANGED",
            title: notifTitle,
            message: notifMessage,
            link: "/student/applications",
            isRead: false,
          });

          // Email
          const bgColor =
            status === "Selected"
              ? "#F0FDF4"
              : status === "Shortlisted"
                ? "#EFF6FF"
                : "#FEF2F2";
          const textColor =
            status === "Selected"
              ? "#22C55E"
              : status === "Shortlisted"
                ? "#3B82F6"
                : "#EF4444";

          await sendEmail({
            to: student.userId.email,
            subject: `Application Update — ${companyName} | ${role}`,
            html: `
              <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #1E293B;">Hi ${student.name || "Student"},</h2>
                <div style="background: ${bgColor}; border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: ${textColor};">${notifTitle}</h3>
                  <p><strong>Company:</strong> ${companyName}</p>
                  <p><strong>Role:</strong> ${role}</p>
                  <p><strong>Status:</strong> ${status}</p>
                </div>
                <a href="https://placerise.vercel.app/student/applications"
                   style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  View Applications
                </a>
                <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">
                  PlaceRise | Dev Bhoomi Uttarakhand University
                </p>
              </div>
            `,
          });
        } catch (bgError) {
          console.error("Status notification error:", bgError.message);
        }
      });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
};
