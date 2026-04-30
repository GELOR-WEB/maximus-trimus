require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if admin already exists
        const existing = await User.findOne({ username: 'el barbero' });
        if (existing) {
            console.log('Admin user "el barbero" already exists. Deleting and re-creating...');
            await User.deleteOne({ username: 'el barbero' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('maximustrimus08', salt);

        const admin = new User({
            username: 'el barbero',
            password: hashedPassword,
            role: 'admin'
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log('  Username: el barbero');
        console.log('  Role: admin');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    }
};

seedAdmin();
