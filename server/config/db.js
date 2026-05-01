const mongoose = require('mongoose');

const connectDB = async () => {
    // If already connected, don't try to connect again
    if (mongoose.connection.readyState >= 1) return;

    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;