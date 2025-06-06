const Lecture = require('../models/lecture.model.js');
const Instructor = require('../models/instructor.model.js');
const Attendance = require('../models/attendance.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const qr = require('qrcode');
const ExcelJs = require('exceljs');

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
        const { course, section, group, gpsLocation } = req.body;
        const instructorId = req.user.id;

        // Validate GPS location data
        if (!gpsLocation || !gpsLocation.latitude || !gpsLocation.longitude) {
            return res.status(400).json({ message: 'GPS location (latitude and longitude) is required' });
        }

        // Set the expiration time to 40 minutes from creation
        const date = new Date();
        date.setMinutes(date.getMinutes() + 40);

        // Create a new lecture record with an automatic expiration time and location data
        const lecture = new Lecture({ 
            instructor: instructorId, 
            course, 
            section, 
            group,
            date, 
            gpsLocation // Store GPS location in the database
        });

        // Generate the frontend URL with lecture ID and expiration time as query parameters
        const frontendURL = `https://qrattendancefy.netlify.app/qrcode/${lecture._id}&${date.toISOString()}`;

        // Generate a QR Code containing the frontend URL
        const qrCode = await qr.toDataURL(frontendURL);
        lecture.qrCode = qrCode;
         
        // Save the lecture to the database
        await lecture.save();

        res.status(201).json({ message: 'Lecture created successfully', lecture });
    } catch (error) {
        res.status(500).json({ message: 'Error creating lecture', error });
    }
};



//. Get attendance records for the instructor
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
                _id: record._id,
                studentName: record.studentName,
                department: record.department,
                group: record.group,
                gpsLocation: record.gpsLocation,
                deviceFingerprint: record.deviceFingerprint,
                timestamp: record.timestamp,
                __v: record.__v
            });
        });

        res.json(Object.values(groupedAttendance));
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        res.status(500).json({ message: 'Error fetching attendance records', error });
    }
};

// Get attendance records for a specific lecture
exports.getAttendanceByLectureID = async (req, res) => {
    try {
        const { lectureId } = req.params;  // Get the lecture ID from URL parameters

        // Check if the lecture exists
        const lecture = await Lecture.findOne({ _id: lectureId, instructor: req.user.id });
         
        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        // Fetch attendance records for the specific lecture
        const attendanceRecords = await Attendance.find({ lecture: lectureId })
            .populate('lecture', 'course section group date')
            .lean();

        // If no attendance records exist
        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: 'No attendance records found for this lecture' });
        }

        // Organize the records into a structured format
        const groupedAttendance = {
            lecture: attendanceRecords[0].lecture,  // The same lecture for all records
            students: attendanceRecords.map(record => ({
                _id: record._id,
                studentName: record.studentName,
                department: record.department,
                group: record.group,
                gpsLocation: record.gpsLocation,
                deviceFingerprint: record.deviceFingerprint,
                timestamp: record.timestamp,
                __v: record.__v
            }))
        };

        res.json(groupedAttendance);  // Return the attendance records
    } catch (error) {
        console.error("Error fetching attendance records:", error);
        res.status(500).json({ message: 'Error fetching attendance records', error });
    }
};


// Get all lectures for the instructor
exports.getAllLectures = async (req, res) => {
    try{
        const instructorId = req.user.id;
        const lectures = await Lecture.find({ instructor: instructorId }).select('course section date qrCode');
        res.json(lectures);
    }
    catch(error){
        console.error("Error fetching lectures:", error);
        res.status(500).json({ message: 'Error fetching lectures', error });
    }
};

// Export attendance records as an Excel file
exports.exportToExcel = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const lectures = await Lecture.find({ instructor: instructorId }).lean();
        const lectureIds = lectures.map(lecture => lecture._id);

        const attendanceRecords = await Attendance.find({ lecture: { $in: lectureIds } })
            .populate('lecture', 'course section date')
            .lean();

        const workbook = new ExcelJs.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Records');

        // Define worksheet columns (GPS and Device Fingerprint removed)
        worksheet.columns = [
            { header: 'Course', key: 'course', width: 20 },
            { header: 'Section', key: 'section', width: 15 },
            { header: 'Lecture Date', key: 'date', width: 20 },
            { header: 'Student Name', key: 'studentName', width: 20 },
            { header: 'Department', key: 'department', width: 15 },
            { header: 'Group', key: 'group', width: 15 },
            { header: 'Timestamp', key: 'time', width: 20 }
        ];

        let rowIndex = 2;
        let currentCourse = null;
        let startRow = null;

        attendanceRecords.forEach((record) => {
            const lecture = record.lecture;

            // Merge cells for same course
            if (lecture.course !== currentCourse) {
                if (currentCourse !== null && startRow !== null) {
                    worksheet.mergeCells(`A${startRow}:A${rowIndex - 1}`);
                }
                currentCourse = lecture.course;
                startRow = rowIndex;
            }

            // Add attendance data to worksheet
            worksheet.addRow({
                course: lecture.course,
                section: lecture.section,
                date: new Date(lecture.date).toLocaleString(),
                studentName: record.studentName,
                department: record.department,
                group: record.group,
                time: new Date(record.timestamp).toLocaleString()
            });

            rowIndex++;
        });

        // Merge the last course cells
        if (currentCourse !== null && startRow !== null) {
            worksheet.mergeCells(`A${startRow}:A${rowIndex - 1}`);
        }

        // Set headers and send the file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error exporting attendance:", error);
        res.status(500).json({ message: 'Error exporting attendance', error });
    }
};



exports.exportLectureToExcel = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const lectureId = req.params.lectureID;

        // Verify that the lecture belongs to the authenticated instructor
        const lecture = await Lecture.findOne({ _id: lectureId, instructor: instructorId }).lean();

        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found or not authorized' });
        }

        // Fetch attendance records for the selected lecture
        const attendanceRecords = await Attendance.find({ lecture: lectureId }).lean();

        const workbook = new ExcelJs.Workbook();
        const worksheet = workbook.addWorksheet('Attendance');

        // Define the worksheet columns (GPS and fingerprint removed)
        worksheet.columns = [
            { header: 'Course', key: 'course', width: 20 },
            { header: 'Section', key: 'section', width: 15 },
            { header: 'Lecture Date', key: 'date', width: 20 },
            { header: 'Student Name', key: 'studentName', width: 20 },
            { header: 'Department', key: 'department', width: 15 },
            { header: 'Group', key: 'group', width: 15 },
            { header: 'Timestamp', key: 'time', width: 20 }
        ];

        // Add attendance data to the worksheet
        attendanceRecords.forEach(record => {
            worksheet.addRow({
                course: lecture.course,
                section: lecture.section,
                date: new Date(lecture.date).toLocaleString(),
                studentName: record.studentName,
                department: record.department,
                group: record.group,
                time: new Date(record.timestamp).toLocaleString()
            });
        });

        // Generate a filename based on course, section, and group
        const fileName = `${lecture.course}_${lecture.section}_${lecture.group}.xlsx`.replace(/\s+/g, '_');

        // Set response headers to download the file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error exporting lecture attendance:", error);
        res.status(500).json({ message: 'Error exporting lecture attendance', error });
    }
};
