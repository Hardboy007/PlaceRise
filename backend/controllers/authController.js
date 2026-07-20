const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Student = require("../models/Student");
const Coordinator = require("../models/Coordinator");

// Token generate karne ka function
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Helper: kisi bhi special regex character ko escape karo,
// taaki agar erpId mein galti se koi regex-special character
// (jaise ., *, +, etc.) ho toh query crash na ho
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Student Login
const studentLogin = async (req, res) => {
  try {
    const { erpId, password } = req.body;

    if (!erpId) {
      return res.status(400).json({ message: "ERP ID is required" });
    }

    const trimmedErpId = erpId.trim();

    // ERP ID se user dhundho — case-insensitive match
    // (23btcse0333, 23BTCSE0333, 23BtCsE0333 sab match honge)
    const user = await User.findOne({
      erpId: { $regex: `^${escapeRegex(trimmedErpId)}$`, $options: "i" },
      role: "student",
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid ERP ID" });
    }

    //Password check kro
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    //Student profile fetch karo
    const student = await Student.findOne({ userId: user._id });

    //Token banao aur bhejo
    res.json({
      token: generateToken(user._id, user.role),
      isFirstLogin: user.isFirstLogin,
      student: {
        id: student._id,
        name: student.name,
        erpId: user.erpId,
        branch: student.branch,
        department: student.department,
        school: student.school,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Coordinator Login
const coordinatorLogin = async (req, res) => {
  try {
    const { erpId, password } = req.body;

    if (!erpId) {
      return res.status(400).json({ message: "ERP ID is required" });
    }

    const trimmedErpId = erpId.trim();

    //Erp se user dhundho — case-insensitive match
    const user = await User.findOne({
      erpId: { $regex: `^${escapeRegex(trimmedErpId)}$`, $options: "i" },
      role: "coordinator",
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid ERP ID" });
    }

    //password check kro
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Coordinator profile fetch karo
    const coordinator = await Coordinator.findOne({ userId: user._id });

    // Token banao aur bhejo
    res.json({
      token: generateToken(user._id, user.role),
      coordinator: {
        id: coordinator._id,
        name: coordinator.name,
        email: coordinator.email,
        erpId: user.erpId,
        designation: coordinator.designation,
        department: coordinator.department,
        college: coordinator.college,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Sirf non-first-login users ke liye current password check karo
    if (!user.isFirstLogin) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: "Current password is required" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { studentLogin, coordinatorLogin, changePassword };
