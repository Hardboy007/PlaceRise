const cron = require("node-cron");
const Student = require("../models/Student");
const Application = require("../models/Application");
const JobPosting = require("../models/JobPosting");
const { sendEmail } = require("../config/email");

const sendWeeklyDigest = async () => {
  try {
    console.log("Weekly digest sending...");

    const students = await Student.find().populate("userId", "email");

    // Last 7 days ki jobs
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const newJobs = await JobPosting.find({
      createdAt: { $gte: lastWeek },
    }).populate("companyId", "name");

    // Upcoming deadlines — next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingDeadlines = await JobPosting.find({
      lastDate: { $gte: new Date(), $lte: nextWeek },
    }).populate("companyId", "name");

    for (const student of students) {
      const email = student.userId?.email;
      if (!email) continue;
      // Weekly digest preference check
      if (student.notificationPreferences?.weeklyDigest === false) continue;

      // Student ki is hafte ki applications
      const myApplications = await Application.find({
        studentId: student._id,
        createdAt: { $gte: lastWeek },
      }).populate({
        path: "jobId",
        populate: { path: "companyId", select: "name" },
      });

      // Eligible new jobs filter karo
      const eligibleJobs = newJobs.filter((j) => {
        if (!j.eligibleBranches?.length) return true;
        if (j.eligibleBranches.includes("All")) return true;
        return (
          j.eligibleBranches.includes(student.course) ||
          j.eligibleBranches.includes(student.branch)
        );
      });

      await sendEmail({
        to: email,
        subject: `📊 PlaceRise Weekly Digest — ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1D4ED8, #3B82F6); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <img src="https://res.cloudinary.com/saviaykm/image/upload/v1783784651/WhatsApp_Image_2026-07-11_at_18.55.23_krac4c.jpg" 
                alt="PlaceRise" style="height: 40px; border-radius: 8px;" />
              <p style="color: white; font-size: 14px; margin: 8px 0 0 0; font-weight: 600;">
                Weekly Placement Digest
              </p>
            </div>

            <h2 style="color: #1E293B;">Hi ${student.name || "Student"},</h2>
            <p style="color: #64748B;">Here's your weekly placement summary.</p>

            <!-- New Jobs -->
            <div style="background: #EFF6FF; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1D4ED8; margin: 0 0 12px 0;">
                🆕 New Opportunities This Week (${eligibleJobs.length})
              </h3>
              ${
                eligibleJobs.length === 0
                  ? '<p style="color: #64748B; font-size: 14px;">No new drives this week.</p>'
                  : eligibleJobs
                      .map(
                        (j) => `
                  <div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <p style="margin: 0; font-weight: 600; color: #1E293B;">${j.companyId?.name || "—"} — ${j.role}</p>
                    <p style="margin: 4px 0 0 0; color: #64748B; font-size: 13px;">₹${j.ctc} LPA · Last Date: ${new Date(j.lastDate).toLocaleDateString("en-IN")}</p>
                  </div>
                `,
                      )
                      .join("")
              }
            </div>

            <!-- Upcoming Deadlines -->
            ${
              upcomingDeadlines.length > 0
                ? `
            <div style="background: #FEF2F2; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #DC2626; margin: 0 0 12px 0;">
                ⏰ Deadlines This Week (${upcomingDeadlines.length})
              </h3>
              ${upcomingDeadlines
                .map(
                  (j) => `
                <div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                  <p style="margin: 0; font-weight: 600; color: #1E293B;">${j.companyId?.name || "—"} — ${j.role}</p>
                  <p style="margin: 4px 0 0 0; color: #DC2626; font-size: 13px; font-weight: 600;">
                    Last Date: ${new Date(j.lastDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }

            <!-- My Applications -->
            ${
              myApplications.length > 0
                ? `
            <div style="background: #F0FDF4; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #16A34A; margin: 0 0 12px 0;">
                📋 Your Applications This Week (${myApplications.length})
              </h3>
              ${myApplications
                .map(
                  (a) => `
                <div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                  <p style="margin: 0; font-weight: 600; color: #1E293B;">${a.jobId?.companyId?.name || "—"} — ${a.jobId?.role || "—"}</p>
                  <p style="margin: 4px 0 0 0; color: #64748B; font-size: 13px;">Status: <strong>${a.status}</strong></p>
                </div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }

            <a href="https://placerise.vercel.app/student/dashboard" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
              View Dashboard
            </a>

            <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">
              PlaceRise | Dev Bhoomi Uttarakhand University<br/>
              You're receiving this because you have Weekly Digest enabled.
            </p>
          </div>
        `,
      });
    }

    console.log(`Weekly digest sent to ${students.length} students`);
  } catch (error) {
    console.error("Weekly digest error:", error.message);
  }
};

// Har Sunday raat 8 PM pe chalega
const scheduleWeeklyDigest = () => {
  cron.schedule("0 20 * * 0", sendWeeklyDigest, {
    timezone: "Asia/Kolkata",
  });
  console.log("Weekly digest scheduled — every Sunday 8 PM IST");
};

module.exports = { scheduleWeeklyDigest, sendWeeklyDigest };
