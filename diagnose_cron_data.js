const mongoose = require('mongoose');

// --- CONFIG ---
// Use the URI found in other debug files
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

// --- SCHEMAS (Mirrored from actual files) ---
const Schema = mongoose.Schema;
// Subscription
const SubscriptionSchema = new Schema({
    user: Schema.Types.ObjectId,
    product: Schema.Types.ObjectId,
    status: String,
    nextOrderDate: Date,
    frequency: String,
    quantity: Number,
    preferredDay: Number,
    preferredTime: String
}, { strict: false });
const Subscription = mongoose.model('Subscription', SubscriptionSchema);

// Order
const OrderSchema = new Schema({
    user: Schema.Types.ObjectId,
    shippingAddress: {
        addressLine1: String,
        pincode: String
    },
    createdAt: Date
}, { strict: false });
const Order = mongoose.model('Order', OrderSchema);

// Customer
const CustomerSchema = new Schema({
    address: String,
    pincode: String,
    city: String,
    state: String,
    phone: String,
    name: String
}, { strict: false });
const Customer = mongoose.model('Customer', CustomerSchema);

// Product
const ProductSchema = new Schema({
    stockQuantity: Number,
    price: Number,
    name: String
}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function diagnose() {
    try {
        console.log("🔌 Connecting to DB...");
        await mongoose.connect(MONGODB_URI);

        const now = new Date(); // Use local system time (UTC or Local)
        console.log(`[DIAGNOSE] Current Time: ${now.toISOString()}`);

        // 1. Find Active Subscriptions
        const subs = await Subscription.find({ status: 'Active' });
        console.log(`[DIAGNOSE] Found ${subs.length} Active Subscriptions.`);

        if (subs.length === 0) {
            console.log("⚠️ No active subscriptions found. Nothing to process.");
            return;
        }

        for (const sub of subs) {
            console.log(`\n--------------------------------------------------`);
            console.log(`Checking Subscription: ${sub._id}`);
            console.log(`User: ${sub.user}`);
            console.log(`Product: ${sub.product}`);
            console.log(`NextOrderDate: ${sub.nextOrderDate ? sub.nextOrderDate.toISOString() : 'NULL'}`);
            
            // Check Date
            if (sub.nextOrderDate > now) {
                console.log(`❌ NOT DUE YET. (Due: ${sub.nextOrderDate.toISOString()})`);
                // Continue to check data validity anyway
            } else {
                console.log(`✅ DUE. (Due: ${sub.nextOrderDate.toISOString()})`);
            }

            // Check Product Stock
            const product = await Product.findById(sub.product);
            if (!product) {
                console.error(`❌ PRODUCT NOT FOUND: ${sub.product}`);
            } else {
                 console.log(`📦 Product: ${product.name}, Stock: ${product.stockQuantity}, Req: ${sub.quantity}`);
                 if (product.stockQuantity < sub.quantity) {
                     console.error(`❌ OUT OF STOCK.`);
                 } else {
                     console.log(`✅ Stock OK.`);
                 }
            }

            // Check Address (The Critical Part)
            let validAddress = false;
            
            // 1. Last Order
            const lastOrder = await Order.findOne({ user: sub.user })
                .sort({ createdAt: -1 })
                .select('shippingAddress');
            
            if (lastOrder && lastOrder.shippingAddress && lastOrder.shippingAddress.addressLine1 && lastOrder.shippingAddress.pincode) {
                console.log(`✅ Found Valid Last Order Address.`);
                validAddress = true;
            } else {
                console.log(`⚠️ No valid Last Order address found.`);
            }

            // 2. Customer Profile
            if (!validAddress) {
                const customer = await Customer.findById(sub.user);
                if (customer) {
                    console.log(`   Customer Found: ${customer._id}`);
                    console.log(`   Address: "${customer.address}"`);
                    console.log(`   Pincode: "${customer.pincode}"`);
                    
                    if (customer.address && customer.pincode) {
                        console.log(`✅ Found Valid Customer Profile Address.`);
                        validAddress = true;
                    } else {
                        console.error(`❌ Customer Profile incomplete (missing address or pincode).`);
                    }
                } else {
                    console.error(`❌ Customer Profile NOT FOUND for ID ${sub.user}.`);
                    // This implies user created subscription but Customer record missing?
                    // Should be impossible if they are same ID, but...
                }
            }

            if (validAddress) {
                console.log(`🎉 READY TO PROCESS (Data is valid).`);
            } else {
                console.error(`🚫 FAILED: No valid address found. This subscription would be SKIPPED.`);
            }
        }

    } catch (e) {
        console.error("Diagnosis Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
