
const mongoose = require('mongoose');
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

        console.log("🔍 Fetching latest subscription...");
        const sub = await Subscription.findOne().sort({ createdAt: -1 });

        if (sub) {
            console.log("--------------------------------------------------");
            console.log("ID:           ", sub._id);
            console.log("Created At:   ", sub.createdAt); // Auto field
            console.log("Start Date:   ", sub.startDate);
            console.log("Pref Time:    ", sub.preferredTime);
            console.log("Frequency:    ", sub.frequency);
            console.log("NextOrderDate:", sub.nextOrderDate.toISOString());
            console.log("System Now:   ", new Date().toISOString());
            console.log("--------------------------------------------------");
        }
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
run();
