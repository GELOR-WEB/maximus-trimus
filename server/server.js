require("dotenv").config();

const express = require("express");
const connectDB = require('./config/db');

const cors = require("cors");

const app = express();

connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "https://maximus-trimus.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (uniqueOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());

// Routes
const bookingRoutes = require("./routes/bookings");
const authRoutes = require("./routes/auth");
const settingsRoutes = require("./routes/settings");
const reviewRoutes = require("./routes/reviews");

app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reviews", reviewRoutes);



if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app; // Required for Vercel