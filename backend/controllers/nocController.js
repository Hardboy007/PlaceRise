const NOCRequest = require("../models/NOCRequest");
const Student = require("../models/Student");
const PDFDocument = require("pdfkit");
const { cloudinary } = require("../config/cloudinary");
const { Readable } = require("stream");
const Coordinator = require("../models/Coordinator");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("../config/email");
const logActivity = require("../utils/logActivity");
const fs = require("fs");

// Student request bheje
const createRequest = async (req, res) => {
  try {
    const { type, purpose } = req.body;
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ message: "Student not found" });

    let proofUrl = "";
    if (req.file && type === "NOC") {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "placerise/noc-proofs",
      });
      proofUrl = result.secure_url;
      fs.unlink(req.file.path, () => {});
    }

    const request = await NOCRequest.create({
      studentId: student._id,
      type,
      purpose,
      proofUrl,
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
      .populate({
        path: "studentId",
        select: "name course school branch userId",
        // erpId doesn't live on Student directly — it's on the linked
        // User doc, so it needs its own nested populate here too
        // (updateRequestStatus already did this correctly, this one
        // was missing it, which is why erpId was showing blank in the table).
        populate: { path: "userId", select: "erpId" },
      })
      .sort({ createdAt: -1 });

    // Frontend expects flattened fields (studentName, course, requestType)
    // instead of a nested studentId object + a raw "type" field.
    const formatted = requests.map((r) => ({
      _id: r._id,
      studentId: r.studentId?._id,
      studentName: r.studentId?.name || "Unknown",
      erpId: r.studentId?.userId?.erpId || "",
      course: r.studentId?.course || "",
      school: r.studentId?.school || "",
      branch: r.studentId?.branch || "",
      requestType: r.type,
      purpose: r.purpose,
      status: r.status,
      rejectionReason: r.rejectionReason,
      pdfUrl: r.pdfUrl,
      proofUrl: r.proofUrl,
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
    // Background mein notification + email + activity log
    setImmediate(async () => {
      try {
        const studentUser = request.studentId?.userId
          ? await User.findById(
              request.studentId.userId._id || request.studentId.userId,
            )
          : null;

        if (studentUser && ["Approved", "Rejected"].includes(status)) {
          // Activity log — coordinator ke "Recent Activity" feed ke liye
          await logActivity(
            req.user?.id,
            `${status} ${request.type} request for ${request.studentId?.name || "a student"}`,
            "noc",
            request._id,
          );

          await Notification.create({
            userId: studentUser._id,
            type: "NOC_STATUS",
            title:
              status === "Approved"
                ? `✅ ${request.type} Approved`
                : `❌ ${request.type} Rejected`,
            message:
              status === "Approved"
                ? `Your ${request.type} request has been approved. Download your document from My Documents.`
                : `Your ${request.type} request was rejected. Reason: ${rejectionReason || "Not specified"}`,
            link: "/student/documents",
            isRead: false,
          });

          await sendEmail({
            to: studentUser.email,
            subject: `${request.type} Request ${status} — PlaceRise`,
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
            <h2 style="color: #1E293B;">Your ${request.type} Request Update</h2>
            <div style="background: ${status === "Approved" ? "#F0FDF4" : "#FEF2F2"}; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="color: ${status === "Approved" ? "#22C55E" : "#EF4444"}; font-weight: bold; font-size: 18px;">
                ${status === "Approved" ? "✅ Approved" : "❌ Rejected"}
              </p>
              <p><strong>Request Type:</strong> ${request.type}</p>
              <p><strong>Purpose:</strong> ${request.purpose}</p>
              ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
            </div>
            ${
              status === "Approved"
                ? '<a href="https://placerise.vercel.app/student/documents" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Download Document</a>'
                : ""
            }
            <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">PlaceRise | Dev Bhoomi Uttarakhand University</p>
          </div>
        `,
          });
        }
      } catch (bgError) {
        console.error("NOC notification error:", bgError.message);
      }
    });

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