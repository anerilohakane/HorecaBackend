const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin";

async function query() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const OrderSchema = new mongoose.Schema({}, { strict: false, collection: 'orders' });
        const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

        const orders = await Order.find({}).sort({ createdAt: -1 }).limit(10).lean();
        console.log("Recent Orders:");
        orders.forEach(o => {
            console.log(`- Order: ${o.orderNumber}, Source: ${o.orderSource}, Total: ${o.total}, Items Count: ${o.items?.length}, CreatedAt: ${o.createdAt}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
}

query();
