const Lecture = require('../models/lecture.model.js');
const Instructor = require('../models/instructor.model.js');
const Attendance = require('../models/attendance.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const qr = require('qrcode');

// Register a new instructor
exports.registerInstructor = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingInstructor = await Instructor.findOne({ email });

        if (existingInstructor) {
            return res.status(400).json({ message: "Email is already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const instructor = new Instructor({ name, email, password: hashedPassword });
        await instructor.save();

        // Generate token
        const token = jwt.sign({ id: instructor._id, role: "instructor" }, process.env.JWT_SECRET, { expiresIn: "3days" });

        res.status(201).json({
            message: "Instructor registered successfully",
            token
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error registering instructor", error });
    }
};

// Instructor login
exports.loginInstructor = async (req, res) => {
    try {
        const { email, password } = req.body;
        const instructor = await Instructor.findOne({ email });
        if (!instructor) {
            return res.status(400).json({ message: 'Instructor not found' });
        }
        const isMatch = await bcrypt.compare(password, instructor.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password' });
        }
        const token = jwt.sign({ id: instructor._id }, process.env.JWT_SECRET, { expiresIn: '3days' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

// Create a new lecture with QR Code generation
exports.createLecture = async (req, res) => {
    try {
        const { course, section, date } = req.body;
        const instructorId = req.user.id;

        const lecture = new Lecture({ instructor: instructorId, course, section, date });
        const qrCode = await qr.toDataURL(`${lecture._id}`);
        lecture.qrCode = qrCode;
        await lecture.save();

        res.status(201).json({ message: 'Lecture created successfully', lecture });
    } catch (error) {
        res.status(500).json({ message: 'Error creating lecture', error });
    }
};

// Get attendance records for the instructor
exports.getAttendance = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const lectures = await Lecture.find({ instructor: instructorId }).select('_id course section date');

        const lectureIds = lectures.map(lecture => lecture._id);

        const attendanceRecords = await Attendance.find({ lecture: { $in: lectureIds } })
            .populate('lecture', 'course section date')
            .lean();

        // Group attendance records by lecture
        const groupedAttendance = {};
        attendanceRecords.forEach(record => {
            const lectureId = record.lecture._id.toString();
            if (!groupedAttendance[lectureId]) {
                groupedAttendance[lectureId] = {
                    lecture: record.lecture,
                    students: []
                };
            }
            groupedAttendance[lectureId].students.push({
                studentName: record.studentName,
                studentEmail: record.studentEmail,
                gpsLocation: record.gpsLocation,
                timestamp: record.timestamp
            });
        });

        res.json(Object.values(groupedAttendance));
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        res.status(500).json({ message: 'Error fetching attendance records', error });
    }
};
