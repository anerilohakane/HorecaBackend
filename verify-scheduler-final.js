const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";
const CRON_URL = "http://localhost:3001/api/cron/process-subscriptions";

const Schema = mongoose.Schema;
const Subscription = mongoose.model('Subscription', new Schema({ 
    user: Schema.Types.ObjectId,
    product: Schema.Types.ObjectId,
    status: String, 
    nextOrderDate: Date, 
    frequency: String,
    preferredTime: String,
    preferredDay: Number,
    quantity: Number
}, { strict: false }));

const Order = mongoose.model('Order', new Schema({ 
    user: Schema.Types.ObjectId, 
    orderNumber: String,
    metadata: Object
}, { strict: false }));

const Product = mongoose.model('Product', new Schema({ 
    stockQuantity: Number, 
    price: Number, 
    name: String
}, { strict: false }));

async function runTest() {
    try {
        console.log("🛠️  Step 1: Connecting to DB...");
        await mongoose.connect(MONGODB_URI);

        const now = new Date();
        // Create a subscription due 1 minute ago
        const past = new Date(now.getTime() - 60000); 

        // Get a valid User and Product
        console.log("🛠️  Step 2: Finding valid User/Product...");
        const product = await Product.findOne({ stockQuantity: { $gt: 10 } });
        if (!product) throw new Error("No product with stock found.");
        
        // We need a user with an order or valid address. 
        // Let's rely on one we saw earlier in logs or just pick one.
        const order = await Order.findOne().sort({_id: -1});
        const userId = order ? order.user : null;
        if (!userId) throw new Error("No existing orders to borrow User ID from.");

        console.log(`   Using User: ${userId}`);
        console.log(`   Using Product: ${product.name}`);

        // Create Test Sub
        console.log("🛠️  Step 3: Creating TEST Subscription...");
        const sub = await Subscription.create({
            user: userId,
            product: product._id,
            quantity: 1,
            frequency: 'Daily',
            status: 'Active',
            nextOrderDate: past, // DUE NOW
            preferredTime: '00:00',
            preferredDay: 1
        });
        console.log(`   Created Sub ID: ${sub._id}`);

        // Trigger API
        console.log("🛠️  Step 4: Triggering Cron API (Localhost)...");
        let apiSuccess = false;
        try {
            const res = await fetch(CRON_URL);
            const data = await res.json();
            console.log("   API Response:", JSON.stringify(data));
            if (data.results && data.results.ordersCreated > 0) {
                apiSuccess = true;
            } else {
                console.warn("   API ran but created 0 orders? Maybe addressed check failed?");
                // If it failed, we can't assert success
            }
        } catch (err) {
            console.error("   ❌ API Call Failed:", err.message);
            console.log("   (Context: Is 'npm run dev' running on port 3001?)");
        }

        // Check verification (even if API call failed network, maybe it ran?)
        // Wait a moment for DB async
        await new Promise(r => setTimeout(r, 2000));

        console.log("🛠️  Step 5: Verifying Order Creation...");
        const newOrder = await Order.findOne({ 
            'metadata.isAutoOrder': true,
            'metadata.subscriptionIds': { $in: [sub._id] }
        });

        if (newOrder) {
            console.log("✅ SUCCESS! Order was created automatically.");
            console.log(`   Order Number: ${newOrder.orderNumber}`);
        } else {
            console.log("❌ FAILURE: No order found for this subscription.");
            if (!apiSuccess) {
                console.log("   Reason: The API Backend was likely not running or reachable.");
            }
        }

        // Cleanup
        console.log("🧹 Cleanup...");
        await Subscription.findByIdAndDelete(sub._id);
        if (newOrder) await Order.findByIdAndDelete(newOrder._id);

    } catch (e) {
        console.error("💥 Error:", e.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
