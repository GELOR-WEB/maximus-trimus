require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Get credentials from arguments or use defaults
        const newUsername = process.argv[2] || 'admin';
        const newPassword = process.argv[3] || 'admin123';

        // Check for existing admin
        const adminUser = await User.findOne({ role: 'admin' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        if (adminUser) {
            adminUser.username = newUsername; // Update username too
            adminUser.password = hashedPassword;
            await adminUser.save();
            console.log(`Admin updated.`);
        } else {
            const newAdmin = new User({
                username: newUsername,
                password: hashedPassword,
                role: 'admin'
            });
            await newAdmin.save();
            console.log('New admin user created.');
        }

        console.log('-----------------------------------');
        console.log(`Admin set successfully!`);
        console.log(`Username: ${newUsername}`);
        console.log(`Password: ${newPassword}`);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmin();
