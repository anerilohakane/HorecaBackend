const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin";

async function query() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
        const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

        const CartSchema = new mongoose.Schema({}, { strict: false, collection: 'carts' });
        const Cart = mongoose.models.Cart || mongoose.model("Cart", CartSchema);

        const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'customers' });
        const User = mongoose.models.User || mongoose.model("User", UserSchema);

        // Find products
        const products = await Product.find({ name: { $in: [/HABIT Whole/i, /Idli Mix/i] } }).lean();
        console.log("--- PRODUCTS ---");
        console.log(JSON.stringify(products, null, 2));

        // Find carts
        const carts = await Cart.find({}).lean();
        console.log("\n--- ALL CARTS ---");
        console.log(JSON.stringify(carts, null, 2));

        for (const cart of carts) {
            const user = await User.findById(cart.userId).lean();
            console.log(`\nUser category for cart ${cart._id}:`, user ? user.category : 'N/A');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

query();
