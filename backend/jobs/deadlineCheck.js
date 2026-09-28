const cron = require("node-cron");
const Student = require("../models/Student");
const JobPosting = require("../models/JobPosting");
const Application = require("../models/Application");
const { sendEmail } = require("../config/email");
const { sendWhatsAppAPI } = require("../utils/whatsapp");

async function runDeadlineCheck() {
  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    // Jobs expiring today
    const expiringJobs = await JobPosting.find({
      lastDate: { $gte: startOfDay, $lte: endOfDay },
    }).populate("companyId", "name");

    if (!expiringJobs.length) {
      console.log("[DeadlineCheck] No expiring jobs today.");
      return;
    }

    for (const job of expiringJobs) {
      const companyName = job.companyId?.name || "Company";
      const role = job.role || "Role";

      // Build eligibility filter
      const studentFilter = {
        $or: [
          { email: { $exists: true, $ne: "" } },
          { parentEmail: { $exists: true, $ne: "" } },
        ],
      };

      if (
        job.eligibleBranches?.length &&
        !job.eligibleBranches.includes("All")
      ) {
        studentFilter.$or = [
          { course: { $in: job.eligibleBranches } },
          { branch: { $in: job.eligibleBranches } },
        ];
      }

      const eligibleStudents = await Student.find(studentFilter);

      for (const student of eligibleStudents) {
        // Skip if already applied
        const applied = await Application.findOne({
          studentId: student._id,
          jobId: job._id,
        });
        if (applied) continue;

        const emailTargets = [];
        if (student.parentEmail) emailTargets.push(student.parentEmail);
        if (student.email) emailTargets.push(student.email);

        for (const emailTo of emailTargets) {
          try {
            await sendEmail({
              to: emailTo,
              subject: `PlaceRise — Placement Opportunity Closing Today for ${student.name}`,
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
            This is a courtesy notification from PlaceRise. A placement opportunity that <strong>${student.name}</strong> is eligible for is closing <strong>today</strong>, and an application has not yet been submitted.
          </p>

          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="color: #DC2626; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Closing Today</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1E293B;">
              <tr><td style="padding: 6px 0; color: #64748B; width: 40%;">Company</td><td style="padding: 6px 0; font-weight: 600;">${companyName}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748B;">Role</td><td style="padding: 6px 0; font-weight: 600;">${role}</td></tr>
              <tr><td style="padding: 6px 0; color: #64748B;">Deadline</td><td style="padding: 6px 0; font-weight: 600; color: #DC2626;">Today</td></tr>
              <tr><td style="padding: 6px 0; color: #64748B;">Student</td><td style="padding: 6px 0; font-weight: 600;">${student.name}</td></tr>
            </table>
          </div>

          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            We encourage you to remind <strong>${student.name}</strong> to log in to PlaceRise and submit their application before the deadline closes.
          </p>

          <a href="https://placerise.vercel.app"
             style="display: inline-block; background: #3B82F6; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px;">
            Open PlaceRise
          </a>

          <p style="color: #94A3B8; font-size: 12px; margin-top: 32px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
            This is an automated notification from PlaceRise · Dev Bhoomi Uttarakhand University Placement Portal.<br/>
            Please do not reply to this email.
          </p>
        </div>
      `,
            });
            console.log(
              `[DeadlineCheck] Email sent: ${emailTo} — ${companyName}`,
            );
          } catch (emailErr) {
            console.error(
              `[DeadlineCheck] Email failed for ${emailTo}:`,
              emailErr.message,
            );
          }
        }
        // WhatsApp reminder
        if (student.phone) {
          const whatsappMessage = `🎯 Placement Reminder!\n\nHi ${student.name},\n\n${companyName} mein ${role} ke liye apply karne ki last date aaj hai.\n\nAbhi apply karo: https://placerise.vercel.app`;
          await sendWhatsAppAPI(student.phone, whatsappMessage);
        }
      }
    }
    console.log(
      "[DeadlineCheck] Completed —",
      new Date().toLocaleString("en-IN"),
    );
  } catch (err) {
    console.error("[DeadlineCheck] Fatal error:", err.message);
  }
}

function scheduleDeadlineCheck() {
  // Runs daily at 9:00 PM IST
  cron.schedule(
    "0 21 * * *",
    () => {
      console.log(
        "[DeadlineCheck] Triggered at",
        new Date().toLocaleString("en-IN"),
      );
      runDeadlineCheck();
    },
    { timezone: "Asia/Kolkata" },
  );
  console.log("[DeadlineCheck] Scheduled — daily at 9:00 PM IST");
}

module.exports = { scheduleDeadlineCheck };
