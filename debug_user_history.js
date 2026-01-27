const mongoose = require('mongoose');

// --- SCHEMAS (Minimal) ---
const Schema = mongoose.Schema;

// User
const User = mongoose.model('User', new Schema({ name: String, email: String }, { strict: false }));

// Order
const Order = mongoose.model('Order', new Schema({ 
    user: Schema.Types.ObjectId, 
    orderNumber: String,
    status: String,
    shippingAddress: {
        addressLine1: String,
        city: String,
        pincode: String
    },
    createdAt: Date
}, { strict: false }));

// Subscription
const Subscription = mongoose.model('Subscription', new Schema({ 
    user: Schema.Types.ObjectId, 
    product: Schema.Types.ObjectId, 
    status: String
}, { strict: false }));

// --- CONFIG ---
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

async function runDebug() {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI);
        }

        console.log("🔍 Scanning Active Subscriptions...");
        const subs = await Subscription.find({ status: 'Active' });
        
        if (subs.length === 0) {
            console.log("No Active Subscriptions found.");
            return;
        }

        // Group by User
        const userIds = [...new Set(subs.map(s => s.user.toString()))];
        console.log(`Found ${subs.length} subs across ${userIds.length} users.`);

        // --- DUMP ALL ORDERS ---
        console.log("\n--- DUMPING ALL ORDERS IN DB ---");
        const allOrders = await Order.find({}, { user: 1, orderNumber: 1, createdAt: 1, shippingAddress: 1 }).sort({ createdAt: -1 });
        console.log(`Total Orders in DB: ${allOrders.length}`);
        allOrders.forEach(o => {
            console.log(`Order: ${o.orderNumber || o._id} | User: ${o.user} | Date: ${o.createdAt}`);
            if(o.user.toString() === userIds[0]) console.log("   *** MATCHES SUBSCRIPTION USER ***");
        });

        for (const userId of userIds) {
            console.log(`\n--------------------------------------------------`);
            console.log(`👤 Checking Sub Owner: ${userId}`);

            // 1. Check Previous Orders
            const lastOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
            
            if (!lastOrder) {
                console.error(`❌ FAILURE: User has NO previous orders. Cron will SKIP.`);
            } else {
                console.log(`✅ Last Order Found: ${lastOrder.orderNumber} (Status: ${lastOrder.status})`);
                
                // 2. Check Address
                const addr = lastOrder.shippingAddress;
                if (!addr) {
                    console.error(`❌ FAILURE: Last Order has NO shipping address.`);
                } else {
                     console.log(`✅ Address Valid: ${addr.addressLine1 || 'N/A'}`);
                }
            }
        }

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

// Helper to load models if require fails (due to ES6 modules)
// Actually we can use the same pattern as debug_cron_repro but improved
runDebug();
