require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const addAdminRole = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'axeryllelozano@gmail.com';
        
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        console.log(`Found user: ${user.email}`);
        console.log(`Current role:`, user.role);

        // Convert to array if it's a string, and add 'admin' if not present
        let currentRoles = Array.isArray(user.role) ? user.role : [user.role];
        
        if (!currentRoles.includes('admin')) {
            currentRoles.push('admin');
        }

        user.role = currentRoles;
        await user.save();

        console.log(`Successfully updated role to:`, user.role);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

addAdminRole();
