const mongoose = require('mongoose');

// --- CONFIG ---
const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

// --- MODELS ---
const Schema = mongoose.Schema;
// Define schemas with minimal required fields for the operation
const Subscription = mongoose.model('Subscription', new Schema({ 
    user: Schema.Types.ObjectId,
    product: Schema.Types.ObjectId,
    status: String, 
    nextOrderDate: Date, 
    lastOrderDate: Date,
    frequency: String,
    preferredTime: String,
    preferredDay: Number,
    quantity: Number,
    endDate: Date
}, { strict: false }));

const Order = mongoose.model('Order', new Schema({ 
    user: Schema.Types.ObjectId, 
    orderNumber: String,
    items: [Object],
    shippingAddress: Object,
    subtotal: Number,
    total: Number,
    status: String,
    payment: Object,
    metadata: Object,
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

async function forceRun() {
    try {
        console.log("🔌 Connecting to DB...");
        await mongoose.connect(MONGODB_URI);
        const now = new Date();
        
        console.log(`[FORCE] Starting Manual Cron Execution at ${now.toISOString()}`);

        const dueSubscriptions = await Subscription.find({
            status: 'Active',
            nextOrderDate: { $lte: now }
        });
        
        console.log(`[FORCE] Found ${dueSubscriptions.length} due subscriptions.`);
        
        if (dueSubscriptions.length === 0) {
            console.log("✅ No subscriptions to process.");
            return;
        }

        const groups = {};
        for (const sub of dueSubscriptions) {
             const key = `${sub.user}`;
             if (!groups[key]) groups[key] = { user: sub.user, subs: [] };
             groups[key].subs.push(sub);
        }

        for (const key in groups) {
            const group = groups[key];
            const userId = group.user;
            
            // 1. Get Address
            let shippingAddress = null;
            const lastOrder = await Order.findOne({ user: userId }).sort({ createdAt: -1 });
            
            if (lastOrder && lastOrder.shippingAddress && lastOrder.shippingAddress.addressLine1 && lastOrder.shippingAddress.pincode) {
                shippingAddress = lastOrder.shippingAddress;
            } else {
                const customer = await Customer.findById(userId);
                if (customer && customer.address && customer.pincode) {
                     shippingAddress = { 
                        fullName: customer.name || "Valued Customer",
                        addressLine1: customer.address,
                        city: customer.city || "",
                        state: customer.state || "",
                        pincode: customer.pincode,
                        phone: customer.phone || ""
                     };
                }
            }

            if (!shippingAddress) {
                console.error(`❌ FAIL: User ${userId} has no valid address. Skipping.`);
                continue;
            }

            // 2. Build Order
            const items = [];
            let subtotal = 0;

            for (const sub of group.subs) {
                const product = await Product.findById(sub.product);
                if (!product) continue;
                if (product.stockQuantity < sub.quantity) {
                    console.error(`❌ Partial Fail: Product ${product.name} out of stock.`);
                    continue;
                }

                const total = (product.price || 0) * sub.quantity;
                items.push({
                    product: sub.product,
                    name: product.name,
                    quantity: sub.quantity,
                    unitPrice: product.price || 0,
                    totalPrice: total,
                    image: product.image || (product.images?.[0]?.url)
                });
                subtotal += total;
            }

            if (items.length === 0) continue;

            const uniqueSuffix = Date.now().toString(36).toUpperCase();
            const orderNumber = `ORD-MANUAL-${uniqueSuffix}`;
            
            const newOrder = await Order.create({
                orderNumber,
                user: userId,
                items,
                shippingAddress,
                subtotal,
                total: subtotal,
                status: 'pending',
                payment: { method: 'cash_on_delivery', status: 'pending' },
                metadata: { isAutoOrder: true, triggeredAt: now, mode: 'MANUAL_FORCE' }
            });

            console.log(`✅ Order Created: ${newOrder.orderNumber}`);

            // 3. Update Stock & Schedule
            for (const item of items) {
                await Product.updateOne({ _id: item.product }, { $inc: { stockQuantity: -item.quantity } });
            }

            for (const sub of group.subs) {
                // naive reschedule (Add 1 day/week/month)
                let nextDate = new Date(sub.nextOrderDate);
                if (sub.frequency === 'Daily') nextDate.setDate(nextDate.getDate() + 1);
                else if (sub.frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
                else if (sub.frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                else if (sub.frequency === 'Once') sub.status = 'Completed';

                // If still in past (because it was WAY overdue), catch up?
                // For now, just set to "Tomorrow" if it's daily and still in past?
                // No, standard logic preserves the schedule cadence.
                
                // Ensure it's in future? 
                if (nextDate <= now && sub.frequency !== 'Once') {
                     // Fast forward is complex, let's just push it to "Future from NOW" to stop loops
                     // This breaks precise cadence but fixes "stuck in past" loops
                     const diff = nextDate - new Date(sub.nextOrderDate); // The interval
                     // Recalculate from NOW
                     // nextDate = new Date(now.getTime() + (1000 * 60 * 60 * 24)); // Tomorrow
                }

                sub.nextOrderDate = nextDate;
                sub.lastOrderDate = now;
                await sub.save();
                console.log(`✅ Subscription ${sub._id} Rescheduled to ${nextDate.toISOString()}`);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

forceRun();
