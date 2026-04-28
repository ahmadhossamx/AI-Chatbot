const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const Message = require('../models/Message');
const router = express.Router();

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/', async (req, res) => {
    try {
        const { text, sessionId } = req.body;

        // 1. Fetch conversation history BEFORE saving new message
        const history = await Message.find({ sessionId }).sort({ createdAt: 1 });

        // 2. Save user message
        await Message.create({ sessionId, role: 'user', text });

        // 3. Build Gemini-compatible contents array from history + new message
        const contents = [
            ...history.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            })),
            { role: 'user', parts: [{ text }] }
        ];

        // 4. Fetch from Gemini with full conversation context
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
        });
        
        const aiText = response.text;

        // 5. Save AI response
        await Message.create({ sessionId, role: 'model', text: aiText });

        res.json({ reply: aiText });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

module.exports = router;