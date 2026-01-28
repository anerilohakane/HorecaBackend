const mongoose = require('mongoose');

// Models (Simplified Schema for test)
// We only need enough schema to write/read what we need. 
// Ideally we import them, but importing ES6 modules in this CommonJS script is annoying.
// Using inline schema defs for simplicity or requiring if they are CJS.
// The project uses ES modules (import/export).
// So this script should be .mjs to import them, but then we fight with module resolution.
// Easier to just define minimal schemas here.

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const SubscriptionSchema = new Schema({
    user: Schema.Types.ObjectId, product: Schema.Types.ObjectId, quantity: Number, frequency: String, status: String,
    startDate: Date, nextOrderDate: Date, preferredTime: String, preferredDay: Number, productName: String
}, { strict: false });

const OrderSchema = new Schema({
    user: Schema.Types.ObjectId, orderNumber: String, shippingAddress: Object, status: String
}, { strict: false });

const CustomerSchema = new Schema({
    phone: String, name: String, email: String, address: String, city: String, state: String, pincode: String
}, { strict: false });

const ProductSchema = new Schema({
    name: String, stockQuantity: Number
}, { strict: false });

// DB Config
const URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

const TEST_USER_ID = '699999999999999999999999';

async function run() {
  try {
    console.log('🔌 Connecting to DB...');
    await mongoose.connect(URI);
    console.log('✅ Connected.');

    const Sub = mongoose.model('Subscription', SubscriptionSchema);
    const Ord = mongoose.model('Order', OrderSchema);
    const Cust = mongoose.model('Customer', CustomerSchema);
    const Prod = mongoose.model('Product', ProductSchema);

    console.log('🧹 Cleaning up test data...');
    await Sub.deleteMany({ user: TEST_USER_ID });
    await Ord.deleteMany({ user: TEST_USER_ID });
    await Cust.deleteOne({ _id: TEST_USER_ID });

    // 1. Find a Product
    const product = await Prod.findOne({ stockQuantity: { $gt: 10 } });
    if (!product) throw new Error("No product with stock found");
    console.log(`📦 Using Product: ${product.name} (${product._id})`);

    // 2. Create Customer Profile (The Fallback Source)
    await Cust.create({
        _id: TEST_USER_ID,
        phone: "9998887776",
        name: "Fallback Test User",
        email: "fallback@example.com",
        address: "777 Verification Blvd",
        city: "TestCity",
        state: "TestState",
        pincode: "123456"
    });
    console.log(`👤 Created Customer Profile for ${TEST_USER_ID}`);

    // 3. Create Subscription (Due Now)
    await Sub.create({
        user: TEST_USER_ID,
        product: product._id,
        quantity: 1,
        frequency: "Daily",
        status: "Active",
        startDate: new Date(),
        nextOrderDate: new Date(Date.now() - 10000), // Due 10 secs ago
        preferredTime: "00:00",
        productName: product.name
    });
    console.log(`📅 Created DUE Subscription.`);

    // 4. Trigger Cron API
    // (Using fetch via subprocess or dynamic import is hard, let's just use http standard lib or fetch if Node 18+)
    console.log('🚀 Triggering Cron API...');
    
    // Using a simple fetch helper since we are in async function
    const res = await fetch('http://localhost:3001/api/cron/process-subscriptions?source=test');
    const json = await res.json();
    
    console.log('⚙️ Cron Result:', JSON.stringify(json.results));

    // 5. Verify Order Created
    const order = await Ord.findOne({ user: TEST_USER_ID });
    
    if (order) {
        console.log(`✅ ORDER CREATED: ${order.orderNumber}`);
        console.log(`📍 Order Address:`, order.shippingAddress);
        
        if (order.shippingAddress?.addressLine1 === "777 Verification Blvd") {
            console.log(`🎉 SUCCESS: Address correctly matched fallback profile!`);
        } else {
            console.error(`❌ FAIL: Address mismatch. Got: ${order.shippingAddress?.addressLine1}`);
        }
    } else {
        console.error(`❌ FAIL: No order was created.`);
    }

  } catch (e) {
    console.error('🔥 Error:', e);
  } finally {
    // Cleanup? Maybe keep for inspection.
     await mongoose.disconnect();
  }
}

run();
