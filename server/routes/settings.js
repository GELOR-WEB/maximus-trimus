const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const DayOff = require('../models/DayOff');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const { notifyBarberStatus, notifyGreetingChange } = require('../utils/notifications');

/**
 * Get the current hour in the given timezone.
 * Uses Intl.DateTimeFormat which is available in Node.js 12+.
 */
function getCurrentHourInTimezone(timezone) {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            hour12: false
        });
        return parseInt(formatter.format(now), 10);
    } catch (err) {
        // Fallback: return UTC hour if timezone is invalid
        console.error('Invalid timezone, falling back to UTC:', err.message);
        return new Date().getUTCHours();
    }
}

/**
 * Get today's date string (YYYY-MM-DD) in the given timezone.
 */
function getTodayInTimezone(timezone) {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        return formatter.format(now); // Returns YYYY-MM-DD format
    } catch (err) {
        // Fallback to UTC
        const now = new Date();
        return now.toISOString().split('T')[0];
    }
}

/**
 * Check if today is a full day off.
 */
async function isTodayFullDayOff(timezone) {
    const todayStr = getTodayInTimezone(timezone);
    const dayOff = await DayOff.findOne({ date: todayStr, isFullDay: true });
    return !!dayOff;
}

/**
 * Compute whether the shop should be open based on schedule.
 * Returns { isOpen, reason }
 */
async function computeScheduledStatus(settings) {
    const tz = settings.timezone || 'Asia/Manila';
    const currentHour = getCurrentHourInTimezone(tz);

    // Check if today is a full day off
    const isDayOff = await isTodayFullDayOff(tz);
    if (isDayOff) {
        return { isOpen: false, reason: 'day_off' };
    }

    // Check if current hour is within operating hours
    const isWithinHours = currentHour >= settings.startHour && currentHour < settings.endHour;

    if (isWithinHours) {
        return { isOpen: true, reason: 'within_hours' };
    } else {
        return { isOpen: false, reason: 'outside_hours' };
    }
}

// Get current settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }

        // Convert to plain object so we can modify the response
        const settingsObj = settings.toObject();

        // If auto-schedule is enabled, compute isShopOpen based on time
        if (settings.autoSchedule) {
            const scheduled = await computeScheduledStatus(settings);
            settingsObj.isShopOpen = scheduled.isOpen;
            settingsObj.autoScheduleReason = scheduled.reason;

            // Also update the DB value if it differs (so notifications fire correctly)
            if (settings.isShopOpen !== scheduled.isOpen) {
                settings.isShopOpen = scheduled.isOpen;
                await settings.save();
                // Fire notification for the status change
                notifyBarberStatus(scheduled.isOpen)
                    .catch(err => console.error("Auto-schedule notification failed:", err));
            }
        }

        res.json(settingsObj);
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
        if (req.body.autoSchedule !== undefined) settings.autoSchedule = req.body.autoSchedule;

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

        // If auto-schedule is on, return the computed status
        const responseObj = settings.toObject();
        if (settings.autoSchedule) {
            const scheduled = await computeScheduledStatus(settings);
            responseObj.isShopOpen = scheduled.isOpen;
            responseObj.autoScheduleReason = scheduled.reason;
        }

        res.json(responseObj);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;