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
    
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const cat of topCategories) {
        console.log(`🧠 Synthesizing AI background insights for ${cat.name} (Waiting 2s for token limits)...`);
        await sleep(2000); // 2 second breather for Groq limits
        
        // Unleashing the 8B LLM mapped exactly to the 5 heaviest hitters here!
        const aiData = await generateCategoryInsights(cat.name, cat.topProducts);
        
        const finalProducts = cat.topProducts.map(p => {
             const aiMatch = aiData.productClones?.find(c => c.name === p.name);
             return {
                 name: p.name,
                 tagline: p.tagline,
                 url: p.url,
                 votesCount: p.votesCount,
                 cloneStrategy: aiMatch?.cloneStrategy || "Deep dive details available dynamically via the top Search Bar."
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
