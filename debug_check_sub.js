const mongoose = require('mongoose');

// --- CONFIG ---
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

const Schema = mongoose.Schema;
const Subscription = mongoose.model('Subscription', new Schema({ 
    user: Schema.Types.ObjectId, 
    product: Schema.Types.ObjectId, 
    status: String, 
    nextOrderDate: Date, 
    frequency: String,
    productName: String,
    failureReason: String,
    lastRunStatus: String
}, { strict: false }));

async function runTest() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const now = new Date();
        console.log(`[DEBUG] Server Time (UTC): ${now.toISOString()}`);
        console.log(`[DEBUG] Server Time (Local Approx): ${now.toString()}`);

        const subs = await Subscription.find({ status: 'Active' });
        
        console.log(`[DEBUG] Found ${subs.length} Active Subscriptions.`);
        
        subs.forEach(s => {
            const diff = s.nextOrderDate - now;
            const isDue = s.nextOrderDate <= now;
            console.log(`--------------------------------------------------`);
            console.log(`ID: ${s._id}`);
            console.log(`Product: ${s.productName}`);
            console.log(`NextOrderDate: ${s.nextOrderDate.toISOString()}`);
            console.log(`Is Due? ${isDue ? "YES ✅" : "NO ❌"} (Diff: ${diff/60000} mins)`);
            console.log(`Status: ${s.status} | Last Run: ${s.lastRunStatus || 'N/A'}`);
            if(s.failureReason) console.log(`Reason: ${s.failureReason}`);
        });

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
