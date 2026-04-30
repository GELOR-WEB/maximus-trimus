// server/controllers/bookingController.js (Placeholder)
const Booking = require("../models/Booking");
const createBooking = async (req, res) => {
  try {
    // Data destructured from the frontend request body
    const { clientName, contact, service, date, time } = req.body;

    const newBooking = new Booking({
      clientName,
      contact,
      service,
      // 🎯 CRITICAL: Combine date and time to store as a single Date object for proper sorting/comparison
      date: new Date(`${date}T${time}:00`),
      time, // Store the time string separately as well
    });

    // Save the booking to MongoDB
    const booking = await newBooking.save();

    res.status(201).json({
      message: "Booking successfully created!",
      booking: booking,
    });
  } catch (error) {
    // Handle validation errors (e.g., missing required fields)
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
    // Find all bookings and sort them by the date field (ascending order)
    const bookings = await Booking.find().sort({ date: 1 });

    // Send the found bookings as a JSON array
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error.message);
    // If the database query fails, return a 500 server error
    res.status(500).json({ message: "Server error while fetching bookings." });
  }
};
const updateBooking = (req, res) =>
  res.status(501).send({ message: "Not Implemented" });
const deleteBooking = (req, res) =>
  res.status(501).send({ message: "Not Implemented" });
module.exports = { createBooking, getBookings, updateBooking, deleteBooking };
