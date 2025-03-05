const Lecture = require('../models/lecture.model.js');

const checkLocation = async (req, res, next) => {
    try {
        const { lecture, gpsLocation } = req.body;

        // Ensure GPS location data is provided
        if (!gpsLocation || !gpsLocation.latitude || !gpsLocation.longitude) {
            return res.status(400).json({ message: 'GPS location is required' });
        }

        // Retrieve lecture details from the database
        const lectureData = await Lecture.findById(lecture);
        if (!lectureData || !lectureData.gpsLocation) {
            return res.status(404).json({ message: 'Lecture location not found' });
        }

        // Extract coordinates from the database
        const lectureLat = lectureData.gpsLocation.latitude;
        const lectureLon = lectureData.gpsLocation.longitude;
        const studentLat = gpsLocation.latitude;
        const studentLon = gpsLocation.longitude;

        // Function to calculate distance between two coordinates using Haversine formula
        const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
            const R = 6371000; // Earth's radius in meters
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const distance = getDistanceFromLatLonInMeters(lectureLat, lectureLon, studentLat, studentLon);

        // Define the allowed distance range (e.g., 50 meters)
        const maxDistance = 50;

        if (distance > maxDistance) {
            return res.status(400).json({ message: 'You are too far from the lecture location to register attendance' });
        }

        // If the student is within the allowed range, proceed to the next middleware
        next();
    } catch (error) {
        console.error('Error checking location:', error);
        res.status(500).json({ message: 'Error verifying location', error });
    }
};

module.exports = checkLocation;
