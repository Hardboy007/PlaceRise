const mongoose = require('mongoose')

const attendanceSessionSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', required: true },
  token: { type: String, required: true, unique: true },
  coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coordinator', required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  closedAt: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema)