const path = require('path');
// To load parent .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startJob } = require('./jobs/syncJob');
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 API Server running on port ${PORT}`);
        startJob();
    });
});
