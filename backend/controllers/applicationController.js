const ExcelJS = require("exceljs");
const Application = require("../models/Application");
const Student = require("../models/Student");
const JobPosting = require("../models/JobPosting");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("../config/email");
const logActivity = require("../utils/logActivity");

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

    const deadline = new Date(job.lastDate);
    deadline.setHours(23, 59, 59, 999);

    if (deadline < new Date()) {
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
      const isEligible =
        job.eligibleBranches.includes(student.course) ||
        job.eligibleBranches.includes(student.branch);

      if (!isEligible) {
        return res
          .status(403)
          .json({ message: "You are not eligible for this job" });
      }
    }
    // CGPA check
    if (job.minCgpa && job.minCgpa > 0) {
      if ((student.cgpa ?? 0) < job.minCgpa) {
        return res
          .status(403)
          .json({ message: `Minimum CGPA required: ${job.minCgpa}` });
      }
    }

    // 10th percentage check — sirf tab jab company ne criteria set ki ho
    if (job.minTenthPercentage && job.minTenthPercentage > 0) {
      if ((student.tenthMarks ?? 0) < job.minTenthPercentage) {
        return res.status(403).json({
          message: `Minimum 10th percentage required: ${job.minTenthPercentage}%`,
        });
      }
    }

    // 12th percentage check — sirf tab jab company ne criteria set ki ho
    if (job.minTwelfthPercentage && job.minTwelfthPercentage > 0) {
      if ((student.twelfthMarks ?? 0) < job.minTwelfthPercentage) {
        return res.status(403).json({
          message: `Minimum 12th percentage required: ${job.minTwelfthPercentage}%`,
        });
      }
    }

    // Backlogs check
    if ((student.backlogs ?? 0) > (job.maxBacklogs ?? 99)) {
      return res
        .status(403)
        .json({ message: `Maximum ${job.maxBacklogs} backlog(s) allowed` });
    }
    // Already applied check karo
    const alreadyApplied = await Application.findOne({
      studentId: student._id,
      jobId,
    });
    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    // 3 selected restriction check — sirf student ke apne self-apply flow
    // pe lagu hota hai. Coordinator ke bulk-apply override me isko
    // jaanbujh kar skip kiya gaya hai (coordinator ka manual call hai).

    //issa 3 sa jyada comapny mai apply krna sa rok rha tha students ko .
    // const selectedCount = await Application.countDocuments({

    //   studentId: student._id,
    //   status: "Selected",
    // });
    // if (selectedCount >= 3) {
    //   return res
    //     .status(400)
    //     .json({ message: "You have been selected in 3 companies already" });
    // }

    const application = await Application.create({
      studentId: student._id,
      jobId,
      status: "Applied",
      resumeUrl: student.resume || "",
      appliedVia: "self",
    });
    // Parent notification — fires after response, non-blocking
    setImmediate(async () => {
      try {
        const populatedStudent = await Student.findById(student._id).populate(
          "userId",
          "email",
        );
        if (!populatedStudent?.parentEmail) return;

        const company = await JobPosting.findById(jobId).populate(
          "companyId",
          "name",
        );
        const companyName = company?.companyId?.name || "Company";
        const role = company?.role || "Role";
        const ctc = company?.ctc ? `₹${company.ctc} LPA` : "Not disclosed";
        const lastDate = company?.lastDate
          ? new Date(company.lastDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          : "—";

        await sendEmail({
          to: populatedStudent.parentEmail,
          subject: `PlaceRise — ${populatedStudent.name} has applied to ${companyName}`,
          html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #1D4ED8, #3B82F6); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <img
              src="https://res.cloudinary.com/saviaykm/image/upload/v1783784651/WhatsApp_Image_2026-07-11_at_18.55.23_krac4c.jpg"
              alt="PlaceRise"
              style="height: 40px; border-radius: 8px;"
            />
            <p style="color: white; font-size: 12px; margin: 8px 0 0 0; opacity: 0.85; font-weight: 600; letter-spacing: 1px;">
              PLACERISE — Connect. Grow. Succeed.
            </p>
          </div>

          <h2 style="color: #1E293B; margin-bottom: 4px;">Dear Parent / Guardian,</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            We wanted to let you know that <strong>${populatedStudent.name}</strong> has submitted a placement application through PlaceRise.
          </p>

          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #1D4ED8; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Application Details</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1E293B;">
              <tr><td style="padding: 6px 0; color: #64748B; width: 40%;">Company</td><td style="padding: 6px 0; font-weight: 600;">${companyName}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748B;">Role</td><td style="padding: 6px 0; font-weight: 600;">${role}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748B;">Package</td><td style="padding: 6px 0; font-weight: 600;">${ctc}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748B;">Application Deadline</td><td style="padding: 6px 0; font-weight: 600;">${lastDate}</td></tr>
            </table>
          </div>

          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            You will receive further updates as the selection process progresses. Shortlisting and interview outcomes will be communicated through this email.
          </p>

          <p style="color: #94A3B8; font-size: 12px; margin-top: 32px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
            This is an automated notification from PlaceRise · Dev Bhoomi Uttarakhand University Placement Portal.<br/>
            Please do not reply to this email.
          </p>
        </div>
      `,
        });
      } catch (err) {
        console.error("Parent apply email error:", err.message);
      }
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

    // Notification + Email + Activity log — sirf meaningful statuses pe
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

          // Activity log — coordinator ke "Recent Activity" feed ke liye
          await logActivity(
            req.user?.id,
            `${status} ${student.name || "a student"} for ${role} at ${companyName}`,
            "application",
            application._id,
          );

          // In-app notification — hamesha jaati hai, preference se independent
          await Notification.create({
            userId: student.userId._id,
            type: "STATUS_CHANGED",
            title: notifTitle,
            message: notifMessage,
            link: "/student/applications",
            isRead: false,
          });

          // ---- Parent email — student ke email preference se INDEPENDENT ----
          // Isliye ye emailNotifications/applicationUpdates check se pehle hai,
          // aur try block ke andar hai taaki 'student', 'companyName', 'role' scope me rahe
          if (student.parentEmail) {
            const isSelected = status === "Selected";
            const isShortlisted = status === "Shortlisted";

            const parentSubject = isSelected
              ? `PlaceRise — Great News! ${student.name} has been Selected at ${companyName}`
              : isShortlisted
                ? `PlaceRise — ${student.name} has been Shortlisted at ${companyName}`
                : `PlaceRise — Application Update for ${student.name} — ${companyName}`;

            const statusBg = isSelected
              ? "#F0FDF4"
              : isShortlisted
                ? "#EFF6FF"
                : "#FEF2F2";
            const statusBorder = isSelected
              ? "#BBF7D0"
              : isShortlisted
                ? "#BFDBFE"
                : "#FECACA";
            const statusColor = isSelected
              ? "#15803D"
              : isShortlisted
                ? "#1D4ED8"
                : "#DC2626";
            const statusLabel = isSelected
              ? "#16A34A"
              : isShortlisted
                ? "#2563EB"
                : "#EF4444";

            const parentIntro = isSelected
              ? `We are delighted to inform you that <strong>${student.name}</strong> has been <strong>selected</strong> by <strong>${companyName}</strong> for the role of <strong>${role}</strong>. This is a significant milestone, and the placement team congratulates your ward on this achievement.`
              : isShortlisted
                ? `We are pleased to inform you that <strong>${student.name}</strong> has been <strong>shortlisted</strong> by <strong>${companyName}</strong> for the role of <strong>${role}</strong>. The next rounds of the selection process are underway.`
                : `We would like to inform you that <strong>${student.name}'s</strong> application for <strong>${role}</strong> at <strong>${companyName}</strong> has not progressed further at this stage. We encourage your ward to continue applying to other opportunities available on PlaceRise.`;

            try {
              await sendEmail({
                to: student.parentEmail,
                subject: parentSubject,
                html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1D4ED8, #3B82F6); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <img
            src="https://res.cloudinary.com/saviaykm/image/upload/v1783784651/WhatsApp_Image_2026-07-11_at_18.55.23_krac4c.jpg"
            alt="PlaceRise"
            style="height: 40px; border-radius: 8px;"
          />
          <p style="color: white; font-size: 12px; margin: 8px 0 0 0; opacity: 0.85; font-weight: 600; letter-spacing: 1px;">
            PLACERISE — Connect. Grow. Succeed.
          </p>
        </div>

        <h2 style="color: #1E293B; margin-bottom: 4px;">Dear Parent / Guardian,</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">${parentIntro}</p>

        <div style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="color: ${statusColor}; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Application Status</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1E293B;">
            <tr><td style="padding: 6px 0; color: #64748B; width: 40%;">Student</td><td style="padding: 6px 0; font-weight: 600;">${student.name}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748B;">Company</td><td style="padding: 6px 0; font-weight: 600;">${companyName}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748B;">Role</td><td style="padding: 6px 0; font-weight: 600;">${role}</td></tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Current Status</td>
              <td style="padding: 6px 0;">
                <span style="background: ${statusBg}; color: ${statusLabel}; font-weight: 700; padding: 2px 10px; border-radius: 999px; font-size: 12px; border: 1px solid ${statusBorder};">
                  ${status}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          For a complete view of all applications and their current status, please visit the PlaceRise portal.
        </p>

        <p style="color: #94A3B8; font-size: 12px; margin-top: 32px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
          This is an automated notification from PlaceRise · Dev Bhoomi Uttarakhand University Placement Portal.<br/>
          Please do not reply to this email.
        </p>
      </div>
    `,
              });
            } catch (parentEmailError) {
              // Parent email fail hone se student email na ruke, isliye alag catch
              console.error("Parent email error:", parentEmailError.message);
            }
          }
          // ---- End parent email block ----

          // Email — sirf agar emailNotifications master switch ON hai
          // AUR applicationUpdates preference bhi ON hai
          if (
            student.notificationPreferences?.emailNotifications === false ||
            student.notificationPreferences?.applicationUpdates === false
          ) {
            return;
          }

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

// Coordinator ek application permanently hata de — jaise koi student
// galti se apply kar deta hai. Ye status ko "Rejected" karne se ALAG hai:
// yaha Application doc hi database se poori tarah delete ho jaata hai.
//
// Guardrails:
//  1. Results-finalized drive pe delete allowed nahi.
//  2. Agar deleted application "Selected" thi, student ka placementStatus
//     turant recompute hota hai.
//  3. Student ko notify kiya jaata hai ki unki application coordinator ne
//     remove ki hai.
const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id).populate({
      path: "studentId",
      populate: { path: "userId", select: "email" },
    });
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await JobPosting.findById(application.jobId).populate(
      "companyId",
      "name",
    );

    if (job?.resultsFinalized) {
      return res.status(400).json({
        message:
          "Results for this drive are finalized — reopen results before removing an application.",
      });
    }

    const wasSelected = application.status === "Selected";
    const studentId = application.studentId?._id || application.studentId;

    await Application.findByIdAndDelete(id);

    // Recompute placementStatus if we just deleted the student's
    // "Selected" application for this drive.
    if (wasSelected && studentId) {
      const stillSelected = await Application.findOne({
        studentId,
        status: "Selected",
      });
      if (!stillSelected) {
        await Student.findByIdAndUpdate(studentId, {
          placementStatus: "Not Placed",
        });
      }
    }

    await logActivity(
      req.user?.id,
      `Removed application for ${application.studentId?.name || "a student"} — ${job?.role || "Role"} at ${job?.companyId?.name || "Company"}`,
      "application",
      id,
    );

    // Transparency notification — fire-and-forget, doesn't block the response.
    setImmediate(async () => {
      try {
        if (!application.studentId?.userId) return;
        const companyName = job?.companyId?.name || "Company";
        const role = job?.role || "Role";

        await Notification.create({
          userId: application.studentId.userId._id,
          type: "APPLICATION_REMOVED",
          title: `Application removed — ${companyName}`,
          message: `Your application for ${role} at ${companyName} has been removed by your placement coordinator.`,
          link: "/student/applications",
          isRead: false,
        });
      } catch (bgError) {
        console.error("Withdraw notification error:", bgError.message);
      }
    });

    res.json({ message: "Application removed successfully" });
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

// Coordinator bulk-apply — eligible students jinhone apply nahi kiya
// unka ek saath "Applied" create karna.
//
// Rules:
//  1. Manually-blocked students (student.placementBlocked === true) are
//     NEVER auto-applied.
//  2. Students missing a resume are skipped (reported back to coordinator).
//  3. Requires a `studentIds` array (the coordinator's checkbox
//     selection). An ARRAY IS ALWAYS RESPECTED AS-IS — including an empty
//     one — so an empty selection means "apply to nobody", never
//     "fall back to everyone eligible". This is a deliberate guardrail:
//     previously, an empty `studentIds` array silently fell back to
//     "every eligible student", so any bug/race on the frontend that sent
//     `[]` (e.g. a reset selection) would auto-apply the entire eligible
//     pool instead of doing nothing. Only a genuinely MISSING studentIds
//     key (old API callers / Postman, no key sent at all) falls back to
//     "every eligible student" for backward compatibility.
//  4. Every created application is tagged with `appliedVia` + `appliedBy`
//     for audit/traceability.
//  5. Each bulk-applied student gets a notification + email.
//  6. Does NOT enforce the "max 3 Selected companies" self-apply cap —
//     coordinator override, on purpose.
//  7. Bulk apply is only allowed on the job's `lastDate` itself
//     (the same date students' own apply deadline falls on). Before that
//     day it's blocked ("not open yet"); after that day it's permanently
//     frozen for whoever hasn't applied — same as the student-facing
//     deadline, so there's exactly one cutoff date for everyone.
const bulkApply = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { studentIds } = req.body; // coordinator's checkbox selection

    const job = await JobPosting.findById(jobId).populate("companyId", "name");
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // --- Bulk apply is only open on the drive's last date ---
    if (!job.lastDate) {
      return res.status(400).json({
        message:
          "This drive has no application deadline set, so bulk apply is unavailable.",
      });
    }
    // IMPORTANT: compare calendar days in IST (Asia/Kolkata), not the
    // server's local timezone. Most hosts (Render/Railway/Vercel etc.)
    // run in UTC, so the old getFullYear/getMonth/getDate comparison
    // could flip "today" to the wrong day for hours around midnight IST
    // — which is exactly why the window wasn't opening/closing at the
    // right time. en-CA locale gives a YYYY-MM-DD string that's safe to
    // compare directly.
    const toISTDateString = (date) =>
      date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    const lastDateObj = new Date(job.lastDate);
    const now = new Date();
    const lastDayStr = toISTDateString(lastDateObj);
    const todayStr = toISTDateString(now);
    const isSameDay = todayStr === lastDayStr;

    if (!isSameDay) {
      const isBefore = todayStr < lastDayStr;
      return res.status(400).json({
        message: isBefore
          ? `Bulk apply only opens on the application deadline (${lastDateObj.toLocaleDateString("en-IN")}) — not yet.`
          : `Bulk apply window has closed — the deadline (${lastDateObj.toLocaleDateString("en-IN")}) has passed.`,
      });
    }

    // If the coordinator explicitly sent a selection (even an empty one),
    // that selection is authoritative — an empty array means "nobody",
    // NOT "everybody eligible". We only treat studentIds as "not provided"
    // when the key itself is missing/undefined (old callers).
    const studentIdsProvided = Array.isArray(studentIds);
    if (studentIdsProvided && studentIds.length === 0) {
      return res.status(200).json({
        message: "No students were selected, so no applications were created.",
        created: 0,
        skippedNoResume: 0,
        skippedNoResumeNames: [],
      });
    }

    // Saare students lao (with email for notifications)
    const allStudents = await Student.find().populate("userId", "email erpId");

    // Eligibility filter — same logic as createApplication, plus the
    // manual block check.
    const eligible = allStudents.filter((s) => {
      // Coordinator's manual "don't auto-apply this student" override.
      if (s.placementBlocked) return false;

      if (
        job.eligibleBranches &&
        !job.eligibleBranches.includes("All") &&
        job.eligibleBranches.length > 0
      ) {
        const isEligible =
          job.eligibleBranches.includes(s.course) ||
          job.eligibleBranches.includes(s.branch);
        if (!isEligible) return false;
      }
      if (job.minCgpa && job.minCgpa > 0) {
        if ((s.cgpa ?? 0) < job.minCgpa) return false;
      }
      if (job.minTenthPercentage && job.minTenthPercentage > 0) {
        if ((s.tenthMarks ?? 0) < job.minTenthPercentage) return false;
      }
      if (job.minTwelfthPercentage && job.minTwelfthPercentage > 0) {
        if ((s.twelfthMarks ?? 0) < job.minTwelfthPercentage) return false;
      }
      if ((s.backlogs ?? 0) > (job.maxBacklogs ?? 0)) return false;
      return true;
    });

    // If the coordinator selected specific students via checkboxes,
    // narrow down to only those (this is now the ONLY path when
    // studentIds was provided at all — see guardrail above). Falls back
    // to "every eligible student" only when the key was never sent.
    const eligiblePool = studentIdsProvided
      ? eligible.filter((s) => studentIds.includes(s._id.toString()))
      : eligible;

    const eligibleIds = eligiblePool.map((s) => s._id);

    // Jo already apply kar chuke hain unhe nikalo
    const existingApps = await Application.find({
      jobId,
      studentId: { $in: eligibleIds },
    }).select("studentId");
    const alreadyAppliedSet = new Set(
      existingApps.map((a) => a.studentId.toString()),
    );

    const notYetApplied = eligiblePool.filter((s) => {
      const sid = s._id.toString();
      return !alreadyAppliedSet.has(sid);
    });

    // Resume-missing students are skipped rather than silently applied
    // with a blank resume link.
    const toBulkApply = notYetApplied.filter((s) => !!s.resume);
    const skippedNoResume = notYetApplied.filter((s) => !s.resume);

    if (toBulkApply.length === 0) {
      return res.status(200).json({
        message:
          skippedNoResume.length > 0
            ? `No applications created — ${skippedNoResume.length} student(s) skipped due to missing resume`
            : "All eligible students have already applied",
        created: 0,
        skippedNoResume: skippedNoResume.length,
        skippedNoResumeNames: skippedNoResume.map((s) => s.name),
      });
    }

    // Bulk insert
    const docs = toBulkApply.map((s) => ({
      studentId: s._id,
      jobId,
      status: "Applied",
      resumeUrl: s.resume || "",
      appliedVia: "bulk-coordinator",
      appliedBy: req.user?.id,
    }));
    const created = await Application.insertMany(docs);

    // Activity log
    await logActivity(
      req.user?.id,
      `Bulk applied ${created.length} students for ${job.role} at ${job.companyId?.name || "Company"}`,
      "application",
    );

    // Notify each bulk-applied student — they didn't apply themselves,
    // so transparency matters. Fire-and-forget, doesn't block the response.
    setImmediate(async () => {
      const companyName = job.companyId?.name || "Company";
      for (const student of toBulkApply) {
        try {
          if (!student.userId) continue;

          await Notification.create({
            userId: student.userId._id,
            type: "BULK_APPLIED",
            title: `📋 Auto-applied to ${companyName}`,
            message: `Your placement coordinator applied on your behalf for ${job.role} at ${companyName} as the deadline was approaching.`,
            link: "/student/applications",
            isRead: false,
          });

          if (
            student.notificationPreferences?.emailNotifications === false ||
            student.notificationPreferences?.applicationUpdates === false
          ) {
            continue;
          }

          await sendEmail({
            to: student.userId.email,
            subject: `You've been applied — ${companyName} | ${job.role}`,
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
                <div style="background: #EFF6FF; border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #3B82F6;">You've been applied to ${companyName}</h3>
                  <p><strong>Role:</strong> ${job.role}</p>
                  <p>Your placement coordinator submitted this application on your behalf as the deadline was approaching. If you'd like to withdraw, please contact your coordinator.</p>
                </div>
                <a href="https://placerise.vercel.app/student/applications"
                   style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  View Application
                </a>
                <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">
                  PlaceRise | Dev Bhoomi Uttarakhand University
                </p>
              </div>
            `,
          });
        } catch (err) {
          console.error("Bulk apply notification error:", err.message);
        }
      }
    });

    res.status(201).json({
      message: `${created.length} student(s) applied successfully${
        skippedNoResume.length > 0
          ? `, ${skippedNoResume.length} skipped (no resume)`
          : ""
      }`,
      created: created.length,
      skippedNoResume: skippedNoResume.length,
      skippedNoResumeNames: skippedNoResume.map((s) => s.name),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  exportJobApplications,
  bulkApply,
};
