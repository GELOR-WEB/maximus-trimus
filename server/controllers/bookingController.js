// server/controllers/bookingController.js
const Booking = require("../models/Booking");
// 1. Import your notification utility (create this file in utils/ as shown in the previous step)
const { sendBookingNotification } = require("../utils/notifications");

const createBooking = async (req, res) => {
  try {
    const { clientName, contact, service, date, time } = req.body;

    const newBooking = new Booking({
      clientName,
      contact,
      service,
      date: new Date(`${date}T${time}:00`),
      time,
    });

    const booking = await newBooking.save();

    // 2. Trigger the notification to your device
    // We don't 'await' this so the user doesn't have to wait for the notification to send to get their success response
    sendBookingNotification({
      customerName: clientName,
      time: time,
      service: service
    }).catch(err => console.error("Notification failed:", err));

    res.status(201).json({
      message: "Booking successfully created!",
      booking: booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error.message);
    res.status(400).json({
      message: "Failed to create booking. Please check all required fields.",
      errors: error.errors
        ? Object.values(error.errors).map((err) => err.message)
        : ["Server error"],
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ date: 1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error.message);
    res.status(500).json({ message: "Server error while fetching bookings." });
  }
};

const updateBooking = (req, res) =>
  res.status(501).send({ message: "Not Implemented" });

const deleteBooking = (req, res) =>
  res.status(501).send({ message: "Not Implemented" });

module.exports = { createBooking, getBookings, updateBooking, deleteBooking };