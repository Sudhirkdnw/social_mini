const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

function connectDB() {
    mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 50,
        retryWrites: true,
        w: 'majority',
    })
    .then(() => {
        console.log('✅ MongoDB Atlas Connected');
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('   Check: 1) Atlas IP Whitelist  2) Cluster not paused  3) Correct URI');
        // Retry after 5 seconds instead of crashing the process
        console.log('🔄 Retrying MongoDB connection in 5s...');
        setTimeout(connectDB, 5000);
    });
}

module.exports = connectDB;