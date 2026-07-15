const ExcelJS = require("exceljs");
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
      resumeUrl: student.resume || "",
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

    const applications = await Application.find({ jobId }).populate({
      path: "studentId",
      populate: { path: "userId", select: "erpId email" },
    });

    // Har applied student ke liye check karo ki wo kis-kis company me
    // "Selected" hai — sab distinct studentIds nikalo, unki saari
    // Selected applications fetch karo (company naam ke saath), phir
    // studentId -> [company names] ka map bana lo.
    const studentIds = [
      ...new Set(
        applications
          .filter((a) => a.studentId)
          .map((a) => a.studentId._id.toString()),
      ),
    ];

    const selectedApps = await Application.find({
      studentId: { $in: studentIds },
      status: "Selected",
    }).populate({
      path: "jobId",
      populate: { path: "companyId", select: "name" },
    });

    const selectionsMap = {};
    selectedApps.forEach((app) => {
      const sid = app.studentId.toString();
      const companyName = app.jobId?.companyId?.name;
      if (!companyName) return;
      if (!selectionsMap[sid]) selectionsMap[sid] = [];
      selectionsMap[sid].push(companyName);
    });

    // Har application ke studentId object me selectedCount aur
    // selectedCompanies attach karo taaki frontend ko alag call na karni pade
    const enriched = applications.map((app) => {
      const appObj = app.toObject();
      if (appObj.studentId) {
        const sid = appObj.studentId._id.toString();
        const companies = selectionsMap[sid] || [];
        appObj.studentId.selectedCount = companies.length;
        appObj.studentId.selectedCompanies = companies;
      }
      return appObj;
    });

    res.json(enriched);
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

          // In-app notification — hamesha jaati hai, preference se independent
          await Notification.create({
            userId: student.userId._id,
            type: "STATUS_CHANGED",
            title: notifTitle,
            message: notifMessage,
            link: "/student/applications",
            isRead: false,
          });

          // Email — sirf agar emailNotifications master switch ON hai
          // AUR applicationUpdates preference bhi ON hai
          if (
            student.notificationPreferences?.emailNotifications === false ||
            student.notificationPreferences?.applicationUpdates === false
          ) {
            return;
          }

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
                <div style="background: linear-gradient(135deg, #1D4ED8, #3B82F6); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <img 
                    src="https://res.cloudinary.com/saviaykm/image/upload/v1783784651/WhatsApp_Image_2026-07-11_at_18.55.23_krac4c.jpg" 
                    alt="PlaceRise" 
                    style="height: 40px; border-radius: 8px;"
                  />
                  <p style="color: white; font-size: 12px; margin: 8px 0 0 0; opacity: 0.85; font-weight: 600; letter-spacing: 1px;">
                    PLACERISE - Connect . Grow . Succeed
                  </p>
                </div>
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

const exportJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    const applications = await Application.find({ jobId })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "erpId email" },
      })
      .populate({
        path: "jobId",
        populate: { path: "companyId", select: "name" },
      });

    const job = await JobPosting.findById(jobId).populate("companyId", "name");
    const companyName = job?.companyId?.name || "Company";
    const role = job?.role || "Role";

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Applications");

    // Header styling
    const headerRow = sheet.addRow([
      "Name",
      "ERP ID",
      "Email",
      "Course",
      "School",
      "Batch",
      "CGPA",
      "Backlogs",
      "Status",
      "Applied Date",
      "Resume Link",
    ]);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1D4ED8" },
    };
    headerRow.height = 18;

    sheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 30 },
      { width: 25 },
      { width: 30 },
      { width: 10 },
      { width: 8 },
      { width: 10 },
      { width: 14 },
      { width: 15 },
      { width: 50 },
    ];

    applications.forEach((a) => {
      const student = a.studentId;
      const row = sheet.addRow([
        student?.name || "—",
        student?.userId?.erpId || "—",
        student?.email || "—",
        student?.course || "—",
        student?.school || "—",
        student?.batch || "—",
        student?.cgpa || "—",
        student?.backlogs ?? 0,
        a.status,
        a.appliedDate
          ? new Date(a.appliedDate).toLocaleDateString("en-IN")
          : "—",
        a.resumeUrl || "—",
      ]);

      // Resume link clickable banao
      if (a.resumeUrl) {
        row.getCell(11).value = {
          text: "View Resume",
          hyperlink: a.resumeUrl,
        };
        row.getCell(11).font = { color: { argb: "FF3B82F6" }, underline: true };
      }

      // Status color
      const statusColors = {
        Selected: "FF16A34A",
        Shortlisted: "FFF59E0B",
        Rejected: "FFEF4444",
        Applied: "FF3B82F6",
      };
      if (statusColors[a.status]) {
        row.getCell(9).font = {
          color: { argb: statusColors[a.status] },
          bold: true,
        };
      }
    });

    const year = new Date().getFullYear();
    const filename = `${companyName}_${role}_${year}_Applications.xlsx`.replace(
      /\s+/g,
      "_",
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  exportJobApplications,
};
