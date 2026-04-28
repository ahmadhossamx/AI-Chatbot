const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, index: true }, // Links to a guest ID or User ID
    role: { type: String, enum: ['user', 'model'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);