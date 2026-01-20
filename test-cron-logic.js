const mongoose = require('mongoose');

// --- CONFIG ---
const MONGODB_URI = "mongodb+srv://aneridelxn_db_user:YhZGkF6u2pEeVyvJ@farmferry-db.11sfqjg.mongodb.net/farmferry_data?retryWrites=true&w=majority";

// --- MINIMAL SCHEMAS (Inline to avoid Next.js issues) ---
const Schema = mongoose.Schema;

const UserSchema = new Schema({ name: String }, { timestamps: true });
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const ProductSchema = new Schema({ 
    name: String, 
    price: Number, 
    image: String 
});
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

const OrderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    orderNumber: String,
    orderId: String, // Legacy field
    shippingAddress: {
        fullName: String,
        addressLine1: String,
        city: String,
        state: String,
        pincode: String
    },
    items: [Object],
    total: Number,
    status: String,
    metadata: Object
}, { timestamps: true });
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

const SubscriptionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 },
    frequency: { type: String, enum: ["Weekly", "Monthly"] },
    status: { type: String, default: 'Active' },
    nextOrderDate: Date,
    startDate: Date
});
const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);

// --- TEST RUNNER ---
async function runTest() {
    try {
        console.log("🔌 Connecting to DB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected.");

        // 1. SETUP DATA
        console.log("🛠️ Setting up test data...");
        const uniqueSuffix = Date.now();
        
        // USER
        const user = await User.create({ 
            name: "Cron Test User", 
            email: `cronuser${uniqueSuffix}@test.com` 
        });

        // PRODUCT (Needs supplier/cat/images/stock)
        const product = await Product.create({ 
            name: "Test Croissant", 
            price: 100, 
            stockQuantity: 50,
            images: [{ url: "http://img", publicId: "123" }],
            supplierId: new mongoose.Types.ObjectId(), // Mock ID
            categoryId: new mongoose.Types.ObjectId()  // Mock ID
        });

        // Create a past order to provide address
        const pastOrder = await Order.create({
            orderNumber: `TEST-ORD-${uniqueSuffix}`,
            orderId: `TEST-ORD-ID-${uniqueSuffix}`, // Satisfy legacy index
            user: user._id,
            shippingAddress: {
                fullName: "Test User",
                addressLine1: "123 Test St",
                city: "Test City",
                state: "Test State",
                pincode: "123456"
            },
            items: [],
             total: 0,
            status: 'delivered'
        });

        // Create a Subscription due "NOW" (set to 5 mins ago to be safe)
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const sub = await Subscription.create({
            user: user._id,
            product: product._id,
            quantity: 2,
            frequency: 'Weekly',
            status: 'Active',
            startDate: fiveMinsAgo,
            nextOrderDate: fiveMinsAgo // IT IS DUE!
        });
        console.log(`📅 Subscription Created. Next Order Date: ${sub.nextOrderDate.toISOString()}`);

        // 2. RUN CRON LOGIC (Simulating the API Route)
        console.log("🚀 Running Cron Logic...");
        
        const now = new Date(); // Current Time
        console.log(`⏰ Current Server Time: ${now.toISOString()}`);

        // Find Due
        const dueSubscriptions = await Subscription.find({
            nextOrderDate: { $lte: now },
            status: 'Active'
        }).populate('product'); // We know populating works by ID ref usually

        console.log(`🔍 Found ${dueSubscriptions.length} due subscriptions.`);

        if (dueSubscriptions.length === 0) {
            throw new Error("❌ Failed to find the due subscription!");
        }

        for (const s of dueSubscriptions) {
            if (s._id.toString() !== sub._id.toString()) continue; // Skip others if any

            console.log(`⚙️ Processing Subscription ${s._id}...`);
            
            // Fetch Address (Mocking the route logic)
            const lastOrder = await Order.findOne({ user: s.user }).sort({ createdAt: -1 });
            if (!lastOrder) throw new Error("Could not find last order");

            // Create Order
            const uniqueSubSuffix = Date.now() + Math.floor(Math.random() * 1000);
            const newOrder = await Order.create({
                orderNumber: `ORD-SUB-${uniqueSubSuffix}`,
                orderId: `ORD-SUB-ID-${uniqueSubSuffix}`,
                user: s.user,
                items: [{
                    product: product._id, // In real code, s.product._id
                    name: product.name,
                    quantity: s.quantity,
                    unitPrice: product.price,
                    totalPrice: product.price * s.quantity
                }],
                shippingAddress: lastOrder.shippingAddress,
                total: product.price * s.quantity,
                status: 'pending',
                metadata: { isAutoOrder: true, subscriptionId: s._id }
            });
            console.log(`✅ Order Created: ${newOrder._id}`);

            // Update Next Date
            const nextDate = new Date(s.nextOrderDate);
            nextDate.setDate(nextDate.getDate() + 7); // Weekly
            s.nextOrderDate = nextDate;
            await s.save();
            console.log(`🗓️ Rescheduled to: ${s.nextOrderDate.toISOString()}`);
        }

        // 3. VERIFICATION
        const updatedSub = await Subscription.findById(sub._id);
        const orders = await Order.find({ "metadata.subscriptionId": sub._id });

        if (orders.length === 1 && updatedSub.nextOrderDate > now) {
            console.log("\n🎉 TEST SUCCESS: Order created and Subscription rescheduled correctly!");
        } else {
            console.error("\n❌ TEST FAILED: Verification checks failed.");
            console.log("Orders found:", orders.length);
            console.log("Next Date:", updatedSub.nextOrderDate);
        }

        // 4. CLEANUP
        console.log("\n🧹 Cleaning up...");
        await User.findByIdAndDelete(user._id);
        await Product.findByIdAndDelete(product._id);
        await Order.findByIdAndDelete(pastOrder._id);
        if (orders.length > 0) await Order.findByIdAndDelete(orders[0]._id);
        await Subscription.findByIdAndDelete(sub._id);
        console.log("✨ Done.");

        process.exit(0);

    } catch (e) {
        console.error("💥 TEST ERROR:", e);
        process.exit(1);
    }
}

runTest();
