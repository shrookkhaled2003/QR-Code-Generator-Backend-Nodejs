// middleware/validateData.js
const validateAttendanceData = (req, res, next) => {
    const { lecture, studentName, department } = req.body;
  
    if (!lecture) {
      return res.status(400).json({ message: "Lecture ID is required" });
    }
    if (!studentName) {
      return res.status(400).json({ message: "Student name is required" });
    }
    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }
  
    next();
  };
  
  module.exports = validateAttendanceData;
  