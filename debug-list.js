
const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", new mongoose.Schema({ 
            user: mongoose.Schema.Types.ObjectId,
            status: String, 
            nextOrderDate: Date, 
            preferredTime: String, 
            startDate: Date,
            frequency: String,
        }, { timestamps: true }));

        const subs = await Subscription.find().sort({ createdAt: -1 }).limit(5);

        const result = {
            now: new Date().toISOString(),
            subs: subs.map(s => ({
                id: s._id,
                user: s.user,
                created: s.createdAt,
                status: s.status,
                nextOrderDate: s.nextOrderDate,
                startDate: s.startDate,
                preferredTime: s.preferredTime,
                frequency: s.frequency,
                // Time from preferredTime
                pt: s.preferredTime
            }))
        };

        fs.writeFileSync('debug_list.json', JSON.stringify(result, null, 2));
        console.log("Written to debug_list.json");
        
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
        fs.writeFileSync('debug_list.json', JSON.stringify({ error: e.message }));
    }
}
run();
