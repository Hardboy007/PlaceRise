const NOCRequest = require("../models/NOCRequest");
const Student = require("../models/Student");
const PDFDocument = require("pdfkit");
const { cloudinary } = require("../config/cloudinary");
const { Readable } = require("stream");
const Coordinator = require("../models/Coordinator");

// Student request bheje
const createRequest = async (req, res) => {
  try {
    const { type, purpose } = req.body;
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });
    const request = await NOCRequest.create({
      studentId: student._id,
      type,
      purpose,
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student apni requests dekhe
const getMyRequests = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });
    const requests = await NOCRequest.find({ studentId: student._id }).sort({
      createdAt: -1,
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Coordinator saari requests dekhe
const getAllRequests = async (req, res) => {
  try {
    const requests = await NOCRequest.find()
      .populate("studentId", "name course school branch")
      .sort({ createdAt: -1 });

    // Frontend expects flattened fields (studentName, course, requestType)
    // instead of a nested studentId object + a raw "type" field.
    const formatted = requests.map((r) => ({
      _id: r._id,
      studentId: r.studentId?._id,
      studentName: r.studentId?.name || "Unknown",
      course: r.studentId?.course || "",
      school: r.studentId?.school || "",
      branch: r.studentId?.branch || "",
      requestType: r.type,
      purpose: r.purpose,
      status: r.status,
      rejectionReason: r.rejectionReason,
      pdfUrl: r.pdfUrl,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Coordinator status update kare — PDF Hardik generate karega
const updateRequestStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const validStatuses = ["Pending", "Approved", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await NOCRequest.findById(req.params.id).populate({
      path: "studentId",
      populate: { path: "userId", select: "erpId" },
    });
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = status;
    if (rejectionReason) request.rejectionReason = rejectionReason;

    if (status === "Approved") {
      const student = request.studentId;
      const coordinator = await Coordinator.findOne({ userId: req.user.id });

      const doc = new PDFDocument({ margin: 60 });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));

      await new Promise((resolve) => {
        doc.on("end", resolve);

        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("Dev Bhoomi Uttarakhand University", { align: "center" });
        doc
          .fontSize(11)
          .font("Helvetica")
          .text("Training & Placement Cell, Manduwala, Dehradun - 248007", {
            align: "center",
          });
        doc.moveDown(0.5);
        doc
          .moveTo(60, doc.y)
          .lineTo(550, doc.y)
          .strokeColor("#3B82F6")
          .lineWidth(1.5)
          .stroke();
        doc.moveDown();

        doc
          .fontSize(15)
          .font("Helvetica-Bold")
          .fillColor("#1E293B")
          .text(
            request.type === "NOC"
              ? "NO OBJECTION CERTIFICATE"
              : "LETTER OF RECOMMENDATION",
            { align: "center" },
          );
        doc.moveDown();

        const dateStr = new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        doc.fontSize(11).font("Helvetica").fillColor("#1E293B");
        doc.text(`Date: ${dateStr}`, { align: "right" });
        doc.moveDown();

        doc.fontSize(12).font("Helvetica").fillColor("#1E293B");

        if (request.type === "NOC") {
          doc.text("To Whomsoever It May Concern,");
          doc.moveDown(0.5);
          doc.text(
            `This is to certify that ${student.name}, bearing Enrollment No. ${student.userId?.erpId || ""}, is a bonafide student of ${student.course} at Dev Bhoomi Uttarakhand University, Dehradun.`,
            { lineGap: 4 },
          );
          doc.moveDown(0.5);
          doc.text(
            `The University has no objection to their participation in / for: ${request.purpose}.`,
            { lineGap: 4 },
          );
          doc.moveDown(0.5);
          doc.text("We wish the student all the best in their endeavours.");
        } else {
          doc.text("To Whomsoever It May Concern,");
          doc.moveDown(0.5);
          doc.text(
            `It is with great pleasure that we recommend ${student.name}, bearing Enrollment No. ${student.userId?.erpId || ""}, currently pursuing ${student.course} at Dev Bhoomi Uttarakhand University, Dehradun.`,
            { lineGap: 4 },
          );
          doc.moveDown(0.5);
          doc.text(
            `The student has demonstrated exceptional academic performance and professional conduct throughout their tenure at this institution. We strongly recommend them for: ${request.purpose}.`,
            { lineGap: 4 },
          );
          doc.moveDown(0.5);
          doc.text(
            "We extend our full support and wish them success in all their future endeavours.",
          );
        }

        doc.moveDown(3);

        if (coordinator?.signatureUrl) {
          try {
            doc.image(coordinator.signatureUrl, { width: 120 });
          } catch (e) {}
          doc.moveDown(0.5);
        } else {
          doc.moveDown(2);
        }

        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(coordinator?.name || "Placement Coordinator");
        doc
          .fontSize(11)
          .font("Helvetica")
          .text(coordinator?.designation || "Training & Placement Cell");
        doc.text("Dev Bhoomi Uttarakhand University");

        doc.end();
      });

      const buffer = Buffer.concat(buffers);

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "placerise/noc-pdfs",
            resource_type: "raw",
            format: "pdf",
            public_id: `${request.type}_${student.name}_${Date.now()}`,
          },
          (error, result) => (error ? reject(error) : resolve(result)),
        );
        Readable.from(buffer).pipe(stream);
      });

      request.pdfUrl = uploadResult.secure_url;
    }

    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PDF URL save karo — Hardik generate karke yahan save karega
const savePdfUrl = async (req, res) => {
  try {
    const { pdfUrl } = req.body;
    const request = await NOCRequest.findByIdAndUpdate(
      req.params.id,
      { pdfUrl },
      { new: true },
    );
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
  savePdfUrl,
};