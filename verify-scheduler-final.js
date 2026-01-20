
const mongoose = require('mongoose');

// --- CONFIG ---
const API_BASE = 'http://localhost:3001';
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        console.log("🔌 Connecting to DB...");
        await mongoose.connect(MONGODB_URI);
        const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({ name: String, email: String }));
        const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({ name: String, price: Number }));
        const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", new mongoose.Schema({ status: String, nextOrderDate: Date }));
        const Order = mongoose.models.Order || mongoose.model("Order", new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, shippingAddress: Object, createdAt: Date }));

        const user = await User.findOne();
        const product = await Product.findOne();
        
        if (!user || !product) throw new Error("No user/product found");
        console.log(`User: ${user._id}`);

        // 0. Ensure Address
        const existingOrder = await Order.findOne({ user: user._id });
        if (!existingOrder) {
            console.log("📝 Creating dummy past order for address...");
            await Order.create({
                user: user._id,
                shippingAddress: { addressLine1: "123 Test St", city: "Test City", state: "Test State", pincode: "123456" },
                items: [], totalPrice: 100, status: 'delivered', createdAt: new Date(Date.now() - 86400000)
            });
        }

        // 1. Setup Dates for NOW (IST friendly)
        const now = new Date();
        // Add 2 minutes to "now" just to be safe it's "future" when strictly creating, 
        // but for Cron we want it to be "past or equal".
        // Actually, if we set subscription time to 5 mins AGO, it should be due.
        const past = new Date(now.getTime() - 5 * 60000); 
        
        // We want to pass a "preferredTime" that matches "past" in user's local time (IST)
        // IST is UTC+5:30.
        // So User Local Time = UTC + 330m.
        const userLocalTime = new Date(past.getTime() + (330 * 60000));
        
        const hours = userLocalTime.getUTCHours().toString().padStart(2, '0');
        const minutes = userLocalTime.getUTCMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        const dateString = userLocalTime.toISOString().split('T')[0];

        console.log(`📅 Creating Subscription due at ${dateString} ${timeString} (IST)...`);

        const payload = {
            userId: user._id.toString(),
            productId: product._id.toString(),
            quantity: 1,
            frequency: 'Monthly',
            startDate: dateString,
            preferredTime: timeString,
            timezoneOffset: -330 // IST
        };

        const createRes = await fetch(`${API_BASE}/api/subscriptions`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const createJson = await createRes.json();
        if (!createJson.success) throw new Error(JSON.stringify(createJson));
        
        const subId = createJson.data._id;
        console.log(`✅ Subscription Created: ${subId}`);
        const nextDate = new Date(createJson.data.nextOrderDate);
        console.log(`   Scheduled UTC: ${nextDate.toISOString()}`);
        
        // Validate it's in the past (Due)
        if (nextDate <= new Date()) {
            console.log("   Status: DUE (Correct)");
        } else {
            console.log("   Status: FUTURE (Wait, why? Did we calculate wrong?)");
            // If we sent "5 mins ago" in IST, the server UTC calculation should result in "5 mins ago" UTC.
        }

        // 2. Run Cron
        console.log("🚀 Triggering Cron...");
        const cronRes = await fetch(`${API_BASE}/api/cron/process-subscriptions`);
        const cronJson = await cronRes.json();
        console.log("   Cron Result:", JSON.stringify(cronJson.results));

        if (cronJson.results.ordersCreated > 0) {
            console.log("✅ SUCCESS: Order created automatically.");
        } else {
            console.error("❌ FAILURE: No order created.");
        }

        // Cleanup
        await Subscription.findByIdAndDelete(subId);
        await mongoose.disconnect();
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
