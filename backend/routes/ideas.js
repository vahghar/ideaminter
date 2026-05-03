const express = require('express');
const router = express.Router();
const Idea = require('../models/Idea');
const { requireAuth } = require('../middleware/auth');

// Get all ideas for the logged-in user
router.get('/', requireAuth, async (req, res) => {
    try {
        const ideas = await Idea.find({ userId: req.auth.userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: ideas });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Save a new idea
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, originalThought, aiAnalysis } = req.body;
        
        if (!title || !originalThought) {
            return res.status(400).json({ success: false, error: 'Title and thought are required' });
        }

        const newIdea = new Idea({
            userId: req.auth.userId,
            title,
            originalThought,
            aiAnalysis,
            status: 'draft'
        });

        await newIdea.save();
        res.json({ success: true, data: newIdea });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Delete an idea
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const idea = await Idea.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
        if (!idea) return res.status(404).json({ success: false, error: 'Idea not found' });
        res.json({ success: true, msg: 'Idea deleted' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
