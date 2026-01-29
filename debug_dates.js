const mongoose = require('mongoose');

// --- CONFIG ---
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

// --- SCHEMA ---
const Schema = mongoose.Schema;
const Subscription = mongoose.model('Subscription', new Schema({ 
    user: Schema.Types.ObjectId, 
    status: String, 
    nextOrderDate: Date,
    preferredTime: String,
    frequency: String
}, { strict: false }));

async function checkDates() {
    try {
        console.log("🔌 Connecting...");
        await mongoose.connect(MONGODB_URI);

        const now = new Date();
        console.log(`\n==================================================`);
        console.log(` SERVER TIME CHECK`);
        console.log(`==================================================`);
        console.log(`1. new Date() (UTC ISO):  ${now.toISOString()}`);
        console.log(`2. new Date() (Local):    ${now.toString()}`);
        console.log(`3. Timestamp (ms):        ${now.getTime()}`);
        console.log(`==================================================\n`);

        const subs = await Subscription.find({ status: 'Active' });
        console.log(`Found ${subs.length} Active Subscriptions. Checking their times:\n`);

        subs.forEach(s => {
            const due = new Date(s.nextOrderDate);
            const diffMs = due.getTime() - now.getTime();
            const diffMins = (diffMs / 60000).toFixed(1);
            
            console.log(`Subscription ${s._id}`);
            console.log(`  Frequency:     ${s.frequency}`);
            console.log(`  PreferredTime: ${s.preferredTime} (Note: This is just metadata, nextOrderDate is truth)`);
            console.log(`  nextOrderDate: ${due.toISOString()} (UTC)`);
            
            if (due <= now) {
                console.log(`  STATUS: ✅ DUE! (Is in the past by ${Math.abs(diffMins)} mins)`);
            } else {
                console.log(`  STATUS: ❌ NOT DUE (In future by ${diffMins} mins)`);
            }
            console.log(`--------------------------------------------------`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkDates();
