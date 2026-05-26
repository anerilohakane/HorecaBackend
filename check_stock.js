const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin";

async function query() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
        const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

        const products = await Product.find({}).lean();
        console.log("Total products:", products.length);
        
        // Print active products and their stock
        const activeProducts = products.filter(p => p.isActive !== false);
        console.log("\nActive Products Stock Information:");
        activeProducts.forEach(p => {
            console.log(`- ${p.name || p.title} (${p._id}): Price: ${p.price}, Stock: ${p.stockQuantity}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
}

query();
