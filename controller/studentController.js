const mongoose = require('mongoose');
const Attendance = require('../models/attendance.model.js');

const recordAttendance = async (req, res) => {
  try {
    const { lecture, studentName, department, group, gpsLocation, deviceFingerprint } = req.body;
    // Validate if the lecture ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(lecture)) {
      return res.status(400).json({ message: 'Invalid lecture ID' });
    }

    // Check if the device has already recorded attendance for this lecture
    const existingAttendance = await Attendance.findOne({ lecture, deviceFingerprint });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already recorded from this device' });
    }

    // Create a new attendance record
    const attendance = new Attendance({
      lecture: new mongoose.Types.ObjectId(lecture),
      studentName,
      department,
      group,
      gpsLocation,
      deviceFingerprint
    });

    // Save the attendance record to the database
    await attendance.save();
    res.status(201).json({ message: 'Attendance recorded successfully' });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: 'Error recording attendance', error });
  }
};

module.exports = recordAttendance;
