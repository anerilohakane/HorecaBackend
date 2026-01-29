const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

const Schema = mongoose.Schema;
const Order = mongoose.model('Order', new Schema({ 
    user: Schema.Types.ObjectId, 
    orderNumber: String,
    metadata: Object,
    createdAt: Date,
    total: Number
}, { strict: false }));

async function checkLastOrder() {
    try {
        await mongoose.connect(MONGODB_URI);
        const lastOrder = await Order.findOne().sort({ createdAt: -1 });

        if (lastOrder) {
            console.log("--------------------------------------------------");
            console.log(`LATEST ORDER: ${lastOrder.orderNumber}`);
            console.log(`Created At: ${lastOrder.createdAt.toISOString()}`); // UTC
            console.log(`Created At (Local): ${lastOrder.createdAt.toString()}`);
            console.log(`Metadata:`, lastOrder.metadata);
            
            // Check if it was manual or auto
            if (lastOrder.metadata && lastOrder.metadata.mode === 'MANUAL_FORCE') {
                console.log("Source: 🖐️ MANUAL SCRIPT");
            } else {
                console.log("Source: 🤖 AUTOMATION (GitHub/Vercel)");
            }
        } else {
            console.log("No orders found.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkLastOrder();
