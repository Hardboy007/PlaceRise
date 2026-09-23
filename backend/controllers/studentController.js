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
      "resume", // ADD
      "resumeData", // ADD
      "githubUrl", // ADD (profile me add kiya tha)
      "codingProfileUrl", // ADD
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
    if ("resume" in set && set.resume === null) {
      delete set.resume;
      update.$unset = { ...update.$unset, resume: "", resumeData: "" };
    }
    if ("resumeData" in set && set.resumeData === null) {
      delete set.resumeData;
      update.$unset = { ...update.$unset, resumeData: "" };
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
    if (!student) return res.status(404).json({ message: "Student not found" });

    let fileUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "placerise/certifications",
        resource_type: "auto",
      });
      fs.unlink(req.file.path, () => {});
      fileUrl = result.secure_url;
    }

    const skillsParsed = req.body.skills ? JSON.parse(req.body.skills) : [];
    student.certifications.push({ ...req.body, skills: skillsParsed, fileUrl });
    await student.save();

    res.json(student.certifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
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

const path = require("path");
const buildDbuuHTML = (data) => {
  const {
    name = "",
    email = "",
    phone = "",
    city = "",
    linkedinUrl = "",
    githubUrl = "",
    about = "",
    college = "",
    branch = "",
    cgpa = "",
    batch = "",
    tenthMarks = "",
    twelfthMarks = "",
    skillCategories = [],
    projects = [],
    experience = [],
    achievements = [],
    certifications = [],
  } = data;

  const batchYear = batch ? batch.split(/[-–]/)[1]?.trim() : "";

  // ── Contact line ──
  const contactParts = [city, phone, email, linkedinUrl, githubUrl].filter(
    Boolean,
  );

  // ── Meta line ──
  const metaParts = [
    branch ? `B.Tech, ${branch}` : null,
    batch ? `Batch ${batch}` : null,
    college || null,
  ].filter(Boolean);

  // ── Academic rows ──
  const academicRows = [
    {
      degree: `B.Tech (${branch || "—"})`,
      institute: college || "—",
      marks: cgpa ? `${cgpa}` : "—",
      year: batchYear ? `${batchYear} (Exp.)` : "—",
    },
    twelfthMarks && {
      degree: "XII (CBSE)",
      institute: "—",
      marks: `${twelfthMarks}%`,
      year: "2023",
    },
    tenthMarks && {
      degree: "X (CBSE)",
      institute: "—",
      marks: `${tenthMarks}%`,
      year: "2021",
    },
  ].filter(Boolean);

  // ── Skill categories ──
  const skillRows = skillCategories.filter((c) => c.label || c.skills);

  // ── Projects HTML ──
  const projectsHTML = projects
    .map((p) => {
      const bullets = p.desc
        ? p.desc
            .split("\n")
            .filter(Boolean)
            .map((line) => `<li>${line.replace(/^[•▪\-]\s*/, "")}</li>`)
            .join("")
        : "";

      // Group bullets into rows: Impact (first half) + Delivery (second half)
      // OR use p.impact / p.delivery if your data has those fields
      const allLines = p.desc ? p.desc.split("\n").filter(Boolean) : [];
      const mid = Math.ceil(allLines.length / 2);
      const impactLines = allLines.slice(0, mid);
      const deliveryLines = allLines.slice(mid);

      const makeBullets = (lines) =>
        lines.map((l) => `<li>${l.replace(/^[•▪\-]\s*/, "")}</li>`).join("");

      // If project has explicit impact/delivery fields use them, else split desc
      const impactHTML = p.impact
        ? p.impact
            .split("\n")
            .filter(Boolean)
            .map((l) => `<li>${l.replace(/^[•▪\-]\s*/, "")}</li>`)
            .join("")
        : makeBullets(impactLines);

      const deliveryHTML = p.delivery
        ? p.delivery
            .split("\n")
            .filter(Boolean)
            .map((l) => `<li>${l.replace(/^[•▪\-]\s*/, "")}</li>`)
            .join("")
        : makeBullets(deliveryLines);

      const techStack = p.subtitle
        ? ` &nbsp;|&nbsp; <span style="font-weight:normal">${p.subtitle}</span>`
        : "";
      const link = p.period || p.link || "";

      // If only one section of bullets, show as single "Delivery" row
      const tableRows =
        impactHTML && deliveryHTML
          ? `
          <tr>
            <td class="label-cell">Impact</td>
            <td><ul>${impactHTML}</ul></td>
          </tr>
          <tr>
            <td class="label-cell">Delivery</td>
            <td><ul>${deliveryHTML}</ul></td>
          </tr>`
          : `
          <tr>
            <td class="label-cell">Delivery</td>
            <td><ul>${impactHTML || deliveryHTML || bullets}</ul></td>
          </tr>`;

      return `
        <div class="project-header-row">
          <div class="project-title">${p.title || "—"}${techStack}</div>
          ${link ? `<div class="project-link">${link}</div>` : ""}
        </div>
        <table class="proj-table">
          ${tableRows}
        </table>`;
    })
    .join("");

  // ── Experience HTML ──
  const experienceHTML = experience
    .map(
      (e) => `
      <div class="project-header-row">
        <div class="project-title">${e.title || "—"}${e.subtitle ? ` &nbsp;|&nbsp; <span style="font-weight:normal">${e.subtitle}</span>` : ""}</div>
        ${e.period ? `<div class="project-link">${e.period}</div>` : ""}
      </div>
      ${
        e.desc
          ? `<table class="proj-table">
          <tr>
            <td class="label-cell">Work</td>
            <td><ul>${e.desc
              .split("\n")
              .filter(Boolean)
              .map((l) => `<li>${l.replace(/^[•▪\-]\s*/, "")}</li>`)
              .join("")}</ul></td>
          </tr>
        </table>`
          : ""
      }`,
    )
    .join("");

  // ── Achievements HTML ──
  const achievementsHTML =
    achievements.length > 0
      ? `
      <table class="comp-table">
        ${achievements
          .map(
            (a) => `
          <tr>
            <td class="label-cell">${a.title || "Recognition"}</td>
            <td><ul class="ach-list">${(a.desc || "")
              .split("\n")
              .filter(Boolean)
              .map((l) => `<li>${l.replace(/^[•▪\-]\s*/, "")}</li>`)
              .join("")}</ul></td>
          </tr>`,
          )
          .join("")}
      </table>`
      : "";

  // ── Certifications HTML ──
  const certificationsHTML =
    certifications.length > 0
      ? `
      <table class="comp-table">
        ${certifications
          .map(
            (c) => `
          <tr>
            <td class="label-cell">${c.title || "—"}</td>
            <td>${c.subtitle || "—"}</td>
          </tr>`,
          )
          .join("")}
      </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
 
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    color: #000;
    background: #fff;
    padding: 22px 30px;
    width: 794px; /* A4 width at 96dpi */
  }
 
  /* ── HEADER ── */
  .header-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
  }
  .logo-wrap { width: 46px; height: 46px; flex-shrink: 0; }
  .dbuu-univ-name {
    font-size: 8.5pt;
    font-weight: bold;
    color: #8B0000;
    letter-spacing: 0.4px;
  }
  .header-rule {
    border: none;
    border-top: 1.5px solid #8B0000;
    margin-bottom: 5px;
  }
  .cv-name {
    font-size: 22pt;
    font-weight: bold;
    color: #8B0000;
    line-height: 1.1;
    margin-bottom: 2px;
  }
  .cv-subtitle {
    font-size: 9.5pt;
    font-weight: bold;
    color: #000;
    margin-bottom: 2px;
  }
  .cv-contact {
    font-size: 8pt;
    color: #333;
    margin-bottom: 6px;
  }
 
  /* ── BANNER ── */
  .highlight-banner {
    background-color: #111;
    color: #fff;
    text-align: center;
    padding: 6px 10px;
    font-size: 8.5pt;
    font-weight: bold;
    margin-bottom: 8px;
    line-height: 1.6;
  }
 
  /* ── SECTION HEADER ── */
  .section-header {
    background-color: #6B0F1A;
    color: #fff;
    font-size: 9pt;
    font-weight: bold;
    padding: 3.5px 7px;
    margin-top: 8px;
    margin-bottom: 0;
    letter-spacing: 0.3px;
  }
 
  /* ── ACADEMIC TABLE ── */
  .academic-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
  }
  .academic-table th {
    background-color: #e8e8e8;
    font-weight: bold;
    padding: 4px 8px;
    border: 1px solid #bbb;
    text-align: center;
  }
  .academic-table td {
    padding: 3.5px 8px;
    border: 1px solid #ccc;
    text-align: center;
  }
  .academic-table td.left { text-align: left; }
 
  /* ── COMPETENCIES / SKILLS TABLE ── */
  .comp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
  }
  .comp-table td {
    padding: 4.5px 7px;
    border: 1px solid #ddd;
    vertical-align: top;
  }
  .label-cell {
    background-color: #fce8e8 !important;
    font-weight: bold;
    color: #6B0F1A !important;
    width: 22%;
    white-space: nowrap;
  }
 
  /* ── PROJECT HEADER ROW ── */
  .project-header-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 7px;
    margin-bottom: 2px;
  }
  .project-title {
    font-size: 9.5pt;
    font-weight: bold;
    color: #000;
    flex: 1;
  }
  .project-link {
    font-size: 8.5pt;
    color: #444;
    font-style: italic;
    white-space: nowrap;
    margin-left: 12px;
  }
 
  /* ── PROJECT / EXPERIENCE TABLE ── */
  .proj-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
  }
  .proj-table td {
    padding: 4.5px 7px;
    border: 1px solid #ddd;
    vertical-align: top;
  }
  .proj-table ul {
    margin: 0; padding: 0; list-style: none;
  }
  .proj-table ul li {
    position: relative;
    padding-left: 11px;
    margin-bottom: 3px;
    line-height: 1.45;
  }
  .proj-table ul li::before {
    content: "▪";
    position: absolute;
    left: 0; top: 0;
  }
 
  /* ── ACHIEVEMENTS LIST ── */
  .ach-list {
    margin: 0 !important;
    padding-left: 15px !important;
    list-style: disc !important;
  }
  .ach-list li { margin-bottom: 3px; line-height: 1.45; }
</style>
</head>
<body>
 
  <!-- LOGO + UNIVERSITY NAME -->
  <div class="header-top">
    <div class="logo-wrap">
      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="46" height="46">
        <circle cx="24" cy="24" r="22" fill="#fff" stroke="#B8860B" stroke-width="2.5"/>
        <circle cx="24" cy="24" r="17" fill="none" stroke="#B8860B" stroke-width="1"/>
        <text x="24" y="22" text-anchor="middle" font-family="Arial" font-size="9" font-weight="bold" fill="#8B0000">DB</text>
        <text x="24" y="31" text-anchor="middle" font-family="Arial" font-size="7" fill="#8B0000">UU</text>
      </svg>
    </div>
    <div class="dbuu-univ-name">DEV BHOOMI UTTARAKHAND UNIVERSITY</div>
  </div>
 
  <hr class="header-rule">
 
  <div class="cv-name">${name.toUpperCase()}</div>
  <div class="cv-subtitle">${metaParts.join(" &nbsp;|&nbsp; ")}</div>
  <div class="cv-contact">${contactParts.join(" &nbsp;|&nbsp; ")}</div>
 
  ${about ? `<div class="highlight-banner">${about}</div>` : ""}
 
  <!-- ACADEMIC RECORD -->
  <div class="section-header">ACADEMIC RECORD</div>
  <table class="academic-table">
    <thead>
      <tr>
        <th>Degree</th>
        <th>Institute / Board</th>
        <th>% / CGPA</th>
        <th>Year</th>
      </tr>
    </thead>
    <tbody>
      ${academicRows
        .map(
          (r) => `
        <tr>
          <td>${r.degree}</td>
          <td class="left">${r.institute}</td>
          <td>${r.marks}</td>
          <td>${r.year}</td>
        </tr>`,
        )
        .join("")}
    </tbody>
  </table>
 
  <!-- CORE COMPETENCIES -->
  ${
    skillRows.length > 0
      ? `
  <div class="section-header">CORE COMPETENCIES</div>
  <table class="comp-table">
    ${skillRows
      .map(
        (cat) => `
      <tr>
        <td class="label-cell">${(cat.label || "").toUpperCase()}</td>
        <td>${cat.skills || ""}</td>
      </tr>`,
      )
      .join("")}
  </table>`
      : ""
  }
 
  <!-- PROJECTS -->
  ${
    projects.length > 0
      ? `<div class="section-header">PROJECTS</div>${projectsHTML}`
      : ""
  }
 
  <!-- EXPERIENCE -->
  ${
    experience.length > 0
      ? `<div class="section-header">EXPERIENCE</div>${experienceHTML}`
      : ""
  }
 
  <!-- CERTIFICATIONS -->
  ${
    certifications.length > 0
      ? `<div class="section-header">CERTIFICATIONS</div>${certificationsHTML}`
      : ""
  }
 
  <!-- ACHIEVEMENTS -->
  ${
    achievements.length > 0
      ? `<div class="section-header">ACHIEVEMENTS</div>${achievementsHTML}`
      : ""
  }
 
</body>
</html>`;
};

// ─────────────────────────────────────────────
//  MAIN CONTROLLER
// ─────────────────────────────────────────────
const generateResume = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      city,
      linkedinUrl,
      githubUrl,
      codingProfileUrl,
      about,
      college,
      branch,
      cgpa,
      batch,
      tenthMarks,
      twelfthMarks,
      skillCategories = [],
      skills = [],
      experience = [],
      projects = [],
      achievements = [],
      certifications = [],
      template = "dbuu",
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // DBUU -> frontend handle karega, sirf data save karo
    if (template === "dbuu") {
      const student = await Student.findOneAndUpdate(
        { userId: req.user.id },
        {
          resumeSource: "builder",
          resume: "dbuu-generated",
          resumeData: {
            name,
            email,
            phone,
            city,
            linkedinUrl,
            githubUrl,
            codingProfileUrl,
            about,
            college,
            branch,
            cgpa,
            batch,
            tenthMarks,
            twelfthMarks,
            skillCategories,
            skills,
            experience,
            projects,
            achievements,
            certifications,
            template,
          },
        },
        { new: true },
      );
      return res.json({ student });
    }

    // Minimal / Classic -> pdfkit (backend)
    const PDFDocument = require("pdfkit");
    const { Readable } = require("stream");
    const ACCENTS = { minimal: "#1E293B", classic: "#334155" };
    const accent = ACCENTS[template] || "#1E293B";
    const font = template === "classic" ? "Times-Roman" : "Helvetica";
    const fontBold = template === "classic" ? "Times-Bold" : "Helvetica-Bold";

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    await new Promise((resolve) => {
      doc.on("end", resolve);

      const pageWidth = doc.page.width;
      const LEFT = 50;
      const RIGHT = pageWidth - 50;

      doc
        .fillColor(accent)
        .font(fontBold)
        .fontSize(20)
        .text(name, { align: "left" });
      doc.font(font).fontSize(10).fillColor("#475569");
      doc.text([email, phone, city].filter(Boolean).join("   |   "));
      if (linkedinUrl) doc.fillColor(accent).text(linkedinUrl);
      doc.moveDown(0.3);
      doc
        .moveTo(LEFT, doc.y)
        .lineTo(RIGHT, doc.y)
        .strokeColor(accent)
        .lineWidth(1)
        .stroke();
      doc.moveDown(0.8).fillColor("#1E293B");

      const sectionHeader = (title) => {
        doc.moveDown(0.8);
        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(accent)
          .text(title.toUpperCase());
        doc
          .moveTo(LEFT, doc.y + 2)
          .lineTo(RIGHT, doc.y + 2)
          .strokeColor(accent)
          .lineWidth(0.5)
          .stroke();
        doc.moveDown(0.6).fillColor("#1E293B").font(font).fontSize(10);
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
          doc
            .font(fontBold)
            .fontSize(10.5)
            .fillColor("#1E293B")
            .text(e.title || "—", LEFT, titleY, { width: pageWidth - 250 });
          if (e.period)
            doc
              .font(font)
              .fontSize(9)
              .fillColor("#64748B")
              .text(e.period, pageWidth - 200, titleY, {
                width: 150,
                align: "right",
              });
          doc.x = LEFT;
          doc.y = Math.max(doc.y, titleY + 14);
          if (e.subtitle)
            doc
              .font(font)
              .fontSize(9.5)
              .fillColor("#64748B")
              .text(e.subtitle, LEFT, doc.y, {
                width: pageWidth - 100,
                lineGap: 2,
              });
          if (e.desc)
            doc
              .font(font)
              .fontSize(9.5)
              .fillColor("#1E293B")
              .text(e.desc, LEFT, doc.y, {
                width: pageWidth - 100,
                lineGap: 2,
              });
          if (idx < entries.length - 1) doc.moveDown(0.5);
        });
      };

      renderEntries("Experience", experience);
      renderEntries("Projects", projects);
      if (skills.length > 0) {
        sectionHeader("Skills");
        doc
          .font(font)
          .fontSize(10)
          .fillColor("#1E293B")
          .text(skills.join("   •   "), { lineGap: 3 });
      }

      doc.end();
    });

    const pdfBuffer = Buffer.concat(buffers);

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
      Readable.from(pdfBuffer).pipe(stream);
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
          githubUrl,
          codingProfileUrl,
          about,
          college,
          branch,
          cgpa,
          batch,
          tenthMarks,
          twelfthMarks,
          skillCategories,
          skills,
          experience,
          projects,
          achievements,
          certifications,
          template,
        },
      },
      { new: true },
    );

    res.json({ resumeUrl: uploadResult.secure_url, student });
  } catch (error) {
    console.error("generateResume error:", error);
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
        { new: true },
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

const cleanupOrphanedApplications = async (req, res) => {
  try {
    const result = await Application.deleteMany({ studentId: null });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
  cleanupOrphanedApplications,
};
