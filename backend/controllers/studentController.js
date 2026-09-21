const xlsx = require("xlsx");
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

const ALLOWED_DOC_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_DOC_SIZE = 5 * 1024 * 1024;

const removeTempFile = (file) => {
  if (file?.path) fs.unlink(file.path, () => {});
};

const isValidDoc = (file) =>
  ALLOWED_DOC_TYPES.includes(file.mimetype) && file.size <= MAX_DOC_SIZE;

// Marksheet / certificate upload (PDF -> raw, image -> image), temp file hamesha delete
const uploadDocument = async (file, folder) => {
  const isPdf = file.mimetype === "application/pdf";
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: isPdf ? "raw" : "image",
      ...(isPdf ? { format: "pdf" } : {}),
    });
    return result.secure_url;
  } finally {
    removeTempFile(file);
  }
};

const isValidPercent = (v) =>
  v !== undefined &&
  v !== null &&
  v !== "" &&
  !isNaN(Number(v)) &&
  Number(v) >= 0 &&
  Number(v) <= 100;

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [students, totalCount] = await Promise.all([
      Student.find()
        .populate("userId", "erpId email")
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(),
    ]);

    const studentIds = students.map((s) => s._id);

    const allSelectedApps = await Application.find({
      studentId: { $in: studentIds },
      status: "Selected",
    }).populate({
      path: "jobId",
      populate: { path: "companyId" },
    });

    const appMap = {};
    allSelectedApps.forEach((app) => {
      const sid = app.studentId.toString();
      if (!appMap[sid]) appMap[sid] = [];
      appMap[sid].push(app.jobId);
    });

    const studentsWithPlacement = students.map((student) => {
      const selectedJobs = appMap[student._id.toString()] || [];
      return {
        ...student,
        placementStatus: selectedJobs.length > 0 ? "Placed" : "Not Placed",
        selectedCompanies: selectedJobs,
      };
    });

    res.json({
      students: studentsWithPlacement,
      totalCount,
      page,
      hasMore: skip + students.length < totalCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single student by ID
const getStudentById = async (req, res) => {
  try {
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

// UPDATE logged-in student's own profile
// NOTE: marksheets / tenthMarks / twelfthMarks / certifications yahan allowed
// nahi hain — profile pe view-only hain.
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
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
      "parentName",
      "profilePhoto",
    ];

    const set = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) set[field] = req.body[field];
    });

    const update = {};

    // profilePhoto null / "" aaye to field hata do
    if ("profilePhoto" in set && !set.profilePhoto) {
      delete set.profilePhoto;
      update.$unset = { profilePhoto: "" };
    }
    if (Object.keys(set).length > 0) update.$set = set;

    if (Object.keys(update).length > 0) {
      await Student.findByIdAndUpdate(student._id, update);
    }

    const freshStudent = await Student.findById(student._id).populate(
      "userId",
      "erpId email",
    );
    res.json(await enrichStudentWithPlacementData(freshStudent));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const ONBOARD_FIELDS = [
  "name",
  "dob",
  "phone",
  "gender",
  "address",
  "city",
  "state",
  "parentEmail",
  "parentPhone",
  "parentName",
  "school",
  "branch",
  "course",
  "batch",
  "cgpa",
  "tenthMarks",
  "twelfthMarks",
  "backlogs",
  "skills",
];

const onboardStudent = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isFirstLogin) {
      return res.status(403).json({ message: "Onboarding already completed" });
    }

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (
      !isValidPercent(req.body.tenthMarks) ||
      !isValidPercent(req.body.twelfthMarks)
    ) {
      return res
        .status(400)
        .json({ message: "10th and 12th percentage (0-100) are required" });
    }

    if (!student.tenthMarksheet || !student.twelfthMarksheet) {
      return res
        .status(400)
        .json({ message: "Upload both 10th and 12th marksheets" });
    }

    const updates = {};
    ONBOARD_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      { $set: updates },
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

//=================== UPLOAD MARKSHEET (10th / 12th) =================
// Body: type = "10th" | "12th", file = pdf/jpg/png/webp (max 5MB)
// Onboarding ke time upload/overwrite allowed hai. Onboarding ke baad agar
// marksheet already hai to dobara upload block (profile pe view-only).
const uploadMarksheet = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const type = req.body.type;
    if (!["10th", "12th"].includes(type)) {
      removeTempFile(req.file);
      return res.status(400).json({ message: "type must be '10th' or '12th'" });
    }

    if (!isValidDoc(req.file)) {
      removeTempFile(req.file);
      return res
        .status(400)
        .json({ message: "Only PDF/JPG/PNG/WEBP up to 5MB allowed" });
    }

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      removeTempFile(req.file);
      return res.status(404).json({ message: "Student not found" });
    }

    const user = await User.findById(req.user.id);
    const field = type === "10th" ? "tenthMarksheet" : "twelfthMarksheet";

    if (student[field] && user && !user.isFirstLogin) {
      removeTempFile(req.file);
      return res
        .status(403)
        .json({ message: "Marksheet already uploaded and cannot be changed" });
    }

    const url = await uploadDocument(req.file, "placerise/marksheets");

    await Student.findByIdAndUpdate(student._id, { $set: { [field]: url } });

    res.json({ url, type });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//=================== ADD CERTIFICATION =================
