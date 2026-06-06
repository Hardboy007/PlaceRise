const mongoose = require('mongoose');

const coordinatorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
    // e.g. "Training & Placement Officer", "Assistant TPO"
  },
  department: {
    type: String,
    required: true
    // e.g. "CSE", "ECE", "Mechanical"
  },
  college: {
    type: String,
    required: true
    // e.g. "ABC Engineering College"
  },
  role: {
    type: String,
    default: 'coordinator',
    enum: ['coordinator'],  // sirf yahi value allowed - kabhi change nahi hogi
    immutable: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Coordinator', coordinatorSchema);