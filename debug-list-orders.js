
const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        // Minimal Order Schema for listing
        const Order = mongoose.models.Order || mongoose.model("Order", new mongoose.Schema({ 
            user: mongoose.Schema.Types.ObjectId,
            status: String, 
            orderNumber: String,
            total: Number,
            driverLocation: mongoose.Schema.Types.Mixed
        }, { timestamps: true, strict: false }));

        const orders = await Order.find().sort({ createdAt: -1 }).limit(5);

        const result = {
            now: new Date().toISOString(),
            orders: orders.map(o => ({
                id: o._id,
                orderNumber: o.orderNumber,
                status: o.status,
                total: o.total,
                driverLocation: o.driverLocation,
                created: o.createdAt
            }))
        };

        fs.writeFileSync('debug_list_orders.json', JSON.stringify(result, null, 2));
        console.log("Written to debug_list_orders.json");
        
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
        fs.writeFileSync('debug_list_orders.json', JSON.stringify({ error: e.message }));
    }
}
run();
