const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Settings = require("../models/Settings");
const jwt = require('jsonwebtoken');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');

// 0. GET MY BOOKINGS (Protected - Client Specific)
router.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ date: -1, time: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Optional authentication middleware - doesn't block if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }
  } catch (err) {
    // Token invalid or expired - continue without user
    console.log('Optional auth failed:', err.message);
  }
  next();
};

// Helper: Check if time is valid (Business Hours)
const isTimeValid = (timeStr, start, end) => {
  const [hours] = timeStr.split(':').map(Number);
  return hours >= start && hours < end;
};

// 1. GET AVAILABILITY (New Endpoint for Frontend)
router.get("/check-date", async (req, res) => {
  try {
    const { date } = req.query;
    const bookings = await Booking.find({
      date: date,
      status: { $ne: 'Cancelled' }
    });

    // Return list of booked times for this date
    res.json(bookings.map(b => b.time));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. CREATE BOOKING (With Conflict Logic and Optional Authentication)
router.post("/", optionalAuth, async (req, res) => {
  try {
    let { date, time, contact, clientName, serviceType, location } = req.body;

    // If user is authenticated, use their profile data
    if (req.user && req.user.role === 'client') {
      clientName = req.user.fullName;
      contact = req.user.email || req.user.phone;
    }

    // Validate required fields
    if (!clientName || !contact) {
      return res.status(400).json({
        message: 'Client name and contact information are required'
      });
    }

    // A. Fetch Settings
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings(); // defaults

    // B. Check Business Hours (10 PM to 7 AM Restriction)
    if (!isTimeValid(time, settings.startHour, settings.endHour)) {
      return res.status(400).json({
        message: `We are closed at this time. Please book between ${settings.startHour}:00 and ${settings.endHour}:00.`
      });
    }

    // C. Check 1-Hour Overlap Rule
    // We convert the requested time to minutes
    const [reqH, reqM] = time.split(':').map(Number);
    const reqMinutes = reqH * 60 + reqM;

    const dayBookings = await Booking.find({ date: date, status: { $ne: 'Cancelled' } });

    const hasConflict = dayBookings.some(b => {
      const [bH, bM] = b.time.split(':').map(Number);
      const bMinutes = bH * 60 + bM;
      // If the difference is less than 60 minutes, it's a conflict
      return Math.abs(reqMinutes - bMinutes) < 60;
    });

    if (hasConflict) {
      return res.status(400).json({
        message: "This slot is too close to another appointment. Please choose a time at least 1 hour apart."
      });
    }

    // D. Save
    // Note: We trim/lowercase contact to ensure stats match "Previous email/phone"
    const cleanContact = contact.trim().toLowerCase();

    const bookingData = {
      clientName,
      contact: cleanContact,
      serviceType,
      location,
      date,
      time
    };

    // Add userId if user is authenticated
    if (req.user) {
      bookingData.userId = req.user._id;
    }

    const newBooking = new Booking(bookingData);

    await newBooking.save();
    res.status(201).json({ message: "Booking successful!", booking: newBooking });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. GET ALL BOOKINGS (Admin only - Protected)
router.get("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: -1, time: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. DASHBOARD STATISTICS (Admin only - Protected)
router.get("/stats", authenticateToken, isAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'Confirmed' });

    // A. Basic Counts
    const totalCutsAllTime = bookings.length;
    const currentYear = new Date().getFullYear();
    const totalCutsThisYear = bookings.filter(b => b.date.startsWith(currentYear)).length;

    // B. Busiest/Quiet Month
    const monthCounts = {};
    bookings.forEach(b => {
      const month = new Date(b.date).toLocaleString('default', { month: 'long' });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    let busiestMonth = 'N/A';
    let leastBusyMonth = 'N/A';
    let maxCount = -1;
    let minCount = Infinity;

    if (Object.keys(monthCounts).length > 0) {
      for (const [month, count] of Object.entries(monthCounts)) {
        if (count > maxCount) { maxCount = count; busiestMonth = month; }
        if (count < minCount) { minCount = count; leastBusyMonth = month; }
      }
    }

    // C. Client Habits (Frequency) - Grouped by Client Names
    // Group by Contact (Email or Phone) to track recurring clients
    const clientVisits = {};
    bookings.forEach(b => {
      const contact = b.contact; // Assumes contact is consistent
      const firstName = b.clientName ? b.clientName.split(' ')[0] : 'Unknown';
      if (!clientVisits[contact]) {
        clientVisits[contact] = { firstName, dates: [] };
      }
      clientVisits[contact].dates.push(new Date(b.date));
    });

    const frequentClients = []; // ≤14 days
    const regularClients = [];  // 15-60 days
    const rareClients = [];     // >60 days or one-time

    Object.values(clientVisits).forEach(client => {
      if (client.dates.length < 2) {
        rareClients.push(client.firstName);
        return;
      }
      // Sort dates
      client.dates.sort((a, b) => a - b);

      // Calculate average difference in days
      let totalDiff = 0;
      for (let i = 1; i < client.dates.length; i++) {
        const diffTime = Math.abs(client.dates[i] - client.dates[i - 1]);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDiff += diffDays;
      }
      const avgDays = totalDiff / (client.dates.length - 1);

      if (avgDays <= 14) frequentClients.push(client.firstName);
      else if (avgDays <= 60) regularClients.push(client.firstName);
      else rareClients.push(client.firstName);
    });

    res.json({
      totalCutsAllTime,
      totalCutsThisYear,
      busiestMonth,
      leastBusyMonth,
      clientFrequency: {
        frequent: frequentClients,
        regular: regularClients,
        rare: rareClients
      }
    });

  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 5. UPDATE BOOKING (Status or Reschedule - Admin only)
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, date, time } = req.body;
    const updateFields = {};
    if (status) updateFields.status = status;
    if (date) updateFields.date = date;
    if (time) updateFields.time = time;

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    res.json(updatedBooking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;