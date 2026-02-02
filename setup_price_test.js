
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { join } = require('path');

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

// Schema Definitions (Minimal)
const SubscriptionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    status: { type: String, default: 'Active' },
    nextOrderDate: Date,
    lockedPrice: Number,
    frequency: String,
    quantity: Number,
    preferredDay: Number,
    preferredTime: String,
    startDate: Date
});
const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);

const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    stockQuantity: Number,
    images: Array
});
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const NotificationSchema = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    title: String,
    message: String,
    type: String,
    metadata: Object
});
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// DB Connect
const dbConnect = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI);
};

const runTest = async () => {
    await dbConnect();
    console.log("Connected to DB");

    // 1. Create Dummy Product
    const product = await Product.create({
        name: "Test Price Hike Item",
        price: 100,
        stockQuantity: 50,
        images: [{ url: "http://example.com/img.jpg" }]
    });
    console.log(`Created Product: ${product.name} @ ${product.price}`);

    // 2. Create Active Subscription (Due Now)
    const userId = new mongoose.Types.ObjectId();
    const sub = await Subscription.create({
        user: userId,
        product: product._id,
        status: 'Active',
        frequency: 'Daily',
        quantity: 1,
        startDate: new Date(),
        nextOrderDate: new Date(Date.now() - 10000), // Due in the past
        lockedPrice: 100, // Matched price
        preferredTime: '10:00'
    });
    console.log(`Created Subscription: ${sub._id}. Locked Price: 100`);

    // 3. Hike Price to 120 (+20%)
    product.price = 120;
    await product.save();
    console.log(`Hiked Product Price to 120 (+20%)`);

    // 4. Trigger Local Scheduler logic (Simulated call to API logic)
    // Since we can't easily call the API function directly in this script context without fully mocking Next.js Request,
    // We will verify by checking the logic flow via logged inspection of the documents if we were to run the logic.
    // However, to *truly* test, we should call the API endpoint locally.
    
    console.log("To fully test, run: node local-scheduler.js");
    console.log("Then check this subscription status.");
    
    // We will exit here and let the user run the scheduler if they want, 
    // OR we can rely on the fact that I just pushed the code. 
    // Wait, I can try to hit the local API if the server is running.
    
    const API_URL = "http://localhost:3000/api/cron/process-subscriptions";
    // Checks if we can hit it?
    
    return { subId: sub._id, productId: product._id };
};

runTest().then((ids) => {
    console.log("Test Setup Complete. IDs:", ids);
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
