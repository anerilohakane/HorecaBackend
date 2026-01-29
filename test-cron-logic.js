const mongoose = require('mongoose');

// --- CONFIG ---
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

// --- MODELS ---
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
    shippingAddress: Object,
    payment: Object,
    orderNumber: String,
    createdAt: Date
}, { strict: false }));

const Product = mongoose.model('Product', new Schema({ 
    stockQuantity: Number, 
    price: Number, 
    name: String,
    images: [Object],
    image: String
}, { strict: false }));

const Customer = mongoose.model('Customer', new Schema({ 
    name: String,
    address: String, 
    city: String, 
    state: String, 
    pincode: String, 
    phone: String 
}, { strict: false }));

// --- LOGIC ---
async function runCronSim() {
    try {
        console.log("🔌 Connecting...");
        await mongoose.connect(MONGODB_URI);
        const now = new Date();
        
        // 1. Find Due
        const dueSubscriptions = await Subscription.find({
            status: 'Active',
            nextOrderDate: { $lte: now }
        });
        
        console.log(`[SIM] Found ${dueSubscriptions.length} due subscriptions.`);
        
        if (dueSubscriptions.length === 0) return;

        // Grouping
        const groups = {};
        for (const sub of dueSubscriptions) {
             const key = `${sub.user}`; // Simple grouping by user for test
             if (!groups[key]) groups[key] = { user: sub.user, subs: [] };
             groups[key].subs.push(sub);
        }

        // Process
        for (const key in groups) {
            const group = groups[key];
            const userId = group.user;
            console.log(`\nProcessing User: ${userId}`);

            // Address Check
            let shippingAddress = null;
            const lastOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
            
            if (lastOrder && lastOrder.shippingAddress && lastOrder.shippingAddress.addressLine1 && lastOrder.shippingAddress.pincode) {
                console.log(`  ✅ Found Last Order Address: ${lastOrder.shippingAddress.addressLine1}`);
                shippingAddress = lastOrder.shippingAddress;
            } else {
                console.log(`  ⚠️ No recent order address. Checking Profile...`);
                // Fallback
                const customer = await Customer.findById(userId);
                if (customer) {
                    console.log(`  Customer Profile Found: ${JSON.stringify(customer)}`);
                } else {
                    console.log(`  ❌ Customer Profile NOT FOUND.`);
                }

                if (customer && customer.address && customer.pincode) {
                     console.log(`  ✅ Found Profile Address.`);
                     shippingAddress = { addressLine1: customer.address, pincode: customer.pincode };
                }
            }

            if (!shippingAddress) {
                console.error(`  ❌ FAIL: No valid address found. This is why it fails!`);
                continue;
            }
            
            console.log(`  ✅ Address Check Passed. Checking Stock...`);
            
            for (const sub of group.subs) {
                const product = await Product.findById(sub.product);
                if (!product) {
                    console.error(`  ❌ Product not found: ${sub.product}`);
                } else if (product.stockQuantity < sub.quantity) {
                    console.error(`  ❌ Out of Stock: ${product.stockQuantity} < ${sub.quantity}`);
                } else {
                    console.log(`  ✅ Stock OK for product ${product.name}`);
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

runCronSim();
