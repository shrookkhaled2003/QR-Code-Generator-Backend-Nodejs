const mongoose = require('mongoose');
const Attendance = require('../models/attendance.model.js');

const recordAttendance = async (req, res) => {
  try {
    const { lecture, studentName, department, group, gpsLocation } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(lecture)) {
      return res.status(400).json({ message: 'Invalid lecture ID' });
    }

    // Create attendance record
    const attendance = new Attendance({
      lecture: new mongoose.Types.ObjectId(lecture),
      studentName,
      department, // Required field
      group, // Optional field
      gpsLocation
    });

    await attendance.save();

    res.status(201).json({ message: 'Attendance recorded successfully' });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: 'Error recording attendance', error });
  }
};
module.exports = recordAttendance;