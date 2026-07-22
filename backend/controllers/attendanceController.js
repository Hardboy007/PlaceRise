const { randomUUID } = require("crypto");
const AttendanceSession = require("../models/AttendanceSession");
const AttendanceRecord = require("../models/AttendanceRecord");
const Student = require("../models/Student");
const Coordinator = require("../models/Coordinator");
const JobPosting = require("../models/JobPosting");
const PDFDocument = require("pdfkit");
const { cloudinary } = require("../config/cloudinary");
const { Readable } = require("stream");
const logActivity = require("../utils/logActivity");

const startSession = async (req, res) => {
  try {
    const { jobId } = req.body;
    const coordinator = await Coordinator.findOne({ userId: req.user.id });
    if (!coordinator)
      return res.status(404).json({ message: "Coordinator not found" });

    const existing = await AttendanceSession.findOne({
      jobId,
      status: { $ne: "closed" },
    }).populate("jobId", "role");
    if (existing) return res.status(200).json(existing);

    const token = randomUUID();
    const session = await AttendanceSession.create({
      jobId,
      token,
      tokenIssuedAt: new Date(),
      coordinatorId: coordinator._id,
    });

    const job = await JobPosting.findById(jobId);
    await logActivity(
      req.user.id,
      `Started an attendance drive — ${job?.role || "a drive"}`,
      "attendance",
      session._id,
    );

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getActiveSession = async (req, res) => {
  try {
    const { jobId } = req.query;
    if (!jobId) return res.status(400).json({ message: "jobId required" });

    const session = await AttendanceSession.findOne({
      jobId,
      status: { $ne: "closed" },
    })
      .sort({ createdAt: -1 })
      .populate("jobId", "role");

    if (!session) return res.status(404).json({ message: "No active session" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── NAYA: QR token rotate karo (har 7s frontend se call hoga) ──
const rotateToken = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.status === "closed")
      return res.status(400).json({ message: "Session is closed" });

    const newToken = randomUUID();
    session.prevToken = session.token; // purana token ek rotation ke liye grace period mein
    session.token = newToken;
    session.tokenIssuedAt = new Date();
    await session.save();

    res.json({ token: newToken, tokenIssuedAt: session.tokenIssuedAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSessionAttendance = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(
      req.params.sessionId,
    ).populate("jobId", "role");
    if (!session) return res.status(404).json({ message: "Session not found" });

    const records = await AttendanceRecord.find({ sessionId: session._id })
      .populate({
        path: "studentId",
        select: "name course branch",
        populate: { path: "userId", select: "erpId" },
      })
      .sort({ markedAt: 1 });

    res.json({ session, records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATED: ab token ko current + prev dono se match karta hai ──
// ── FIX: response mein studentName seedha bhej rahe hain, taaki
// ScanAttendancePage.jsx par "Welcome, <name>" turant dikh jaaye
// bina kisi extra populate/refetch ke ──
const markAttendance = async (req, res) => {
  try {
    const { token } = req.body;

    const session = await AttendanceSession.findOne({
      $or: [{ token }, { prevToken: token }],
    });
    if (!session) return res.status(404).json({ message: "Invalid or expired QR code" });
    if (session.status === "closed")
      return res.status(400).json({ message: "Session expired" });

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const existing = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentId: student._id,
    });
    if (existing) return res.status(400).json({ message: "Already marked" });

    const record = await AttendanceRecord.create({
      sessionId: session._id,
      studentId: student._id,
      mode: "QR",
    });

    res.status(201).json({
      message: "Attendance marked successfully",
      record,
      studentName: student.name,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const manualMark = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { studentId, isLate } = req.body;

    const session = await AttendanceSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const existing = await AttendanceRecord.findOne({ sessionId, studentId });
    if (existing) return res.status(400).json({ message: "Already marked" });

    const record = await AttendanceRecord.create({
      sessionId,
      studentId,
      mode: "Manual",
      isLate: isLate || false,
    });

    const populated = await record.populate({
      path: "studentId",
      select: "name course branch",
      populate: { path: "userId", select: "erpId" },
    });
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const closeSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findByIdAndUpdate(
      req.params.sessionId,
      { status: "closed", closedAt: new Date() },
      { new: true },
    );
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportAttendancePDF = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(
      req.params.sessionId,
    ).populate("jobId", "role");
    if (!session) return res.status(404).json({ message: "Session not found" });

    const records = await AttendanceRecord.find({ sessionId: session._id })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "erpId" },
      })
      .sort({ markedAt: 1 });

    const job = session.jobId;
    const startTime = session.createdAt.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = session.closedAt
      ? session.closedAt.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Active";
    const dateStr = session.createdAt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    await new Promise((resolve) => {
      doc.on("end", resolve);

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Dev Bhoomi Uttarakhand University", { align: "center" });
      doc
        .fontSize(11)
        .font("Helvetica")
        .text("Training & Placement Cell", { align: "center" });
      doc.moveDown(0.5);
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .strokeColor("#3B82F6")
        .lineWidth(1)
        .stroke();
      doc.moveDown();

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("PLACEMENT DRIVE ATTENDANCE", { align: "center" });
      doc.moveDown();

      doc.fontSize(11).font("Helvetica");
      doc.text(`Drive: ${job?.role || "N/A"}`);
      doc.text(`Date: ${dateStr}`);
      doc.text(`Session: ${startTime} — ${endTime}`);
      doc.text(`Total Present: ${records.length}`);
      doc.moveDown();

      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .strokeColor("#CBD5E1")
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(0.5);

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Name", 50, doc.y, { width: 180, continued: true });
      doc.text("ERP ID", 230, doc.y, { width: 130, continued: true });
      doc.text("Time", 360, doc.y, { width: 80, continued: true });
      doc.text("Mode", 440, doc.y, { width: 110 });
      doc.moveDown(0.5);
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .strokeColor("#CBD5E1")
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(10);
      records.forEach((r) => {
        const y = doc.y;
        const time = new Date(r.markedAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const mode =
          r.mode === "Manual" ? (r.isLate ? "Manual (Late)" : "Manual") : "QR";
        doc.text(r.studentId?.name || "Unknown", 50, y, {
          width: 180,
          continued: true,
        });
        doc.text(r.studentId?.userId?.erpId || "", 230, y, {
          width: 130,
          continued: true,
        });
        doc.text(time, 360, y, { width: 80, continued: true });
        doc.text(mode, 440, y, { width: 110 });
        doc.moveDown(0.5);
      });

      doc.end();
    });

    const buffer = Buffer.concat(buffers);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=attendance_${session._id}.pdf`,
    );
    res.end(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startSession,
  getActiveSession,
  rotateToken,
  getSessionAttendance,
  markAttendance,
  manualMark,
  closeSession,
  exportAttendancePDF,
};