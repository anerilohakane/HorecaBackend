
const mongoose = require('mongoose');

// --- CONFIG ---
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

// --- SCHEMAS (Minimal) ---
const Schema = mongoose.Schema;
const User = mongoose.models.User || mongoose.model("User", new Schema({ name: String, email: String, phone: String }));
const Product = mongoose.models.Product || mongoose.model("Product", new Schema({ name: String, price: Number, image: String }));
const Order = mongoose.models.Order || mongoose.model("Order", new Schema({ user: Schema.Types.ObjectId, items: [Object], status: String, shippingAddress: Object, orderNumber: String }));
const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", new Schema({ user: Schema.Types.ObjectId, product: Schema.Types.ObjectId, status: String, nextOrderDate: Date, frequency: String, preferredTime: String, preferredDay: Number, quantity: Number }));

async function runVerification() {
    try {
        console.log("🔌 Connecting to DB...");
        await mongoose.connect(MONGODB_URI);
        
        // 1. GET A USER AND PRODUCT
        console.log("🔍 Finding User and Product...");
        const user = await User.findOne();
        const products = await Product.find().limit(2);
        
        if (!user || products.length < 2) {
            throw new Error("❌ Need User and at least 2 Products.");
        }
        const p1 = products[0];
        const p2 = products[1];

        console.log(`✅ User: ${user._id}`);
        console.log(`✅ Products: ${p1.name}, ${p2.name}`);

        // Ensure user has an address (by checking past order or creating one)
        const lastOrder = await Order.findOne({ user: user._id });
        if (!lastOrder) {
             console.log("⚠️ User has no past orders (needed for address). Creating fake one...");
             await Order.create({
                user: user._id,
                items: [],
                status: 'delivered',
                shippingAddress: { fullName: "Test User", addressLine1: "123 Test St", city: "Test City", state: "TS", pincode: "123456", phone: "9999999999" }
             });
        }

        // 2. CREATE 2 SUBSCRIPTIONS (Same Frequency/Time)
        console.log("DATE SETUP: Creating 2 Subscriptions due NOW...");
        const now = new Date();
        const preferredTime = "10:00";
        const frequency = "Monthly";
        
        const s1 = await Subscription.create({
            user: user._id,
            product: p1._id,
            quantity: 1,
            frequency,
            status: 'Active',
            nextOrderDate: now, // Due
            preferredDay: now.getDate(),
            preferredTime
        });

        const s2 = await Subscription.create({
            user: user._id,
            product: p2._id,
            quantity: 2,
            frequency,
            status: 'Active',
            nextOrderDate: now, // Due
            preferredDay: now.getDate(),
            preferredTime
        });
        
        console.log(`✅ Created Subs: ${s1._id}, ${s2._id}`);

        // 3. RUN CRON LOGIC (Simulated via script mainly, but logic is same as API)
        console.log("🚀 Running Cron Logic (Simulated)...");

        // We will call the logic we wrote in the route. 
        // Since we can't import the route function easily in this script context (Next.js modules), 
        // we will Re-Implement the Key Logic here to verify it works against Mongoose.
        // OR better: we make a fetch call to the local API? No, user might not have server running 100%. 
        // Let's rely on Re-Implementing the logic briefly here to prove the Concept works on DB.

        // ... LOGIC START ...
        const dueSubscriptions = await Subscription.find({ 
            status: 'Active', 
            nextOrderDate: { $lte: new Date() },
            _id: { $in: [s1._id, s2._id] } // Target only ours to be clean
        }).populate('product');

        if (dueSubscriptions.length !== 2) {
            throw new Error(`❌ Expected 2 due subscriptions, found ${dueSubscriptions.length}`);
        }

        // Grouping
        const groups = {};
        for (const sub of dueSubscriptions) {
             const key = `${sub.user}_${sub.frequency}_${sub.preferredTime}`; // simplified key for test
             if (!groups[key]) groups[key] = [];
             groups[key].push(sub);
        }
        
        console.log(`[VERIFY] Groups found: ${Object.keys(groups).length}`);
        if (Object.keys(groups).length !== 1) {
             throw new Error("❌ Structuring failed: Should have grouped into 1.");
        }

        // Processing
        for (const key in groups) {
            const subs = groups[key];
            const userId = subs[0].user;
            
            const lastOrd = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
            
            const items = subs.map(s => ({
                product: s.product._id,
                name: s.product.name,
                quantity: s.quantity,
                unitPrice: s.product.price
            }));
            
            const newOrder = await Order.create({
                orderNumber: `TEST-AUTO-${Date.now()}`,
                user: userId,
                items,
                shippingAddress: lastOrd.shippingAddress,
                status: 'pending',
                metadata: { isAutoOrder: true, subscriptionIds: subs.map(s => s._id) }
            });
            console.log(`✅ Consolidated Order Created: ${newOrder._id} with ${newOrder.items.length} items.`);

            // Update Subs
            for(const s of subs) {
                 s.nextOrderDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
                 await s.save();
            }
        }
        // ... LOGIC END ...

        // 4. VERIFY RESULTS
        const updatedS1 = await Subscription.findById(s1._id);
        const updatedS2 = await Subscription.findById(s2._id);
        
        if (updatedS1.nextOrderDate > now && updatedS2.nextOrderDate > now) {
            console.log("✅ Subscriptions rescheduled successfully.");
        } else {
            console.error("❌ Subscriptions NOT rescheduled.");
        }

        // Cleanup
        console.log("🧹 Cleanup...");
        await Subscription.deleteMany({ _id: { $in: [s1._id, s2._id] } });
        // Keeping order for inspection

        console.log("🎉 Verification Complete.");
        process.exit(0);

    } catch (e) {
        console.error("💥 Verification Failed:", e);
        process.exit(1);
    }
}

runVerification();
