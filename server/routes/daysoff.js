const express = require('express');
const router = express.Router();
const DayOff = require('../models/DayOff');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// GET days off for a specific month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query; // format: YYYY-MM
    let query = {};
    if (month) {
      query.date = { $regex: `^${month}` };
    }
    const daysOff = await DayOff.find(query).sort({ date: 1 });
    res.json(daysOff);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a day off (Admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { date, note, isFullDay, startTime, endTime } = req.body;
    
    // Check if a day off already exists for this exact date
    // If it's a full day, maybe we don't allow duplicates, but let's keep it simple
    // For now we just create
    
    const dayOff = new DayOff({
      date,
      note,
      isFullDay: isFullDay !== undefined ? isFullDay : true,
      startTime,
      endTime
    });
    
    await dayOff.save();
    res.status(201).json(dayOff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST create days off for MULTIPLE dates at once (Admin only)
router.post('/batch', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { dates, note, isFullDay, startTime, endTime } = req.body;
    
    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of dates.' });
    }

    const created = [];
    for (const date of dates) {
      const dayOff = new DayOff({
        date,
        note: note || '',
        isFullDay: isFullDay !== undefined ? isFullDay : true,
        startTime: isFullDay ? undefined : startTime,
        endTime: isFullDay ? undefined : endTime
      });
      await dayOff.save();
      created.push(dayOff);
    }
    
    res.status(201).json({ message: `${created.length} day(s) off created.`, daysOff: created });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a day off (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const dayOff = await DayOff.findByIdAndDelete(req.params.id);
    if (!dayOff) {
      return res.status(404).json({ message: "Day off not found" });
    }
    res.json({ message: "Day off removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
