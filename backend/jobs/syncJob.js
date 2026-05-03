const cron = require('node-cron');
const { processTrends } = require('../services/processingService');
const Trend = require('../models/Trend');

// Run once every day at midnight
const startJob = async () => {
    // Disabled the immediate on-boot processTrends() call to optimize and conserve 
    // your ProductHunt Rate Limits while iterating via nodemon hot reloads!
    // However, we check if the DB is empty. If it is, run an initial sync so the UI isn't blank.
    try {
        const recentDate = new Date(Date.now() - 48*60*60*1000);
        const count = await Trend.countDocuments({ createdAt: { $gte: recentDate } });
        if (count === 0) {
            console.log("\n⚠️ No recent trends found! Running initial trend sync in the background...");
            processTrends(); // run async
        }
    } catch (e) {
        console.error("Failed to check DB on startup:", e);
    }

    cron.schedule('0 0 * * *', async () => {
        console.log(`\n⏰ Running automated trend sync: ${new Date().toISOString()}`);
        try {
            await processTrends();
        } catch (e) {
            console.error("Cron Job Error:", e);
        }
    });
    console.log("🕒 Cron Job Initialized (runs once daily at midnight)");
};

module.exports = { startJob };
