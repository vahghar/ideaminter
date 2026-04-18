const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.mongo_db_uri;
        if (!uri) throw new Error("mongo_db_uri not found in env");
        await mongoose.connect(uri);
        console.log("🔥 MongoDB Connected!");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
