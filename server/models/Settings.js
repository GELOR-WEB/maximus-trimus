const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    isShopOpen: { type: Boolean, default: true },
    startHour: { type: Number, default: 7 }, // 7 AM
    endHour: { type: Number, default: 22 },   // 10 PM
    greetingMessage: { type: String, default: 'how do you want your hair done?' },
    autoSchedule: { type: Boolean, default: true }, // Auto toggle online/offline based on hours
    timezone: { type: String, default: 'Asia/Manila' } // Timezone for schedule calculation
});

module.exports = mongoose.model('Settings', settingsSchema);