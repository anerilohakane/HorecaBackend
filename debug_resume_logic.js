const mongoose = require('mongoose');

// Ad-hoc models to avoid import/export/build issues
const SubscriptionSchema = new mongoose.Schema({}, { strict: false });
const ProductSchema = new mongoose.Schema({}, { strict: false });

// Register if not exists
const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

async function debugResume() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("🔌 Connected to DB");

        // 1. Find a Product
        const product = await Product.findOne({}).sort({createdAt: -1});
        if (!product) {
            console.log("No products found.");
            return;
        }
        // console.log(`📦 Product: ${product.name} (ID: ${product._id}) Stock: ${product.stockQuantity}`);

        // 2. Create a Dummy Paused Subscription (if none exists)
        let pausedSub = await Subscription.findOne({ status: 'Paused', product: product._id });
        if (!pausedSub) {
            console.log("⚠️ No Paused subscription found for this product. Creating a temporary one for test...");
            // Use simple create
            pausedSub = await Subscription.create({
                user: new mongoose.Types.ObjectId(), 
                product: product._id,
                quantity: 1,
                frequency: "Monthly",
                status: "Paused", 
                startDate: new Date(),
                nextOrderDate: new Date(),
                preferredTime: "10:00"
            });
            console.log(`✅ Created Temp Paused Sub: ${pausedSub._id}`);
        } else {
             console.log(`found Existing Paused Sub: ${pausedSub._id}`);
        }

        // 3. RUN THE EXACT LOGIC
        console.log("--- TESTING QUERY ---");
        const id = product._id.toString(); // API uses string
        const updatedStock = 999; 

        // Query used in route.js:
        const pausedSubs = await Subscription.find({
             product: id,
             status: 'Paused',
             quantity: { $lte: updatedStock }
        });

        console.log(`🔍 Query Result: Found ${pausedSubs.length} subscriptions.`);
        pausedSubs.forEach(s => console.log(`   - Sub ${s._id} | Status: ${s.status} | Qty: ${s.quantity}`));

        if (pausedSubs.length > 0) {
            console.log("✅ LOGIC WORKS LOCALLY.");
            // Test Update
            console.log("Attempting Update...");
             for (const sub of pausedSubs) {
                // Ensure manual update works
                sub.status = 'Active';
                await sub.save();
                console.log("   - Saved as Active (Test)");
                // Revert
                sub.status = 'Paused';
                await sub.save();
                console.log("   - Reverted to Paused");
            }

        } else {
            console.log("❌ LOGIC FAILED LOCALLY. Check query structure.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

debugResume();
