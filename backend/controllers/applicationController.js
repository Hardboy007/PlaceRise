const Application = require("../models/Application");
const Student = require("../models/Student");
const JobPosting = require("../models/JobPosting");

// Student apply kare
const createApplication = async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.id;

    //Student dhundho
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    // Job dhundho aur expiry check karo
    const job = await JobPosting.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (new Date(job.lastDate) < new Date()) {
      return res
        .status(400)
        .json({ message: "Application deadline has passed" });
    }
    // Already applied check karo
    const alreadyApplied = await Application.findOne({
      studentId: student._id,
      jobId,
    });
    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    // 3 selected restriction check
    const selectedCount = await Application.countDocuments({
      studentId: student._id,
      status: "Selected",
    });
    if (selectedCount >= 3) {
      return res
        .status(400)
        .json({ message: "You have been selected in 3 companies already" });
    }

    const application = await Application.create({
      studentId: student._id,
      jobId,
      status: "Applied",
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student apni applications dekhe
const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const applications = await Application.find({
      studentId: student._id,
    }).populate({
      path: "jobId",
      populate: { path: "companyId" },
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Coordinator ek JD ki saari applications dekhe
const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    // FIXED: was .populate("studentId") — a flat populate that only pulls
    // fields living directly on the Student document (name, email, course,
    // cgpa, etc). erpId lives on the User model, so student.userId was
    // coming back as just an ObjectId string, and student.userId.erpId was
    // always undefined on the frontend. Nested populate below resolves
    // studentId -> then resolves studentId.userId -> erpId/email, matching
    // what getAllStudents already does in studentController.js.
    const applications = await Application.find({ jobId }).populate({
      path: "studentId",
      populate: { path: "userId", select: "erpId email" },
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Coordinator status change kare
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Applied", "Shortlisted", "Selected", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const application = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    // Student placementStatus update karo
    if (status === "Selected") {
      await Student.findByIdAndUpdate(application.studentId, {
        placementStatus: "Placed",
      });
    } else if (status === "Rejected") {
      // Check karo koi aur selected application hai ya nahi
      const otherSelected = await Application.findOne({
        studentId: application.studentId,
        status: "Selected",
        _id: { $ne: id },
      });
      if (!otherSelected) {
        await Student.findByIdAndUpdate(application.studentId, {
          placementStatus: "Not Placed",
        });
      }
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
};
