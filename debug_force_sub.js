const mongoose = require('mongoose');
// --- SCHEMAS (Inline for debugging) ---
const Schema = mongoose.Schema;

// User
const User = mongoose.models.User || mongoose.model('User', new Schema({ 
    name: String, email: String, role: String 
}, { strict: false }));

// Product
const Product = mongoose.models.Product || mongoose.model('Product', new Schema({ 
    name: String, stockQuantity: Number, price: Number 
}, { strict: false }));

// Order
const Order = mongoose.models.Order || mongoose.model('Order', new Schema({ 
    user: Schema.Types.ObjectId, 
    items: Array, 
    shippingAddress: Object,
    payment: Object,
    metadata: Object 
}, { strict: false }));

// Subscription
const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', new Schema({ 
    user: Schema.Types.ObjectId, 
    product: Schema.Types.ObjectId, 
    status: String, 
    nextOrderDate: Date, 
    frequency: String,
    quantity: Number
}, { strict: false }));

// --- CONFIG ---
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

async function runTest() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to DB");

        const now = new Date();
        const subs = await Subscription.find({ 
            status: 'Active', 
            nextOrderDate: { $lte: now } 
        }).populate('product');

        console.log(`Found ${subs.length} due subscriptions.`);

        for (const sub of subs) {
            console.log(`Processing Sub: ${sub._id} (User: ${sub.user})`);
            
            try {
                // Fetch Last Order
                const lastOrder = await Order.findOne({ user: sub.user })
                    .sort({ createdAt: -1 })
                    .select('shippingAddress payment');

                console.log(`Last Order Found? ${lastOrder ? "Yes" : "No"}`);
                if (lastOrder) {
                    console.log(`Address:`, lastOrder.shippingAddress);
                } else {
                    console.log("❌ NO LAST ORDER - This is likely the blocker.");
                }

                // Check Product
                if (!sub.product) {
                     console.log("❌ Product not populated/found.");
                     continue;
                }
                console.log(`Product Stock: ${sub.product.stockQuantity}, Price: ${sub.product.price}`);

                // Check Validation Logic manually
                if (!lastOrder || !lastOrder.shippingAddress) {
                    console.log("❌ SKIPPING: No Address");
                    continue;
                }
                
                // Try Creating Order (Simulation)
                console.log("Attempting Order Create...");
                const paymentMethod = lastOrder.payment?.method || 'cash_on_delivery';
                
                const orderData = {
                    orderNumber: `TEST-${Date.now()}`,
                    user: sub.user,
                    items: [{
                        product: sub.product._id,
                        name: sub.product.name,
                        quantity: sub.quantity,
                        unitPrice: sub.product.price,
                        totalPrice: sub.product.price * sub.quantity
                    }],
                    shippingAddress: lastOrder.shippingAddress,
                    subtotal: sub.product.price * sub.quantity,
                    total: sub.product.price * sub.quantity,
                    status: 'pending',
                    payment: { method: paymentMethod, status: 'pending' },
                    metadata: { isAutoOrder: true }
                };
                
                // Verify Schema Validation
                 // Note: We can't easily Use Mongoose Model directly if checking validation without saving, 
                 // but let's try validatng
                 const orderDoc = new Order(orderData);
                 await orderDoc.validate();
                 console.log("✅ Order Validation Passed!");

            } catch (err) {
                console.error("❌ ERROR Processing Sub:", err);
            }
        }

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
