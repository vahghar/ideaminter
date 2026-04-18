require('dotenv').config({ path: '../.env' });
const fetch = require('node-fetch'); // wait node 18+ has fetch natively

async function getModels() {
    try {
        const key = process.env.groq_api_key;
        const res = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        const data = await res.json();
        const models = data.data.map(m => m.id);
        console.log("AVAILABLE GROQ MODELS:", models);
    } catch(e) {
        console.error(e);
    }
}
getModels();
