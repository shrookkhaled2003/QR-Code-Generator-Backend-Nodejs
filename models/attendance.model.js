const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  lecture: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  studentName: { type: String, required: true },
  department: { type: String, required: true },
  group: { type: String },
  gpsLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  deviceFingerprint: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