// multipart/form-data: name, issuingOrganization, issueMonth, issueYear,
// expMonth, expYear, credentialId, credentialUrl, skills (JSON string), file (optional)
// Certification ke skills student.skills me auto merge hote hain (duplicate nahi).
const addCertification = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      removeTempFile(req.file);
      return res.status(404).json({ message: "Student not found" });
    }

    const {
      name,
      issuingOrganization,
      issueMonth,
      issueYear,
      expMonth,
      expYear,
      credentialId,
      credentialUrl,
    } = req.body;

    let skills = [];
    try {
      skills = JSON.parse(req.body.skills || "[]");
    } catch {
      skills = [];
    }
    skills = Array.isArray(skills)
      ? skills.map((s) => String(s).trim()).filter(Boolean)
      : [];

    if (!name?.trim() || !issuingOrganization?.trim()) {
      removeTempFile(req.file);
      return res
        .status(400)
        .json({ message: "Certification name and issuing organization are required" });
    }
    if (skills.length < 1) {
      removeTempFile(req.file);
      return res.status(400).json({ message: "Add at least 1 skill" });
    }
    if (credentialUrl && !/^https?:\/\//i.test(credentialUrl)) {
      removeTempFile(req.file);
      return res
        .status(400)
        .json({ message: "Credential URL must start with http:// or https://" });
    }
    if (credentialId && credentialId.length > 80) {
      removeTempFile(req.file);
      return res.status(400).json({ message: "Credential ID max 80 characters" });
    }

    let fileUrl = "";
    if (req.file) {
      if (!isValidDoc(req.file)) {
        removeTempFile(req.file);
        return res
          .status(400)
          .json({ message: "Only PDF/JPG/PNG/WEBP up to 5MB allowed" });
      }
      fileUrl = await uploadDocument(req.file, "placerise/certifications");
    }

    student.certifications.push({
      name: name.trim(),
      issuingOrganization: issuingOrganization.trim(),
      issueMonth: Number(issueMonth) || undefined,
      issueYear: Number(issueYear) || undefined,
      expMonth: Number(expMonth) || undefined,
      expYear: Number(expYear) || undefined,
      credentialId: credentialId || "",
      credentialUrl: credentialUrl || "",
      skills,
      fileUrl,
    });

    // Skills auto-merge (case-insensitive dedupe)
    const existing = new Set((student.skills || []).map((s) => s.toLowerCase()));
    skills.forEach((s) => {
      if (!existing.has(s.toLowerCase())) {
        student.skills.push(s);
        existing.add(s.toLowerCase());
      }
    });

    await student.save();

    const populated = await Student.findById(student._id).populate(
      "userId",
      "erpId email",
    );
    res.status(201).json({
      student: await enrichStudentWithPlacementData(populated),
    });
  } catch (error) {
    removeTempFile(req.file);
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

          // Cursor ko wapas left margin pe reset karo, aur y ko title + period
          // dono me se jo neeche ho wahan set karo
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

    // Bcrypt hash sab ke liye parallel mein
    const SALT_ROUNDS = 6;
    const BATCH_SIZE = 50;
    const preparedUsers = [];

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (row) => {
          const dobRaw = row["Date of Birth"];
          const dobParts = dobRaw.split(/[-\/]/);
          const day = dobParts[0].padStart(2, "0");
          const month = dobParts[1].padStart(2, "0");
          const year = dobParts[2];
          const defaultPassword = `${day}${month}${year}`;
          const hashedPassword = await bcrypt.hash(
            defaultPassword,
            SALT_ROUNDS,
          );
          return { row, dobRaw, hashedPassword };
        }),
      );
      preparedUsers.push(...batchResults);
    }

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
const bulkCgpaUpdate = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    let updated = 0;
    let notFound = 0;

    for (const { studentId, cgpa } of updates) {
      if (!studentId || isNaN(cgpa)) continue;

      const student = await Student.findByIdAndUpdate(
        studentId,
        { cgpa: Number(cgpa) },
        { new: true }
      );

      if (student) updated++;
      else notFound++;
    }

    res.json({ updated, notFound });
  } catch (err) {
    console.error("bulkCgpaUpdate error:", err);
    res.status(500).json({ message: "Bulk CGPA update failed" });
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
  uploadMarksheet,
  addCertification,
  uploadResume,
  generateResume,
  bulkImportStudents,
  exportStudentsExcel,
  saveJob,
  unsaveJob,
  getSavedJobs,
  bulkCgpaUpdate,
};
