const cron = require('node-cron');
const { processTrends } = require('../services/processingService');

// Run once every day at midnight
const startJob = () => {
    // Disabled the immediate on-boot processTrends() call to optimize and conserve 
    // your ProductHunt Rate Limits while iterating via nodemon hot reloads!

    cron.schedule('0 0 * * *', async () => {
        console.log(`\n⏰ Running automated trend sync: ${new Date().toISOString()}`);
        try {
            await processTrends();
        } catch (e) {
            console.error("Cron Job Error:", e);
        }
    });
    console.log("🕒 Cron Job Initialized (runs every 6h)");
};

module.exports = { startJob };
