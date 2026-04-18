require('dotenv').config({path:'../.env'});
const Groq = require('groq-sdk');

async function test() {
    await require('./config/db')();
    const Tr = require('./models/Trend');
    const ts = await Tr.find();
    if(ts.length===0) return console.log("DB EMPTY");
    const all = ts.flatMap(t=>t.products);
    const chunk = all.slice(0, 150);
    const compactList = chunk.map((p) => `[ID:${p._id}] ${p.name}: ${p.tagline}`).join('\n');
    
    console.log("Chunk IDs sample:", chunk[0]._id.toString(), chunk[1]._id.toString());

    const prompt = `Find up to 5 products that are conceptually similar, operate in the same industry, or solve adjacent problems to this idea: "CSV SQL query format" from the following list. Be very loose and generous with your matching; if you don't find an exact clone, return products that are loosely related.
Return ONLY strict JSON array of their IDs, e.g.: ["ID_1", "ID_2"]
PRODUCTS:
${compactList}`;

    const groq = new Groq({ apiKey: process.env.groq_api_key });
    const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }], 
        model: "llama-3.1-8b-instant",
        temperature: 0.1
    });

    let jsonRaw = completion.choices[0]?.message?.content || "[]";
    console.log("RAW LLM OUTPUT:", jsonRaw);
    
    const rawMatch = jsonRaw.match(/\[[\s\S]*\]/);
    jsonRaw = rawMatch ? rawMatch[0] : jsonRaw.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        const ids = JSON.parse(jsonRaw);
        console.log("PARSED IDs:", ids);
        console.log("Are they arrays?", Array.isArray(ids));
        const matched = all.filter(p => ids.includes(p._id.toString()));
        console.log("Actual Filtered Match Count:", matched.length);
    } catch(e) {
        console.log("PARSE FAILED:", e.message);
    }
    process.exit(0);
}
test();
