const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: String,
    firstName: String,
    lastName: String,
    profileImageUrl: String,
    lastLogin: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
