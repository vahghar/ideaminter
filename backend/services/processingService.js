const { fetchPosts } = require('./productHuntService');
const { generateCategoryInsights } = require('./aiService');
const Trend = require('../models/Trend');

const BIG_TECH = ['google', 'apple', 'microsoft', 'meta', 'facebook', 'amazon', 'netflix', 'openai', 'anthropic', 'claude', 'gemini', 'chatgpt', 'notion', 'figma', 'canva', 'stripe', 'vercel', 'adobe', 'x.com', 'twitter', 'salesforce'];

const isBigTech = (name, tagline) => {
    const text = (name + " " + tagline).toLowerCase();
    return BIG_TECH.some(company => text.includes(company) || text.includes(company.split('.')[0]));
};

const processTrends = async () => {
    console.log("📥 Fetching massive list of posts from Product Hunt...");
    const posts = await fetchPosts();
    
    // Sort all products by vote highest to lowest
    const sortedPosts = posts.sort((a,b) => b.votesCount - a.votesCount);
    
    const categoryMap = {};
    const assignedProducts = new Set(); // Prevent duplicates across categories!
    
    for (const post of sortedPosts) {
        if (isBigTech(post.name, post.tagline)) continue;
        
        if (!post.topics || !post.topics.edges || post.topics.edges.length === 0) continue;
        
        // Find the first valid topic and assign this product to it exclusively
        const primaryTopic = post.topics.edges[0].node.name;
        
        if (!assignedProducts.has(post.name)) {
            if (!categoryMap[primaryTopic]) {
                categoryMap[primaryTopic] = { products: [], totalVotes: 0 };
            }
            categoryMap[primaryTopic].products.push(post);
            categoryMap[primaryTopic].totalVotes += post.votesCount;
            assignedProducts.add(post.name);
        }
    }
    
    // Evaluate Categories
    const categories = Object.keys(categoryMap).map(name => {
        const cat = categoryMap[name];
        const score = cat.totalVotes + (cat.products.length * 20);
        return { name, score, topProducts: cat.products.slice(0, 40) }; // cap at 40 max per category to not overrun UI
    });

    const topCategories = categories.sort((a,b) => b.score - a.score).slice(0, 15);
    console.log(`🔥 Top 15 Indie Categories identified (uniquely parsed ${assignedProducts.size} products).`);
    
    for (const cat of topCategories) {
        console.log(`🧠 Skipping deep background sync for ${cat.name} to preserve 100k Token Limit for Search Engine!`);
        
        // Bypassing automated LLM calls specifically here so your rate limits aren't drained before you search
        const aiData = { 
            insights: { categoryPivot: "Trending Category." },
            productClones: [] 
        };
        
        const finalProducts = cat.topProducts.map(p => {
            return {
                name: p.name,
                tagline: p.tagline,
                url: p.url,
                votesCount: p.votesCount,
                cloneStrategy: "Deep dive details available dynamically via the top Search Bar."
            };
        });

        const trendEntry = new Trend({
            category: cat.name,
            trendScore: cat.score,
            products: finalProducts,
            insights: aiData?.insights || { categoryPivot: "Unavailable" }
        });
        
        await trendEntry.save();
    }
    
    console.log("✅ Sync job completely finished.");
};

module.exports = { processTrends };
