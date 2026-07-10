const { randomUUID } = require("crypto");
const AttendanceSession = require("../models/AttendanceSession");
const AttendanceRecord = require("../models/AttendanceRecord");
const Student = require("../models/Student");
const Coordinator = require("../models/Coordinator");
const JobPosting = require("../models/JobPosting");
const PDFDocument = require("pdfkit");
const { cloudinary } = require("../config/cloudinary");
const { Readable } = require("stream");

// Session start karo
const startSession = async (req, res) => {
  try {
    const { jobId } = req.body;
    const coordinator = await Coordinator.findOne({ userId: req.user.id });
    if (!coordinator)
      return res.status(404).json({ message: "Coordinator not found" });

    const token = randomUUID();
    const session = await AttendanceSession.create({
      jobId,
      token,
      coordinatorId: coordinator._id,
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Live attendance list dekho
const getSessionAttendance = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(
      req.params.sessionId,
    ).populate("jobId", "role");
    if (!session) return res.status(404).json({ message: "Session not found" });

    // FIXED: erpId lives on the User model, not Student — nested populate
    // through studentId.userId is required, same pattern used in
    // nocController/applicationController. Previously only "name course
    // branch" was populated, so studentId.userId was never present and
    // the frontend's ERP ID column had nothing to read.
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

// Student attendance mark kare
const markAttendance = async (req, res) => {
  try {
    const { token } = req.body;

    const session = await AttendanceSession.findOne({ token });
    if (!session) return res.status(404).json({ message: "Invalid QR code" });
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

    res.status(201).json({ message: "Attendance marked successfully", record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manual mark karo
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

    // FIXED: same nested populate as getSessionAttendance, so the row
    // this manual-mark call returns also carries erpId consistently.
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

// Session close karo
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

// PDF export
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

      // Header
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

      // Table header
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

      // Rows
      doc.font("Helvetica").fontSize(10);
      records.forEach((r, i) => {
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
  getSessionAttendance,
  markAttendance,
  manualMark,
  closeSession,
  exportAttendancePDF,
};
