const NOCRequest = require("../models/NOCRequest");
const Student = require("../models/Student");

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
    res.json(requests);
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
    const request = await NOCRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    request.status = status;
    if (rejectionReason) request.rejectionReason = rejectionReason;
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
