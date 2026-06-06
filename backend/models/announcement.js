const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
    // e.g. "Campus Drive - TCS", "Resume Submission Deadline"
  },
  description: {
    type: String,
    required: true
    // Puri detail yahan aayegi
  },
  type: {
    type: String,
    enum: ['General', 'Important', 'Urgent'],
    default: 'General'
    // General = normal info
    // Important = dhyan dena zaroori
    // Urgent = turant action chahiye
  },
  target: {
    type: String,
    default: 'All'
    // 'All' = sabko dikhe
    // Ya specific branch: 'CSE', 'ECE', 'ME', etc.
  },
  status: {
    type: String,
    enum: ['Published', 'Draft'],
    default: 'Draft'
    // Draft = abhi sirf save hai, students ko nahi dikha
    // Published = live hai, students dekh sakte hain
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator', // kis coordinator ne banaya
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Announcement', announcementSchema);