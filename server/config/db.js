const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected...");
    } catch (err) {
        console.error("Connection error:", err.message);
        // Throwing the error helps Vercel logs show you exactly why it failed
        throw err;
    }
};

module.exports = connectDB;