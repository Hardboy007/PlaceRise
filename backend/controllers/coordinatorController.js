const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Coordinator = require("../models/Coordinator");

// POST /api/coordinators
const createCoordinator = async (req, res) => {
  try {
    const { name, email, erpId, password, designation, department, college } =
      req.body;

    if (
      !name || !email || !erpId || !password ||
      !designation || !department || !college
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
      { new: true, runValidators: true }
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
      { new: true, runValidators: true }
    );

    if (!coordinator) {
      return res.status(404).json({ message: "Coordinator profile not found" });
    }

    res.status(200).json(coordinator.notificationPreferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCoordinator,
  getMyProfile,
  updateMyProfile,
  updateNotificationPreferences,
};