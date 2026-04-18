const Groq = require('groq-sdk');

const generateCategoryInsights = async (category, products) => {
    // Disabled during background sync due to 100k token limits.
    return { insights: {}, productClones: [] };
};

const fetchHackerNewsClones = async (idea, groq) => {
    try {
        const keywordPrompt = `Extract exactly 1 or 2 highly targeted search engine SEO keywords for this startup idea. 
Idea: "${idea}"
Return ONLY the raw keywords as a single lowercase string, nothing else. Example: "analytics dashboard"`;
        
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: keywordPrompt }], 
            model: "llama-3.1-8b-instant", 
            temperature: 0.1
        });
        
        const keywords = completion.choices[0]?.message?.content?.replace(/["']/g, '').trim() || "startup tools";
        
        const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(keywords)}&tags=show_hn`);
        const data = await res.json();
        
        return (data.hits || []).map(hit => ({
            name: hit.title || "HN Startup",
            tagline: `Match from HackerNews for: "${keywords}"`,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            cloneStrategy: `This is a live internet scrape hitting HackerNews! Points: ${hit.points || 0}`
        })).slice(0, 7);
    } catch(e) {
        console.error("HackerNews Scrape failed:", e.message);
        return [];
    }
};

const mapIdeaToProducts = async (idea, products) => {
    const apiKey = process.env.groq_api_key;
    if (!apiKey) return { localIds: [], globalProducts: [], hnProducts: [] };
    
    const groq = new Groq({ apiKey });

    // 1. Local Database Matcher (Top 100 Only to fit 6k TPM Limit)
    // We trim the 900+ database items down to the most highly upvoted 100 products to save context window tokens
    const topProducts = products.sort((a,b) => b.votesCount - a.votesCount).slice(0, 100);
    const matchedIds = [];
    
    const compactList = topProducts.map((p) => `[ID:${p._id}] ${p.name}: ${p.tagline}`).join('\n');
    const prompt = `Find up to 5 products that are conceptually similar, operate in the same industry, or solve adjacent problems to this idea: "${idea}" from the following list. Be very loose and generous with your matching; if you don't find an exact clone, return products that are loosely related.
Return ONLY strict JSON array of their IDs, e.g.: ["ID_1", "ID_2"]
PRODUCTS:
${compactList}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }], 
            model: "llama-3.1-8b-instant",  // 6000 TPM limit safe
            temperature: 0.1
        });
        let jsonRaw = completion.choices[0]?.message?.content || "[]";
        const rawMatch = jsonRaw.match(/\[[\s\S]*\]/);
        jsonRaw = rawMatch ? rawMatch[0] : jsonRaw.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const ids = JSON.parse(jsonRaw);
        if (Array.isArray(ids)) { matchedIds.push(...ids); }
    } catch (e) {
        console.error("Local matching failed:", e.message);
    }
    
    // 2. Global Historic Knowledge Search
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
               model: "llama-3.1-8b-instant",  // Restoring 70B for high quality Idea mapping! 
               temperature: 0.4
        });
        let jsonRaw = completion.choices[0]?.message?.content || "[]";
        const rawMatch = jsonRaw.match(/\[[\s\S]*\]/);
        jsonRaw = rawMatch ? rawMatch[0] : jsonRaw.replace(/```json/g, '').replace(/```/g, '').trim();
        
        globalProducts = JSON.parse(jsonRaw);
    } catch (e) {
        console.error("Global search failed:", e.message);
    }
    
    // 3. Live Search via HN Algolia 
    const hnProducts = await fetchHackerNewsClones(idea, groq);
    
    return { localIds: matchedIds, globalProducts, hnProducts };
};

module.exports = { generateCategoryInsights, mapIdeaToProducts };
