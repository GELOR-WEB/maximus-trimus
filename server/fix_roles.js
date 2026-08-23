/**
 * One-time script to fix corrupted role data in the database.
 * 
 * The bug: roles were stored as deeply nested stringified arrays like
 * ['[["admin", "client"]]'] instead of ['admin', 'client'].
 * 
 * Usage: node fix_roles.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Recursively extract all plain string role values from any nested structure
function extractRoles(value) {
    const roles = [];
    if (typeof value === 'string') {
        // Try to parse as JSON first
        try {
            const parsed = JSON.parse(value);
            // If it parsed into something non-string, recurse into it
            if (typeof parsed !== 'string') {
                roles.push(...extractRoles(parsed));
            } else {
                // It's a JSON string that parsed to a plain string
                roles.push(parsed);
            }
        } catch {
            // Not valid JSON — it's a plain role string like 'admin'
            roles.push(value);
        }
    } else if (Array.isArray(value)) {
        for (const item of value) {
            roles.push(...extractRoles(item));
        }
    }
    return roles;
}

const VALID_ROLES = ['admin', 'client'];

const fixRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Get raw collection to bypass Mongoose schema validation
        const usersCollection = mongoose.connection.collection('users');
        const users = await usersCollection.find({}).toArray();

        let fixedCount = 0;

        for (const user of users) {
            if (!user.role) continue;

            const extracted = extractRoles(user.role);
            const cleaned = [...new Set(extracted)].filter(r => VALID_ROLES.includes(r));

            // Check if the role needs fixing
            const currentJson = JSON.stringify(user.role);
            const cleanedJson = JSON.stringify(cleaned);

            if (currentJson !== cleanedJson) {
                console.log(`\nFixing user: ${user.email || user.username}`);
                console.log(`  Before: ${currentJson}`);
                console.log(`  After:  ${cleanedJson}`);

                await usersCollection.updateOne(
                    { _id: user._id },
                    { $set: { role: cleaned } }
                );
                fixedCount++;
            }
        }

        console.log(`\n✅ Done. Fixed ${fixedCount} user(s).`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixRoles();
