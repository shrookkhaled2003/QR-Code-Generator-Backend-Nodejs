const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./db/dbConnection.js');
const instructorRoutes = require('./routes/instructor.route.js');
const studentRoutes = require('./routes/student.route.js');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Define routes
app.use('/api/instructors', instructorRoutes);
app.use('/api/students', studentRoutes);
 app.get('/', (req, res) => {
    res.send('Hello, World!');  // Replace with your own welcome message
 })

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
