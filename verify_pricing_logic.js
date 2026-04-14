const mongoose = require('mongoose');

// Mock Product Schema for investigation
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  categoryPrices: {
    A: Number,
    B: Number,
    C: Number,
    D: Number,
    E: Number
  }
});

async function verifyPricing() {
  const MONGO_URI = "mongodb+srv://horeca:horeca123@cluster0.p7p9f.mongodb.net/horeca?retryWrites=true&w=majority&appName=Cluster0";
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
    
    // Find a product that likely has tiered pricing
    const product = await Product.findOne({ categoryPrices: { $exists: true } });
    
    if (!product) {
      console.log("❌ No product with categoryPrices found.");
      return;
    }

    console.log(`\nProduct found: ${product.name}`);
    console.log(`Base Price: ₹${product.price}`);
    console.log("Category Prices:", JSON.stringify(product.categoryPrices, null, 2));

    // Simulate price resolution for Tier A
    const userCategory = 'A';
    const resolvedPrice = (product.categoryPrices && product.categoryPrices[userCategory] > 0) 
      ? product.categoryPrices[userCategory] 
      : product.price;

    console.log(`\nSimulated Resolution for Tier ${userCategory}:`);
    console.log(`Resolved Price: ₹${resolvedPrice}`);

    if (resolvedPrice !== product.price) {
      console.log("✅ Tiered pricing resolution is working correctly (Tier A price differs from Base price).");
    } else {
      console.log("ℹ️ Tier A price is the same as Base price or not set.");
    }

  } catch (err) {
    console.error("❌ Verification failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

verifyPricing();
