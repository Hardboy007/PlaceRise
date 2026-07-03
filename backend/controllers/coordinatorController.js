const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Coordinator = require("../models/Coordinator");
const Announcement = require("../models/Announcement");

// POST /api/coordinators
const createCoordinator = async (req, res) => {
  try {
    const { name, email, erpId, password, designation, department, college } =
      req.body;

    if (
      !name ||
      !email ||
      !erpId ||
      !password ||
      !designation ||
      !department ||
      !college
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required including college" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { erpId }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email or erpId already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      erpId,
      email,
      password: hashedPassword,
      role: "coordinator",
    });

    const coordinator = await Coordinator.create({
      userId: user._id,
      name,
      email,
      designation,
      department,
      college,
    });

    res.status(201).json(coordinator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/coordinators/me
const getMyProfile = async (req, res) => {
  try {
    const coordinator = await Coordinator.findOne({ userId: req.user.id });
    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator profile not found" });
    }
    res.status(200).json(coordinator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/coordinators/me
const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, designation, department, college } = req.body;

    const coordinator = await Coordinator.findOneAndUpdate(
      { userId: req.user.id },
      { name, phone, designation, department, college },
      { new: true, runValidators: true },
    );

    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator profile not found" });
    }

    res.status(200).json(coordinator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/coordinators/me/notifications
const updateNotificationPreferences = async (req, res) => {
  try {
    const {
      emailNotifications,
      applicationUpdates,
      newCompanyAlerts,
      weeklyReport,
    } = req.body;

    const coordinator = await Coordinator.findOneAndUpdate(
      { userId: req.user.id },
      {
        notificationPreferences: {
          emailNotifications,
          applicationUpdates,
          newCompanyAlerts,
          weeklyReport,
        },
      },
      { new: true, runValidators: true },
    );

    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator profile not found" });
    }

    res.status(200).json(coordinator.notificationPreferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Date ko "2 hours ago" jaise relative string me convert karta hai
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "day", secs: 86400 },
    { label: "hour", secs: 3600 },
    { label: "minute", secs: 60 },
  ];
  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "Just now";
};

// GET /api/coordinators/me/activity
const getRecentActivity = async (req, res) => {
  try {
    const coordinator = await Coordinator.findOne({ userId: req.user.id });
    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator profile not found" });
    }

    const announcements = await Announcement.find({
      createdBy: coordinator._id,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const activity = announcements.map((a) => ({
      action:
        a.status === "Published"
          ? `Posted announcement — ${a.title}`
          : `Saved draft announcement — ${a.title}`,
      time: timeAgo(a.createdAt),
    }));

    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCoordinator,
  getMyProfile,
  updateMyProfile,
  updateNotificationPreferences,
  getRecentActivity,
};
