const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: String, required: true },
  section: { type: String, required: true },
  date: { type: Date, default: Date.now },
  qrCode: { type: String },
  gpsLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  } 
});

module.exports = mongoose.model('Lecture', lectureSchema);
