
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", new mongoose.Schema({ status: String, nextOrderDate: Date, preferredTime: String, startDate: Date }, { timestamps: true }));

        console.log("🔍 Fetching latest subscription...");
        const sub = await Subscription.findOne().sort({ createdAt: -1 });

        if (!sub) {
            console.log("❌ No subscriptions found.");
        } else {
            console.log("✅ Latest Subscription:");
            console.log("   ID:", sub._id);
            console.log("   Status:", sub.status);
            console.log("   Preferred Time:", sub.preferredTime);
            console.log("   NextOrderDate (DB):", sub.nextOrderDate.toISOString());
            
            const now = new Date();
            console.log("   Current Server Time:", now.toISOString());
            
            const diff = sub.nextOrderDate - now;
            console.log(`   Diff (ms): ${diff}`);
            console.log(`   Is Due? ${sub.nextOrderDate <= now}`);
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

run();
