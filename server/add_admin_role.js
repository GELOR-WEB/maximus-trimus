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

        // Use $addToSet to atomically add 'admin' without duplicates or serialization bugs
        const updated = await User.findOneAndUpdate(
            { email },
            { $addToSet: { role: 'admin' } },
            { new: true }
        );

        console.log(`Successfully updated role to:`, updated.role);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

addAdminRole();

