const mongoose = require('mongoose');
const Attendance = require('../models/attendance.model.js');
const Lecture = require('../models/lecture.model.js');

const recordAttendance = async (req, res) => {
  try {
      const { lecture, studentName, department, group, gpsLocation, deviceFingerprint } = req.body;

      // Validate the lecture ID format
      if (!mongoose.Types.ObjectId.isValid(lecture)) {
          return res.status(400).json({ message: 'Invalid lecture ID' });
      }

      // Retrieve the lecture details and check if it exists
      const lectureData = await Lecture.findById(lecture);
      if (!lectureData) {
          return res.status(404).json({ message: 'Lecture not found' });
      }

      // Check if the QR Code has expired (40 minutes from creation)
      const now = new Date();
      if (now > lectureData.expiresAt) {
          return res.status(400).json({ message: 'QR Code expired. Attendance not allowed.' });
      }

      // Check if the student has already recorded attendance using device fingerprint
      const existingAttendance = await Attendance.findOne({ lecture, deviceFingerprint });
      if (existingAttendance) {
          return res.status(400).json({ message: 'Attendance already recorded for this student from this device' });
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
