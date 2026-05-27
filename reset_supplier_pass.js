const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = "mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin";

async function reset() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const SupplierSchema = new mongoose.Schema({}, { strict: false, collection: 'suppliers' });
        const Supplier = mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);

        const newHash = bcrypt.hashSync("Admin@123", 10);
        const res = await Supplier.updateOne({ email: "habit@gmail.com" }, { $set: { password: newHash } });
        console.log("UPDATE RESULT SUPPLIER:", res);

        process.exit(0);
    } catch (err) {
        console.error("Error resetting password:", err);
        process.exit(1);
    }
}

reset();
