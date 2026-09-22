const JobPosting = require("../models/JobPosting");
const Notification = require("../models/Notification");
const Student = require("../models/Student");
const Company = require("../models/company");
const { sendEmail } = require("../config/email");
const logActivity = require("../utils/logActivity");

// GET /api/jobs
// Returns all active job postings, newest first, with company name populated.
// (Students' dashboard/company-list pages need this — it didn't exist before.)
const getJobs = async (req, res) => {
  try {
    const jobs = await JobPosting.find({ status: "Active" })
      .populate("companyId", "name website")
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/jobs
const createJob = async (req, res) => {
  try {
    const job = await JobPosting.create(req.body);

    setImmediate(async () => {
      try {
        const allStudents = await Student.find().populate("userId", "email");
        const company = await Company.findById(job.companyId);
        const companyName = company?.name || "A Company";
        const lastDate = job.lastDate
          ? new Date(job.lastDate).toLocaleDateString("en-IN")
          : "N/A";

        // Har student ke liye check karo wo KAUNSE specific roleGroups
        // ke liye eligible hai — sirf overall "eligible/not" nahi,
        // balki exact roles jo unko dikhne chahiye
        const studentMatches = [];
        for (const s of allStudents) {
          if (!s.userId) continue;
          const cgpaOk = !job.minCgpa || (s.cgpa ?? 0) >= job.minCgpa;
          const backlogOk = (s.backlogs ?? 0) <= (job.maxBacklogs ?? 99);
          if (!cgpaOk || !backlogOk) continue;

          const matchedRoles = (job.roleGroups || []).filter((rg) => {
            const branches = rg.eligibleBranches || [];
            return (
              !branches.length ||
              branches.includes("All") ||
              branches.includes(s.course) ||
              branches.includes(s.branch)
            );
          });

          if (matchedRoles.length > 0) {
            studentMatches.push({ student: s, matchedRoles });
          }
        }

        const allRoleNames = (job.roleGroups || [])
          .map((rg) => rg.role)
          .join(", ");
        await logActivity(
          req.user?.id,
          `Posted a new job — ${allRoleNames} at ${companyName}`,
          "job",
          job._id,
        );

        // In-app notifications — har student ko sirf uske matched roles dikhein
        const notifs = studentMatches.map(({ student: s, matchedRoles }) => ({
          userId: s.userId._id,
          type: "JD_POSTED",
          title: `New Drive: ${companyName}`,
          message: `${companyName} — ${matchedRoles.map((r) => r.role).join(", ")} | Apply by ${lastDate}`,
          link: `/student/companies`,
          isRead: false,
        }));
        if (notifs.length > 0) {
          await Notification.insertMany(notifs);
        }

        const emailEligible = studentMatches.filter(
          ({ student: s }) =>
            s.notificationPreferences?.emailNotifications !== false &&
            s.notificationPreferences?.jobAlerts === true,
        );

        for (const { student, matchedRoles } of emailEligible) {
          const email = student.userId?.email;
          if (!email) continue;

          const roleLabel = matchedRoles.map((r) => r.role).join(", ");
          const ctcs = matchedRoles.map((r) => r.ctc);
          const ctcLabel =
            ctcs.length > 1
              ? `₹${Math.min(...ctcs)}–${Math.max(...ctcs)} LPA`
              : `₹${ctcs[0]} LPA`;

          await sendEmail({
            to: email,
            subject: `New Placement Drive — ${companyName} | ${roleLabel}`,
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
            <p style="color: #64748B;">A new placement opportunity has been posted on PlaceRise.</p>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p><strong>Company:</strong> ${companyName}</p>
              <p><strong>Role(s) you're eligible for:</strong> ${roleLabel}</p>
              <p><strong>CTC:</strong> ${ctcLabel}</p>
              <p><strong>Location:</strong> ${job.location || "N/A"}</p>
              <p><strong>Last Date:</strong> ${lastDate}</p>
            </div>
            <p style="color: #64748B;">You are eligible for this drive based on your course and CGPA.</p>
            <a href="https://placerise.vercel.app/student/companies" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Apply Now
            </a>
            <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">
              PlaceRise | Dev Bhoomi Uttarakhand University
            </p>
          </div>
        `,
          });
        }
      } catch (bgError) {
        console.error("Notification error:", bgError.message);
      }
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/jobs/:id
const updateJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/jobs/:id
const deleteJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getJobs, createJob, updateJob, deleteJob };
