const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Coordinator = require('../models/Coordinator');

// POST /api/coordinators
// Admin nayi coordinator add kare
const createCoordinator = async (req, res) => {
  try {
    const { name, email, erpId, password, designation, department, college } = req.body;

    // Validation
    if (!name || !email || !erpId || !password || !designation || !department || !college) {
      return res.status(400).json({ message: 'All fields are required including college' });
    }

    // Check duplicate
    const existingUser = await User.findOne({ $or: [{ email }, { erpId }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or erpId already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // User create karo (role: coordinator)
    const user = await User.create({
      erpId,
      email,
      password: hashedPassword,
      role: 'coordinator'
    });

    // Coordinator create karo (userId linked)
    const coordinator = await Coordinator.create({
      userId: user._id,
      name,
      email,
      designation,
      department,
      college
    });

    res.status(201).json(coordinator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCoordinator };