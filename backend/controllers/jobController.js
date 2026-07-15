const JobPosting = require("../models/JobPosting");
const Notification = require("../models/Notification");
const Student = require("../models/Student");
const Company = require("../models/company");
const { sendEmail } = require("../config/email");

// GET /api/jobs
// Returns all active job postings, newest first, with company name populated.
// (Students' dashboard/company-list pages need this — it didn't exist before.)
const getJobs = async (req, res) => {
  try {
    const jobs = await JobPosting.find({ status: "Active" })
      .populate("companyId", "name")
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

    // Background mein notifications bhejo — response block mat karo
    setImmediate(async () => {
      try {
        const allStudents = await Student.find().populate("userId", "email");

        const eligibleStudents = allStudents.filter((s) => {
          if (!s.userId) return false;
          const branchOk =
            !job.eligibleBranches?.length ||
            job.eligibleBranches.includes("All") ||
            job.eligibleBranches.includes(s.course) ||
            job.eligibleBranches.includes(s.branch);
          const cgpaOk = !job.minCgpa || (s.cgpa ?? 0) >= job.minCgpa;
          const backlogOk = (s.backlogs ?? 0) <= (job.maxBacklogs ?? 99);
          return branchOk && cgpaOk && backlogOk;
        });

        const company = await Company.findById(job.companyId);
        const companyName = company?.name || "A Company";
        const lastDate = job.lastDate
          ? new Date(job.lastDate).toLocaleDateString("en-IN")
          : "N/A";

        // In-app notifications — sabko jaati hain, preference se independent
        const notifs = eligibleStudents.map((s) => ({
          userId: s.userId._id,
          type: "JD_POSTED",
          title: `New Drive: ${companyName}`,
          message: `${companyName} — ${job.role} | Apply by ${lastDate}`,
          link: `/student/companies`,
          isRead: false,
        }));
        if (notifs.length > 0) {
          await Notification.insertMany(notifs);
        }

        // Gmail notifications — sirf unko jinka emailNotifications master
        // switch ON hai AUR jobAlerts preference bhi ON hai
        const emailEligibleStudents = eligibleStudents.filter(
          (s) =>
            s.notificationPreferences?.emailNotifications !== false &&
            s.notificationPreferences?.jobAlerts === true,
        );

        for (const student of emailEligibleStudents) {
          const email = student.userId?.email;
          if (!email) continue;
          await sendEmail({
            to: email,
            subject: `New Placement Drive — ${companyName} | ${job.role}`,
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
                  <p><strong>Role:</strong> ${job.role}</p>
                  <p><strong>CTC:</strong> ₹${job.ctc} LPA</p>
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
