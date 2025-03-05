const express = require('express');
const  recordAttendance = require('../controller/studentController.js');
const validateAttendanceData = require('../middleware/validator.js');
const checkLocation = require('../middleware/checkLocation.js');
const router = express.Router();


router.post('/attendance', validateAttendanceData,checkLocation, recordAttendance);

module.exports = router;
