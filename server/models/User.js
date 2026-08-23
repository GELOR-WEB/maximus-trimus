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

// Recursively extract plain string role values from any nested/stringified structure.
// This fixes corrupted data like ['[["admin", "client"]]'] → ['admin', 'client'].
function extractRoles(value) {
    const roles = [];
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (typeof parsed !== 'string') {
                roles.push(...extractRoles(parsed));
            } else {
                roles.push(parsed);
            }
        } catch {
            // Not valid JSON — plain role string like 'admin'
            roles.push(value);
        }
    } else if (Array.isArray(value)) {
        for (const item of value) {
            roles.push(...extractRoles(item));
        }
    }
    return roles;
}

function normalizeRoleArray(roles) {
    const extracted = extractRoles(roles);
    return [...new Set(extracted)].filter(r => ['admin', 'client'].includes(r));
}

// Pre-save hook: auto-fix any corrupted role data before writing to DB
userSchema.pre('save', function(next) {
    if (this.isModified('role') || this.isNew) {
        this.role = normalizeRoleArray(this.role);
    }
    next();
});

// Backward-compatible role checker: works with both old string and new array values
userSchema.methods.hasRole = function(roleName) {
    const roles = normalizeRoleArray(this.role);
    return roles.includes(roleName);
};

module.exports = mongoose.model('User', userSchema);