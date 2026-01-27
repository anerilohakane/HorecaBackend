const mongoose = require('mongoose');
const axios = require('axios');

// --- CONFIG ---
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";
const API_URL = "http://localhost:3001/api/cron/process-subscriptions?test=true"; // Append query to avoid some caches if any

const Schema = mongoose.Schema;
const User = mongoose.model('User', new Schema({ name: String, email: String }, { strict: false }));
const Product = mongoose.model('Product', new Schema({ name: String, stockQuantity: Number, price: Number }, { strict: false }));
const Order = mongoose.model('Order', new Schema({ user: Schema.Types.ObjectId, items: Array, metadata: Object }, { strict: false }));
const Subscription = mongoose.model('Subscription', new Schema({ 
    user: Schema.Types.ObjectId, 
    product: Schema.Types.ObjectId, 
    status: String, 
    nextOrderDate: Date, 
    frequency: String,
    quantity: Number,
    preferredTime: String,
    preferredDay: Number
}, { strict: false }));

async function runTest() {
    try {
        await mongoose.connect(MONGODB_URI);
        const suffix = Date.now();

        // 1. DATA SETUP
        const user = await User.create({ name: `DebugUser_${suffix}`, email: `debug_${suffix}@example.com` });
        
        // --- CREATE LAST ORDER (CRITICAL for Address Check) ---
        await Order.create({
            user: user._id,
            shippingAddress: {
                fullName: "Debug User",
                addressLine1: "123 Debug Lane",
                city: "Debug City",
                state: "DB",
                pincode: "123456",
                phone: "9999999999"
            },
            payment: { method: 'online' },
            status: 'Delivered',
            createdAt: new Date()
        });
        
        // Product (2 IN STOCK, 1 OOS)
        const p1 = await Product.create({ name: "P1_InStock", stockQuantity: 100, price: 50 });
        const p2 = await Product.create({ name: "P2_InStock", stockQuantity: 100, price: 50 });
        const p3 = await Product.create({ name: "P3_OOS", stockQuantity: 0, price: 50 });

        // Create Subscriptions (DUE NOW)
        const subs = await Subscription.insertMany([
            { user: user._id, product: p1._id, quantity: 1, frequency: 'Daily', status: 'Active', nextOrderDate: new Date(Date.now() - 60000), preferredTime: '09:00', preferredDay: 1 },
            { user: user._id, product: p2._id, quantity: 1, frequency: 'Daily', status: 'Active', nextOrderDate: new Date(Date.now() - 60000), preferredTime: '09:00', preferredDay: 1 },
            { user: user._id, product: p3._id, quantity: 1, frequency: 'Daily', status: 'Active', nextOrderDate: new Date(Date.now() - 60000), preferredTime: '09:00', preferredDay: 1 }
        ]);

        console.log(`[SETUP] Created User ${user._id} and 3 subs (P3 is OOS). Expecting BLOCK.`);

        // 2. TRIGGER CRON
        console.log("🚀 Triggering Cron...");
        try {
            const res = await axios.get(API_URL);
            console.log("Response:", JSON.stringify(res.data, null, 2));
        } catch (e) {
            console.error("API Error:", e.message, e.response?.data);
        }

        // 3. CHECK ORDER
        const order = await Order.findOne({ user: user._id, 'metadata.isAutoOrder': true });
        
        if (order) {
            console.log(`✅ Order Created! ID: ${order._id}`);
            console.log(`Items count: ${order.items.length}`);
            order.items.forEach(i => console.log(` - ${i.name} (Qty: ${i.quantity})`));
        } else {
            console.log("❌ NO Order Created.");
        }

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
