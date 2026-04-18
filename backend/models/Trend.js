const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: String,
    tagline: String,
    url: String,
    votesCount: Number,
    cloneStrategy: String
});

const TrendSchema = new mongoose.Schema({
    category: { type: String, required: true },
    trendScore: { type: Number, default: 0 },
    products: [ProductSchema],
    insights: {
        categoryPivot: String,
    },
    createdAt: { type: Date, default: Date.now }
});

TrendSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Trend', TrendSchema);
