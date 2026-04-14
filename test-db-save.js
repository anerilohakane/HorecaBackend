
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI missing in .env");
  process.exit(1);
}

// Minimal Schema to test
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  categoryPrices: {
    A: { type: Number, default: 0 },
    B: { type: Number, default: 0 },
    C: { type: Number, default: 0 },
    D: { type: Number, default: 0 },
    E: { type: Number, default: 0 }
  }
}, { strict: true });

async function test() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const Product = mongoose.models.TestProduct || mongoose.model("TestProduct", productSchema, "products");

    // Find first product
    const p = await Product.findOne();
    if (!p) {
      console.log("No products found to test.");
      process.exit(0);
    }

    console.log("Testing on product:", p.name, "(id:", p._id, ")");
    console.log("Current Prices:", p.categoryPrices);

    const testPrices = { A: 250, B: 220, C: 200, D: 180, E: 150 };
    p.categoryPrices = testPrices;
    
    // Explicitly mark as modified for nested object
    p.markModified('categoryPrices');
    
    await p.save();
    console.log("Product saved successfully.");

    const p2 = await Product.findById(p._id);
    console.log("Verified Prices from DB:", p2.categoryPrices);

    if (p2.categoryPrices.A === 250) {
      console.log("SUCCESS: Category prices verified in DB.");
    } else {
      console.log("FAILURE: Prices did not match after save.");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();
