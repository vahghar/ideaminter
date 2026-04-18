require('dotenv').config({ path: '../.env' });
const connectDB = require('./config/db');
const Trend = require('./models/Trend');

connectDB().then(async () => {
    await Trend.deleteMany({});
    console.log("✅ Wiped old database tracking info.");
    
    // Trigger sync immediately via fetch from localhost
    try {
        await fetch('http://localhost:4000/api/trigger-sync', { method: 'POST' });
        console.log("✅ Triggered fresh background data sync!");
    } catch(e) {
        console.log("Failed to trigger sync, you may need to start backend:", e.message);
    }
    
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});
