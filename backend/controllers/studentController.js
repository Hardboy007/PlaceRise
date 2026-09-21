const Student = require("../models/Student");
const Application = require("../models/Application");
const csv = require("csv-parser");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const ExcelJS = require("exceljs");
const User = require("../models/User");
const universityStructure = require("../data/universityStructure");
const { cloudinary } = require("../config/cloudinary");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");

const findSchoolAndDept = (course) => {
  for (const s of universityStructure) {
    for (const d of s.departments) {
      if (d.courses.includes(course)) {
        return { school: s.school, department: d.name };
      }
    }
  }
  return { school: "", department: "" };
};

const enrichStudentWithPlacementData = async (student) => {
  const studentObject = student.toObject ? student.toObject() : { ...student };
  const selectedApplications = await Application.find({
    studentId: student._id,
    status: "Selected",
  }).populate({
    path: "jobId",
    populate: { path: "companyId" },
  });

  return {
    ...studentObject,
    placementStatus: selectedApplications.length > 0 ? "Placed" : "Not Placed",
    selectedCompanies: selectedApplications.map(
      (application) => application.jobId,
    ),
  };
};

// GET all students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("userId", "erpId email");

    // Saare student IDs ek baar mein
    const studentIds = students.map((s) => s._id);

    // Single query — sab selected applications ek saath
    const allSelectedApps = await Application.find({
      studentId: { $in: studentIds },
      status: "Selected",
    }).populate({
      path: "jobId",
      populate: { path: "companyId" },
    });

    // Map banao studentId -> applications[]
    const appMap = {};
    allSelectedApps.forEach((app) => {
      const sid = app.studentId.toString();
      if (!appMap[sid]) appMap[sid] = [];
      appMap[sid].push(app.jobId);
    });

    const studentsWithPlacement = students.map((student) => {
      const studentObject = student.toObject();
      const selectedJobs = appMap[student._id.toString()] || [];
      return {
        ...studentObject,
        placementStatus: selectedJobs.length > 0 ? "Placed" : "Not Placed",
        selectedCompanies: selectedJobs,
      };
    });

    res.json(studentsWithPlacement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(req.params.id).populate(
      "userId",
      "erpId email",
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentWithPlacement = await enrichStudentWithPlacementData(student);
    res.json(studentWithPlacement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET logged-in student's own profile
const getMyProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate(
      "userId",
      "erpId email",
    );
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    const studentWithPlacement = await enrichStudentWithPlacementData(student);
    res.json(studentWithPlacement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE student by ID
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate(
      "userId",
      "erpId email",
    );
    if (!student) return res.status(404).json({ message: "Student not found" });

    const allowedFields = [
      "phone",
      "skills",
      "address",
      "city",
      "state",
      "gender",
      "about",
      "linkedinUrl",
      "parentEmail",
      "parentPhone",
      "profilePhoto",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // profilePhoto explicitly null set karo empty string aane pe
    if (req.body.profilePhoto === "" || req.body.profilePhoto === null) {
      updates.profilePhoto = null;
    }

    console.log("REQ BODY:", req.body);
    console.log("UPDATES:", updates);

    await Student.collection.updateOne(
      { _id: student._id },
      { $unset: { profilePhoto: "" } },
    );

    const freshStudent = await Student.findById(student._id).populate(
      "userId",
      "erpId email",
    );
    res.json(freshStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const onboardStudent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isFirstLogin) {
      return res.status(403).json({ message: "Onboarding already completed" });
    }

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      req.body,
      { new: true },
    );

    await User.findByIdAndUpdate(req.user.id, { isFirstLogin: false });

    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE logged-in student's own notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const {
      emailNotifications,
      applicationUpdates,
      jobAlerts,
      profileViews,
      weeklyDigest,
      smsNotifications,
    } = req.body;

    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      {
        notificationPreferences: {
          emailNotifications,
          applicationUpdates,
          jobAlerts,
          profileViews,
          weeklyDigest,
          smsNotifications,
        },
      },
      { new: true, runValidators: true },
    );

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.json(student.notificationPreferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "placerise/profile-photos",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
      ],
    });

    fs.unlink(req.file.path, () => {});

    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      { profilePhoto: result.secure_url },
      { new: true },
    );

    res.json({ profilePhotoUrl: result.secure_url, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//=================== UPLOAD RESUME =================
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // "onboarding" -> uploaded from the onboarding wizard
    // "manual" -> uploaded from the profile page (default/fallback)
    const source = req.body.source === "onboarding" ? "onboarding" : "manual";

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder: "placerise/resumes",
      format: "pdf",
    });

    // Temp file delete karo
    fs.unlink(req.file.path, () => {});

    // Student ka resume URL update karo. A manual/onboarding file upload
    // means any previously AI-generated resumeData is now stale (the file
    // itself no longer matches that template), so clear it.
    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      { resume: result.secure_url, resumeSource: source, resumeData: null },
      { new: true },
    );

    res.json({ resumeUrl: result.secure_url, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//=================== GENERATE RESUME (Build-in-app) =================
const generateResume = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      city,
      linkedinUrl,
      about,
      college,
      branch,
      cgpa,
      skills = [],
      experience = [],
      projects = [],
      template = "modern",
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const ACCENTS = {
      minimal: "#1E293B",
      modern: "#3B82F6",
      classic: "#334155",
    };
    const accent = ACCENTS[template] || ACCENTS.modern;
    const font = template === "classic" ? "Times-Roman" : "Helvetica";
    const fontBold = template === "classic" ? "Times-Bold" : "Helvetica-Bold";

    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    await new Promise((resolve) => {
      doc.on("end", resolve);

      const pageWidth = doc.page.width;

      if (template === "modern") {
        // Colored header band, drawn before margin content
        doc.rect(0, 0, pageWidth, 100).fill(accent);
        doc.fillColor("#FFFFFF").font(fontBold).fontSize(22);
        doc.text(name, 50, 35);
        doc.font(font).fontSize(10);
        const contactLine = [email, phone, city]
          .filter(Boolean)
          .join("   |   ");
        doc.text(contactLine, 50, 62);
        if (linkedinUrl) doc.text(linkedinUrl, 50, 78);
        doc.fillColor("#1E293B");
        doc.y = 120;
      } else {
        doc.fillColor(accent).font(fontBold).fontSize(20);
        doc.text(name, { align: "left" });
        doc.font(font).fontSize(10).fillColor("#475569");
        const contactLine = [email, phone, city]
          .filter(Boolean)
          .join("   |   ");
        doc.text(contactLine);
        if (linkedinUrl) {
          doc.fillColor(accent).text(linkedinUrl);
        }
        doc.moveDown(0.3);
        doc
          .moveTo(50, doc.y)
          .lineTo(pageWidth - 50, doc.y)
          .strokeColor(accent)
          .lineWidth(1)
          .stroke();
        doc.moveDown(0.8);
        doc.fillColor("#1E293B");
      }

      const sectionHeader = (title) => {
        doc.moveDown(0.8);
        doc.font(fontBold).fontSize(12).fillColor(accent);
        doc.text(title.toUpperCase());
        doc
          .moveTo(50, doc.y + 2)
          .lineTo(pageWidth - 50, doc.y + 2)
          .strokeColor(accent)
          .lineWidth(0.5)
          .stroke();
        doc.moveDown(0.6);
        doc.fillColor("#1E293B").font(font).fontSize(10);
      };

      if (about) {
        sectionHeader("Summary");
        doc.font(font).fontSize(10).text(about, { lineGap: 3 });
      }

      sectionHeader("Education");
      doc
        .font(fontBold)
        .fontSize(10.5)
        .text(college || "—");
      doc
        .font(font)
        .fontSize(10)
        .fillColor("#475569")
        .text(`${branch || "—"}   |   CGPA: ${cgpa || "—"}`);
      doc.fillColor("#1E293B");

      const renderEntries = (label, entries) => {
        if (!entries || entries.length === 0) return;
        sectionHeader(label);
        entries.forEach((e, idx) => {
          const titleY = doc.y;

          doc.font(fontBold).fontSize(10.5).fillColor("#1E293B");
          doc.text(e.title || "—", 50, titleY, { width: pageWidth - 250 });
          const afterTitleY = doc.y;

          if (e.period) {
            doc
              .font(font)
              .fontSize(9)
              .fillColor("#64748B")
              .text(e.period, pageWidth - 200, titleY, {
                width: 150,
                align: "right",
              });
          }

          // ── Zaroori fix: cursor ko wapas left margin pe reset karo, aur
          // y ko title + period dono me se jo neeche ho wahan set karo ──
          doc.x = 50;
          doc.y = Math.max(afterTitleY, doc.y);

          if (e.subtitle) {
            doc
              .font(font)
              .fontSize(9.5)
              .fillColor("#64748B")
              .text(e.subtitle, 50, doc.y, {
                width: pageWidth - 100,
                lineGap: 2,
              });
          }
          if (e.desc) {
            doc
              .font(font)
              .fontSize(9.5)
              .fillColor("#1E293B")
              .text(e.desc, 50, doc.y, { width: pageWidth - 100, lineGap: 2 });
          }
          if (idx < entries.length - 1) doc.moveDown(0.5);
        });
      };

      renderEntries("Experience", experience);
      renderEntries("Projects", projects);

      if (skills.length > 0) {
        sectionHeader("Skills");
        doc.font(font).fontSize(10).fillColor("#1E293B");
        doc.text(skills.join("   •   "), { lineGap: 3 });
      }

      doc.end();
    });

    const buffer = Buffer.concat(buffers);

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "placerise/resumes",
          resource_type: "raw",
          format: "pdf",
          public_id: `resume_${name.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}`,
        },
        (error, result) => (error ? reject(error) : resolve(result)),
      );
      Readable.from(buffer).pipe(stream);
    });

    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      {
        resume: uploadResult.secure_url,
        resumeSource: null,
        resumeData: {
          name,
          email,
          phone,
          city,
          linkedinUrl,
          about,
          college,
          branch,
          cgpa,
          skills,
          experience,
          projects,
          template,
        },
      },
      { new: true },
    );

    res.json({ resumeUrl: uploadResult.secure_url, student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================== BULK IMPORT ==================
const bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => results.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    fs.unlink(req.file.path, () => {});

    // Pehle saare existing ERPs ek baar fetch kar lo
    const allErpIds = results.map((r) => r["ERP ID"]).filter(Boolean);

    const existingUsers = await User.find(
      { erpId: { $in: allErpIds } },
      { erpId: 1 },
    );
    const existingErpSet = new Set(existingUsers.map((u) => u.erpId));

    // Valid rows filter karo
    const validRows = results.filter((row) => {
      const erpId = row["ERP ID"];
      const dobRaw = row["Date of Birth"];
      return erpId && dobRaw && !existingErpSet.has(erpId);
    });

    const skipped = results.length - validRows.length;

    // Bcrypt hash sab ke liye parallel mein
    const SALT_ROUNDS = 10;
    const preparedUsers = await Promise.all(
      validRows.map(async (row) => {
        const dobRaw = row["Date of Birth"];
        const dobParts = dobRaw.split(/[-\/]/);
        const day = dobParts[0].padStart(2, "0");
        const month = dobParts[1].padStart(2, "0");
        const year = dobParts[2];
        const defaultPassword = `${day}${month}${year}`;
        const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

        return {
          row,
          dobRaw,
          hashedPassword,
        };
      }),
    );

    // Bulk User insert
    const userDocs = preparedUsers.map(({ row, hashedPassword }) => ({
      erpId: row["ERP ID"],
      email: row["Email"],
      password: hashedPassword,
      role: "student",
      isFirstLogin: true,
    }));

    const insertedUsers = await User.insertMany(userDocs, { ordered: false });

    // ERP -> _id map banao
    const erpToUserId = {};
    insertedUsers.forEach((u) => {
      erpToUserId[u.erpId] = u._id;
    });

    // Bulk Student insert
    const studentDocs = preparedUsers
      .map(({ row, dobRaw }) => {
        const erpId = row["ERP ID"];
        const userId = erpToUserId[erpId];
        if (!userId) return null;

        const course = row["Course"];
        const { school, department } = findSchoolAndDept(course);

        return {
          userId,
          name: row["Student Name"],
          email: row["Email"],
          course,
          dob: dobRaw,
          school,
          branch: department,
        };
      })
      .filter(Boolean);

    await Student.insertMany(studentDocs, { ordered: false });

    res.status(200).json({
      imported: studentDocs.length,
      skipped: results.length - studentDocs.length,
    });
  } catch (error) {
    console.error("Bulk import error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ================== EXPORT EXCEL ==================
const exportStudentsExcel = async (req, res) => {
  try {
    const students = await Student.find().populate("userId", "erpId email");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");

    sheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "ERP ID", key: "erpId", width: 15 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "School", key: "school", width: 30 },
      { header: "Course", key: "course", width: 25 },
      { header: "Batch", key: "batch", width: 10 },
      { header: "CGPA", key: "cgpa", width: 10 },
      { header: "Backlogs", key: "backlogs", width: 10 },
      { header: "Placement Status", key: "placementStatus", width: 18 },
    ];

    students.forEach((s) => {
      sheet.addRow({
        name: s.name,
        erpId: s.userId?.erpId || "",
        email: s.email,
        phone: s.phone || "",
        school: s.school || "",
        course: s.course || "",
        batch: s.batch || "",
        cgpa: s.cgpa || "",
        backlogs: s.backlogs || 0,
        placementStatus: s.placementStatus || "Not Placed",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=students.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//================SAVE JOB===================
const saveJob = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!student.savedJobs.includes(req.params.jobId)) {
      student.savedJobs.push(req.params.jobId);
      await student.save();
    }
    res.json({ savedJobs: student.savedJobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unsaveJob = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.savedJobs = student.savedJobs.filter(
      (id) => id.toString() !== req.params.jobId,
    );
    await student.save();
    res.json({ savedJobs: student.savedJobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSavedJobs = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate(
      "savedJobs",
    );
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student.savedJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  getMyProfile,
  updateStudent,
  onboardStudent,
  updateNotificationPreferences,
  uploadProfilePhoto,
  uploadResume,
  generateResume,
  bulkImportStudents,
  exportStudentsExcel,
  saveJob,
  unsaveJob,
  getSavedJobs,
};
