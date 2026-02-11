const { connectToDatabase } = require('./src/lib/db/connect');
const Order = require('./src/lib/db/models/order').default;

// Mock environment for connection if needed
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://user:pass@cluster.mongodb.net/test"; // Will rely on existing .env loading if run via next or with dotenv

async function findLatestOrder() {
    try {
        console.log("Connecting to DB...");
        // This might fail if run directly with node without loading .env
        // But let's assume user has .env or we check .env.local
        // For now, let's just create a quick check script that imports the app logic
        
        // Actually, easiest way is to use the debug scripts present in root
    } catch (e) {
        console.error(e);
    }
}
