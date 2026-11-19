const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Link to user account (optional - allows anonymous bookings)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Fallback fields for anonymous bookings or display purposes
  clientName: { type: String, required: true },
  contact: { type: String, required: true },
  serviceType: { type: String, enum: ['Shop Service', 'Home Service'], required: true },
  location: { type: String }, // Only required if Home Service
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  // Payment info — populated when admin marks as Completed (Finished)
  amountPaid: { type: Number, default: null },
  paymentMethod: {
    type: String,
    enum: ['cash', 'e-money', null],
    default: null
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);