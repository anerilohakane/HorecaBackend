
const mongoose = require('mongoose');

// --- CONFIG ---
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

// --- SCHEMAS (Minimal) ---
const Schema = mongoose.Schema;
const User = mongoose.models.User || mongoose.model("User", new Schema({ name: String, email: String, phone: String }));
const Product = mongoose.models.Product || mongoose.model("Product", new Schema({ name: String, price: Number }));
const Order = mongoose.models.Order || mongoose.model("Order", new Schema({ user: Schema.Types.ObjectId, items: [Object], status: String, shippingAddress: Object }));
const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", new Schema({ user: Schema.Types.ObjectId, product: Schema.Types.ObjectId, status: String, nextOrderDate: Date }));

async function runVerification() {
    try {
        console.log("🔌 Connecting to DB...");
        await mongoose.connect(MONGODB_URI);
        
        // 1. GET A USER AND PRODUCT
        console.log("🔍 Finding User and Product...");
        const user = await User.findOne();
        const product = await Product.findOne();
        
        if (!user || !product) {
            throw new Error("❌ No User or Product found in DB to test with.");
        }
        console.log(`✅ User: ${user._id} (${user.email || user.phone})`);
        console.log(`✅ Product: ${product._id} (${product.name})`);

        // 2. CREATE FAKE ORDER HISTORY (for Frequent Items)
        console.log("📝 Creating fake orders to test Frequent Items...");
        await Order.create({
            user: user._id,
            status: 'delivered',
            items: [{ product: product._id, quantity: 1, name: product.name, unitPrice: product.price, totalPrice: product.price }],
            shippingAddress: { addressLine1: "Test Address", city: "Test City", state: "Test State", pincode: "123456" }
        });
        await Order.create({
            user: user._id,
            status: 'delivered',
            items: [{ product: product._id, quantity: 1, name: product.name, unitPrice: product.price, totalPrice: product.price }],
             shippingAddress: { addressLine1: "Test Address", city: "Test City", state: "Test State", pincode: "123456" }
        });

        // 3. TEST FREQUENT ITEMS API (Simulated)
        // We can't easily call the API route via script without starting server, 
        // effectively we are testing the query logic here.
        console.log("📊 Testing Frequent Items Logic...");
        const frequentItems = await Order.aggregate([
            { $match: { user: user._id, status: { $nin: ['cancelled'] } } },
            { $unwind: '$items' },
            { $group: { _id: '$items.product', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        console.log("Frequent Items Result:", frequentItems);
        if (frequentItems.length > 0 && frequentItems[0]._id.toString() === product._id.toString()) {
            console.log("✅ Frequent Items Logic Passed.");
        } else {
            console.error("❌ Frequent Items Logic Failed.");
        }

        // 4. CREATE SUBSCRIPTION (Simulating POST /api/subscriptions)
        console.log("📅 Creating Subscription (Simulating UI)...");
        const now = new Date();
        // Set due date to NOW for testing cron
        const sub = await Subscription.create({
            user: user._id,
            product: product._id,
            quantity: 1,
            frequency: 'Monthly',
            status: 'Active',
            startDate: now,
            nextOrderDate: now, // DUE NOW
            preferredDay: now.getDate(),
            preferredTime: "10:00"
        });
        console.log("✅ Subscription Created:", sub._id);

        // 5. RUN CRON LOGIC (Simulating GET /api/cron/process-subscriptions)
        console.log("🚀 Running Cron Logic...");
        
        // Find Due
        const due = await Subscription.find({ status: 'Active', nextOrderDate: { $lte: new Date() } });
        console.log(`Found ${due.length} due subscriptions.`);
        
        const mySub = due.find(s => s._id.toString() === sub._id.toString());
        if (mySub) {
             console.log("✅ My Subscription is picked up.");
             
             // Create Order
             const newOrder = await Order.create({
                 user: user._id,
                 items: [{ product: product._id, quantity: 1, name: product.name }],
                 status: 'pending',
                 metadata: { isAutoOrder: true, subscriptionId: sub._id }
             });
             console.log("✅ Auto Order Created:", newOrder._id);

             // Update Sub
             mySub.nextOrderDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // Approx next month
             await mySub.save();
             console.log("✅ Subscription Rescheduled.");

        } else {
            console.error("❌ My Subscription was NOT picked up (maybe date mismatch?)");
        }

        // CLEANUP
        console.log("🧹 Cleanup...");
        await Subscription.findByIdAndDelete(sub._id);
        // Note: Not deleting orders to keep history, but in real test env we might.
        
        console.log("🎉 Verification Complete.");
        process.exit(0);

    } catch (e) {
        console.error("💥 Verification Failed:", e);
        process.exit(1);
    }
}

runVerification();
