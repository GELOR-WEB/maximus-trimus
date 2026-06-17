const mongoose = require('mongoose');

const DayOffSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  note: {
    type: String,
    default: '',
  },
  isFullDay: {
    type: Boolean,
    default: true,
  },
  startTime: {
    type: String, // Format: HH:MM (e.g., "10:00")
    required: function() { return !this.isFullDay; }
  },
  endTime: {
    type: String, // Format: HH:MM (e.g., "14:00")
    required: function() { return !this.isFullDay; }
  }
}, { timestamps: true });

module.exports = mongoose.model('DayOff', DayOffSchema);
