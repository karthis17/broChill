const mongoose = require('mongoose');

// Define a schema for user
const userSchema = new mongoose.Schema({
    // Common fields
    username: String,
    email: { type: String, unique: true },
    password: String,

    // Google OAuth fields
    googleId: String,

    // Apple OAuth fields
    appleId: String,

    // Avatar URL
    profile: String, // Assuming avatar is stored as a URL

    post: [{
        profile: String,
    }],

    // Additional fields based on your requirements
    displayName: String,
    // Add other fields as needed
});

// Create a model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
