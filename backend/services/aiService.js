const Groq = require('groq-sdk');

const STOPWORDS = new Set([
    'a','an','the','for','and','or','of','to','in','is','it','that','this','with',
    'as','by','on','at','be','are','was','were','but','not','from','i','my','we',
    'you','your','me','they','their','app','build','make','want','using','based',
    'platform','tool','product','service','startup','market','create','where','who',
    'can','has','have','its','into','just','like','get','use','new','via'
]);

const extractKeywords = (text) =>
    text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !STOPWORDS.has(w));  // min 4 chars to reduce noise

// Match whole words only — prevents "ai" matching "AIRRBridge", "market" matching "marketplace", etc.
const keywordMatchesText = (keywords, text) => {
    const normalized = text.toLowerCase();
    return keywords.some(kw => new RegExp(`\\b${kw}\\b`).test(normalized));
};

// ─── Category Insights (AI used for analysis/generation — appropriate) ────────
const generateCategoryInsights = async (category, products) => {
    const apiKey = process.env.groq_api_key;
    if (!apiKey) return { insights: { categoryPivot: "Unavailable" }, productClones: [] };
    const groq = new Groq({ apiKey });

    const top5 = products.slice(0, 5);
    const compactList = top5.map((p, i) => `[ID:${i}] ${p.name}: ${p.tagline}`).join('\n');
    
    const prompt = `You are a startup analyst. Analyze this category: "${category}".
Based on these top products:
${compactList}
Give a 1-sentence 'categoryPivot' strategy, and a 1-sentence 'cloneStrategy' explaining core mechanics for each product ID.
IMPORTANT: Use simple, plain English. Avoid complex startup jargon. Explain it like you are talking to a non-tech person.
Return ONLY strict JSON matching this structure:
{
  "categoryPivot": "String",
  "productClones": [ { "id": 0, "cloneStrategy": "String" } ]
}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }], 
            model: "llama-3.1-8b-instant",
            temperature: 0.1
        });
        
        let jsonRaw = completion.choices[0]?.message?.content || "{}";
        const rawMatch = jsonRaw.match(/\{[\s\S]*\}/);
        jsonRaw = rawMatch ? rawMatch[0] : jsonRaw.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const data = JSON.parse(jsonRaw);
        const productClones = data.productClones || [];
        const resultClones = top5.map((p, i) => {
            const match = productClones.find(c => c.id === i);
            return { name: p.name, cloneStrategy: match?.cloneStrategy || "Core mechanics handled dynamically." };
        });
        
        return {
            insights: { categoryPivot: data.categoryPivot || "Trending Custom Category" },
            productClones: resultClones
        };
    } catch (e) {
        console.error("Category AI generation failed:", e.message);
        return { insights: { categoryPivot: "Trend Analysis active" }, productClones: [] };
    }
};

// ─── Map Idea to Products ─────────────────────────────────────────────────────
const mapIdeaToProducts = async (idea, products) => {
    const apiKey = process.env.groq_api_key;
    if (!apiKey) return { localIds: [], globalProducts: [], hnProducts: [] };
    
    const groq = new Groq({ apiKey });
    const ideaKeywords = extractKeywords(idea);

    // ── 1. Local DB Matching (NO AI — deterministic keyword + vote rank) ──────
    // AI is not needed here: we already have structured data. Just keyword-match
    // against name/tagline and rank by votes. Fast, free, and accurate.
    /*
    const topProducts = products.sort((a, b) => b.votesCount - a.votesCount).slice(0, 200);

    const localMatches = ideaKeywords.length > 0
        ? topProducts
            .filter(p => keywordMatchesText(ideaKeywords, `${p.name} ${p.tagline}`))
            .slice(0, 5)
            .map(p => p._id.toString())
        : [];
    */
    const localMatches = [];

    // ── 2. Global Historic Knowledge (AI IS appropriate — generative retrieval) ─
    let globalProducts = [];
    try {
        const globalPrompt = `You are a product database. A user wants to build: "${idea}".
List 10 to 15 highly successful products (indie makers, YC startups, open source projects, or massive SaaS) that are very similar to or solve this exact problem.
Return strict JSON array:
[
  { "name": "Company Name", "tagline": "Short high level tagline.", "cloneStrategy": "Detailed explanation of the exact core features they built and how users interact with them." }
]
Only return a valid JSON array.`;
        
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: globalPrompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.4
        });
        let jsonRaw = completion.choices[0]?.message?.content || "[]";
        const rawMatch = jsonRaw.match(/\[[\s\S]*\]/);
        jsonRaw = rawMatch ? rawMatch[0] : jsonRaw.replace(/```json/g, '').replace(/```/g, '').trim();
        globalProducts = JSON.parse(jsonRaw);
    } catch (e) {
        console.error("Global search failed:", e.message);
    }
    
    // ── 3. HN Live Search (NO AI for keywords — reuse ideaKeywords we already have) ─
    // Previously wasted an entire Groq API call just to extract keywords.
    // We already have them from extractKeywords() above — just join and search.
    let hnProducts = [];
    try {
        const searchQuery = ideaKeywords.slice(0, 2).join(' ') || idea;
        const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(searchQuery)}&tags=show_hn`);
        const data = await res.json();
        hnProducts = (data.hits || []).map(hit => ({
            name: hit.title || "HN Startup",
            tagline: `Match from HackerNews for: "${searchQuery}"`,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            cloneStrategy: `This is a live internet scrape hitting HackerNews! Points: ${hit.points || 0}`
        })).slice(0, 7);
    } catch (e) {
        console.error("HackerNews Scrape failed:", e.message);
    }
    
    return { localIds: localMatches, globalProducts, hnProducts };
};

const generateAIIdeasFromTrends = async (trends, userIdeas = []) => {
    const apiKey = process.env.groq_api_key;
    if (!apiKey) return [];

    const groq = new Groq({ apiKey });
    
    const trendContext = trends.map(t => `${t.category}: ${t.products.slice(0, 3).map(p => p.name).join(', ')}`).join('\n');
    const userContext = userIdeas.length > 0 
        ? userIdeas.map(i => `- ${i.title}`).join('\n') 
        : "No specific ideas saved yet.";
    
    const prompt = `You are a visionary startup architect. 
Current Global Trends:
${trendContext}

User's Personal Interests/Drafts:
${userContext}

Task: Propose 3 "Hybrid Ideas" that combine current global market trends with the user's specific interests. 
If the user's list is empty, focus on "Unmet Gaps" in the trends.

IMPORTANT: Explain the ideas in very simple, plain English. Avoid corporate jargon or complex tech terms. Imagine you are explaining the idea to a friend who doesn't work in tech.

Return strict JSON array:
[
  { "title": "Simple Name", "thought": "The core problem and solution in 2 simple sentences.", "whyNow": "Why this is a good time to build it (simple explanation)." }
]`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            temperature: 0.7
        });
        
        let jsonRaw = completion.choices[0]?.message?.content || "[]";
        const rawMatch = jsonRaw.match(/\[[\s\S]*\]/);
        jsonRaw = rawMatch ? rawMatch[0] : jsonRaw.trim();
        return JSON.parse(jsonRaw);
    } catch (e) {
        console.error("Suggestion AI failed:", e.message);
        return [];
    }
};

module.exports = { generateCategoryInsights, mapIdeaToProducts, generateAIIdeasFromTrends };
