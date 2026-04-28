const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be encrypted
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);