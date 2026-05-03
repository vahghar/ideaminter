const mongoose = require('mongoose');

const IdeaSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    originalThought: {
        type: String,
        required: true
    },
    aiAnalysis: {
        categoryPivot: String,
        products: [{
            name: String,
            tagline: String,
            url: String,
            cloneStrategy: String,
            source: String // 'hn', 'global', 'local'
        }]
    },
    status: {
        type: String,
        enum: ['draft', 'researching', 'building', 'launched'],
        default: 'draft'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Idea', IdeaSchema);
