const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');

// Rate limiter for login: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for registration: max 5 accounts per hour per IP
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { message: 'Too many accounts created. Please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Client Registration Route
router.post('/register', registerLimiter, async (req, res) => {
    const { email, password, fullName, phone } = req.body;

    try {
        // Validate required fields
        if (!email || !password || !fullName) {
            return res.status(400).json({ message: 'Email, password, and full name are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new client user
        const newUser = new User({
            username: email, // Use email as username for clients
            email,
            password: hashedPassword,
            fullName,
            phone,
            role: 'client'
        });

        await newUser.save();

        // Generate token (24 hours for clients)
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Return token and user data (without password)
        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                fullName: newUser.fullName,
                phone: newUser.phone,
                role: newUser.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login Route (works for both admin and client)
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // Allow login with either username or email
        const user = await User.findOne({
            $or: [
                { username: username || email },
                { email: email || username }
            ]
        });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Token expiry based on role
        const expiresIn = user.role === 'admin' ? '1h' : '24h';
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn });

        // Return user data based on role
        const userData = {
            id: user._id,
            username: user.username,
            role: user.role
        };

        // Include profile data for clients
        if (user.role === 'client') {
            userData.email = user.email;
            userData.fullName = user.fullName;
            userData.phone = user.phone;
        }

        res.json({ token, user: userData });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Current User Profile (Protected)
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            fullName: req.user.fullName,
            phone: req.user.phone,
            role: req.user.role
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User Profile (Protected - Clients only)
router.put('/profile', authenticateToken, async (req, res) => {
    const { fullName, email, phone } = req.body;

    try {
        // Only allow clients to update their profile
        if (req.user.role !== 'client') {
            return res.status(403).json({ message: 'Only clients can update profiles this way' });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                fullName: fullName || req.user.fullName,
                email: email || req.user.email,
                phone: phone || req.user.phone,
                username: email || req.user.email // Keep username synced with email
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                phone: updatedUser.phone,
                role: updatedUser.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;