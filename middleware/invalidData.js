// Middleware for checking missing or incorrect data in request body
const validateInstructorData = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Missing required fields: name, email, or password" });
    }

    // Optional: Add more validation for email format and password strength
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    next();
};
// Middleware for validating login data
const validateLoginData = (req, res, next) => {
    const { email, password } = req.body;

    // Check if email or password are missing
    if (!email || !password) {
        return res.status(400).json({ message: "Missing required fields: email or password" });
    }

    // Optional: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    next();
};

module.exports = { validateLoginData,validateInstructorData };

