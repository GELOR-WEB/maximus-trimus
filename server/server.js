require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const bookingRoutes = require("./routes/bookings");
const authRoutes = require("./routes/auth");
const settingsRoutes = require("./routes/settings");

app.use("/api/bookings", bookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));