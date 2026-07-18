const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be hashed
    role: {
        type: [String],
        enum: ['admin', 'client'],
        default: ['client'],
        required: true
    },
    // Client-specific fields
    email: {
        type: String,
        sparse: true, // Allows null but unique when present
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: { type: String },
    fullName: { type: String }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Backward-compatible role checker: works with both old string and new array values
userSchema.methods.hasRole = function(roleName) {
    if (Array.isArray(this.role)) {
        return this.role.includes(roleName);
    }
    return this.role === roleName;
};

module.exports = mongoose.model('User', userSchema);