const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Get current settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update settings (Admin only - Protected)
router.put('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();

        if (req.body.isShopOpen !== undefined) settings.isShopOpen = req.body.isShopOpen;
        if (req.body.startHour) settings.startHour = req.body.startHour;
        if (req.body.endHour) settings.endHour = req.body.endHour;
        if (req.body.greetingMessage !== undefined) settings.greetingMessage = req.body.greetingMessage;

        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;