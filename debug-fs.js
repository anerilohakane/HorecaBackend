
const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", new mongoose.Schema({ 
            status: String, 
            nextOrderDate: Date, 
            preferredTime: String, 
            startDate: Date,
            frequency: String,
            user: mongoose.Schema.Types.ObjectId
        }, { timestamps: true }));

        const sub = await Subscription.findOne().sort({ createdAt: -1 });

        const result = {
            now: new Date().toISOString(),
            sub: sub ? {
                id: sub._id,
                status: sub.status,
                nextOrderDate: sub.nextOrderDate,
                startDate: sub.startDate,
                preferredTime: sub.preferredTime,
                frequency: sub.frequency,
                isDue: sub.nextOrderDate ? (sub.nextOrderDate <= new Date()) : false
            } : "No Subscription Found"
        };

        fs.writeFileSync('debug_result.json', JSON.stringify(result, null, 2));
        console.log("Written to debug_result.json");
        
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
        fs.writeFileSync('debug_result.json', JSON.stringify({ error: e.message }));
    }
}
run();
