const express = require('express');
const  recordAttendance = require('../controller/studentController.js');
const validateAttendanceData = require('../middleware/validator.js')
const router = express.Router();


router.post('/attendance', validateAttendanceData, recordAttendance);

module.exports = router;
