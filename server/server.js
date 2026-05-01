require("dotenv").config();

const express = require("express");
const connectDB = require('./config/db');

const cors = require("cors");

const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Routes
const bookingRoutes = require("./routes/bookings");
const authRoutes = require("./routes/auth");
const settingsRoutes = require("./routes/settings");

app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);



if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app; // Required for Vercel