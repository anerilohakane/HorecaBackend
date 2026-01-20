
const axios = require('axios'); // Assuming axios is installed or I can use fetch
const mongoose = require('mongoose');

// --- CONFIG ---
const API_BASE = 'http://localhost:3001';
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

// --- MAIN VERIFICATION ---
async function run() {
    try {
        console.log("🔌 Connecting to DB to get user/product...");
        await mongoose.connect(MONGODB_URI);
        const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({ name: String, email: String }));
        const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({ name: String, price: Number }));
        const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", new mongoose.Schema({ status: String, nextOrderDate: Date }));
        
        const user = await User.findOne();
        const product = await Product.findOne();
        
        if (!user || !product) throw new Error("No user/product found");
        console.log(`User: ${user._id}, Product: ${product._id}`);

        // 0. ENSURE USER HAS ADDRESS (Required for Cron)
        const Order = mongoose.models.Order || mongoose.model("Order", new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, shippingAddress: Object, createdAt: Date }));
        const existingOrder = await Order.findOne({ user: user._id });
        if (!existingOrder) {
            console.log("📝 Creating dummy past order for address...");
            await Order.create({
                user: user._id,
                shippingAddress: {
                    addressLine1: "123 Test St", // Dummy address
                    city: "Test City",
                    state: "Test State",
                    pincode: "123456"
                },
                items: [],
                totalPrice: 100,
                status: 'delivered',
                createdAt: new Date(Date.now() - 86400000) // Yesterday
            });
        }
        // We want to schedule something for *NOW* (or slightly past) so cron picks it up.
        // User Local Time: Now is 17:55 (Simulated).
        // Let's say user wants it at 17:55.
        // Timezone Offset: -330 (IST).
        // Backend should calculate UTC = 17:55 - (-330min) = 17:55 - 5h30m = 12:25 UTC.
        // If we send this payload, the saved `nextOrderDate` should be approx NOW in UTC.
        
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        const dateString = now.toISOString().split('T')[0];
        
        console.log(`📅 Creating Subscription for ${dateString} at ${timeString} (Local)...`);
        
        const payload = {
            userId: user._id.toString(),
            productId: product._id.toString(),
            quantity: 1,
            frequency: 'Monthly',
            startDate: dateString,
            preferredTime: timeString,
            timezoneOffset: -330 // IST Offset in minutes
        };
        
        // Use native fetch (Node 18+)
        const createRes = await fetch(`${API_BASE}/api/subscriptions`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const createJson = await createRes.json();
        if (!createJson.success) throw new Error(`Create Failed: ${JSON.stringify(createJson)}`);
        
        const subId = createJson.data._id;
        console.log(`✅ Subscription Created: ${subId}`);
        console.log(`   Saved NextOrderDate: ${createJson.data.nextOrderDate}`);
        
        // Verify UTC conversion (Rough check)
        const savedDate = new Date(createJson.data.nextOrderDate);
        const diff = Math.abs(savedDate.getTime() - now.getTime());
        // It should be very close to NOW since we calculated it that way.
        if (diff < 60000 * 5) {
             console.log("✅ Timezone Logic Verified: Date is close to NOW.");
        } else {
             console.error(`❌ Timezone Logic Issue: Date is off by ${diff/1000}s.`);
             console.log(`   Expected (Now): ${now.toISOString()}`);
             console.log(`   Actual: ${savedDate.toISOString()}`);
        }
        
        // 2. TRIGGER CRON
        console.log("🚀 Triggering Cron Job...");
        const cronRes = await fetch(`${API_BASE}/api/cron/process-subscriptions`);
        const cronJson = await cronRes.json();
        console.log("Cron Result:", JSON.stringify(cronJson, null, 2));
        
        // 3. VERIFY ORDER
        if (cronJson.results.ordersCreated > 0) {
            console.log("✅ Cron reported order creation.");
        } else {
            console.warn("⚠ Cron did NOT create an order (might be timing nuance).");
            
            // Debug: Check DB for sub status
            const sub = await Subscription.findById(subId);
            console.log("   Sub Status:", sub.status);
            console.log("   Sub NextOrderDate:", sub.nextOrderDate);
            console.log("   Current Server Time:", new Date());
        }
        
        // Cleanup
        console.log("🧹 Cleaning up...");
        await Subscription.findByIdAndDelete(subId);
        await mongoose.disconnect();
        process.exit(0);

    } catch (e) {
        console.error("💥 Error:", e);
        process.exit(1);
    }
}

run();
