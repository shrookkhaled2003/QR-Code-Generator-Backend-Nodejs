const express = require('express');
const { registerInstructor, loginInstructor, createLecture, getAttendance } = require('../controller/instructorController.js');
const { verifyToken } = require('../middleware/auth.js');
const {validateInstructorData,validateLoginData} = require('../middleware/invalidData.js');

const router = express.Router();

router.post('/register', validateInstructorData, registerInstructor);
router.post('/login',validateLoginData, loginInstructor);
router.post('/create-lecture', verifyToken, createLecture);
router.get('/attendance', verifyToken, getAttendance);

module.exports = router;
