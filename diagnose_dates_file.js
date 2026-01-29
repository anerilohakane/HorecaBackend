const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

const Schema = mongoose.Schema;
const Subscription = mongoose.model('Subscription', new Schema({ 
    status: String, 
    nextOrderDate: Date,
    frequency: String,
    preferredTime: String,
    user: Schema.Types.ObjectId,
    product: Schema.Types.ObjectId
}, { strict: false }));

async function run() {
    let output = "";
    try {
        await mongoose.connect(MONGODB_URI);
        const now = new Date();
        
        output += `Check Time: ${now.toISOString()} (UTC)\n`;
        output += `Check Time: ${now.toString()} (Local)\n\n`;
        
        const subs = await Subscription.find({ status: 'Active' });
        output += `Found ${subs.length} Active Subscriptions.\n`;
        
        for (const s of subs) {
            output += `--------------------------------------------------\n`;
            output += `ID: ${s._id}\n`;
            output += `Freq: ${s.frequency} | PrefTime: ${s.preferredTime}\n`;
            
            const due = new Date(s.nextOrderDate);
            output += `NextOrderDate: ${due.toISOString()}\n`;
            
            if (due <= now) {
                const diffMins = ((now - due) / 60000).toFixed(2);
                output += `STATUS: ✅ DUE (Overdue by ${diffMins} mins)\n`;
            } else {
                const diffMins = ((due - now) / 60000).toFixed(2);
                output += `STATUS: ❌ NOT DUE (In Future by ${diffMins} mins)\n`;
            }
        }
        
    } catch (e) {
        output += `ERROR: ${e.message}\n`;
    } finally {
        await mongoose.disconnect();
        fs.writeFileSync(path.join(__dirname, 'diagnose_out.txt'), output);
        // Also force exit
        process.exit(0);
    }
}

run();
