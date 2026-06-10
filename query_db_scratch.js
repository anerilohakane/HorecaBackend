const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin";

async function query() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const SupplierSchema = new mongoose.Schema({}, { strict: false, collection: 'suppliers' });
        const Supplier = mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);

        const supplier = await Supplier.findOne({ _id: "6a02fd421b276ece052c5fab" }).lean();
        console.log("SUPPLIER RESULT:", JSON.stringify(supplier, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
}

query();
