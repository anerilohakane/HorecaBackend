const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  console.log("Connecting to MongoDB:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!");

  const db = mongoose.connection.db;

  console.log("\n--- PRODUCTS ---");
  const products = await db.collection("products").find({}).toArray();
  for (const p of products) {
    console.log(`Product: ${p._id} | Name: ${p.name} | SKU: ${p.sku}`);
  }

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(console.error);
