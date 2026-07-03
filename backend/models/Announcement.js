const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['General', 'Important', 'Urgent'],
    default: 'General'
  },
  target: {
    all: {
      type: Boolean,
      default: true,
    },
    schools: {
      type: [
        {
          school: { type: String },
          courses: { type: [String], default: [] },
        },
      ],
      default: [],
    },
  },
  room: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: String,
  },
  time: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Published', 'Draft'],
    default: 'Draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinator',
  },

},{
    timestamps: true,
  });

module.exports = mongoose.model('Announcement', announcementSchema);