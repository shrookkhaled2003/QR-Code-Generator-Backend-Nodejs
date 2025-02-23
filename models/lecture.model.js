const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: String, required: true },
  section: { type: String, required: true },
  date: { type: Date, required: true },
  qrCode: { type: String } 
});

module.exports = mongoose.model('Lecture', lectureSchema);
