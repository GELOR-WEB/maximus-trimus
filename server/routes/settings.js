const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const { notifyBarberStatus, notifyGreetingChange } = require('../utils/notifications');

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

        // Track previous values to detect changes
        const prevIsShopOpen = settings.isShopOpen;
        const prevGreeting = settings.greetingMessage;

        if (req.body.isShopOpen !== undefined) settings.isShopOpen = req.body.isShopOpen;
        if (req.body.startHour) settings.startHour = req.body.startHour;
        if (req.body.endHour) settings.endHour = req.body.endHour;
        if (req.body.greetingMessage !== undefined) settings.greetingMessage = req.body.greetingMessage;

        await settings.save();

        // Send push notifications for changes (fire-and-forget)
        if (req.body.isShopOpen !== undefined && req.body.isShopOpen !== prevIsShopOpen) {
            notifyBarberStatus(settings.isShopOpen)
                .catch(err => console.error("Barber status notification failed:", err));
        }

        if (req.body.greetingMessage !== undefined && req.body.greetingMessage !== prevGreeting) {
            notifyGreetingChange(settings.greetingMessage)
                .catch(err => console.error("Greeting notification failed:", err));
        }

        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;