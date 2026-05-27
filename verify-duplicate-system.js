const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://chaitanyakhairmodedelxn_db_user:root%40123@ac-3nps7cj-shard-00-00.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-01.2muyghy.mongodb.net:27017,ac-3nps7cj-shard-00-02.2muyghy.mongodb.net:27017/?ssl=true&replicaSet=atlas-10cck0-shard-0&authSource=admin";
const API_BASE = "http://localhost:3001";

async function runTest() {
  try {
    console.log("🔌 Connecting to MongoDB for test data lookup...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected!");

    // 1. Fetch live models raw via mongodb driver to avoid Node ESM model resolution issues
    const db = mongoose.connection.db;
    
    console.log("🔍 Fetching a test customer, supplier, and product...");
    const customer = await db.collection("customers").findOne();
    const supplier = await db.collection("suppliers").findOne();
    const product = await db.collection("products").findOne({ stockQuantity: { $gt: 5 } });

    if (!customer || !supplier || !product) {
      throw new Error("❌ Required test data (customer, supplier, product) not found.");
    }

    console.log(`✅ Using Customer ID: ${customer._id}`);
    console.log(`✅ Using Supplier ID: ${supplier._id}`);
    console.log(`✅ Using Product ID: ${product._id} (${product.name})`);

    // Clean up any old verification orders
    console.log("🧹 Cleaning up old test orders...");
    await db.collection("orders").deleteMany({ "shippingAddress.fullName": "Duplicate Verification Customer" });

    // 2. Place Order 1 via HTTP (Customer direct)
    console.log("\n📡 Placing Order 1 (Source: Customer) via REST API...");
    const res1 = await fetch(`${API_BASE}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: customer._id.toString(),
        shippingAddress: {
          fullName: "Duplicate Verification Customer",
          addressLine1: "456 Test Lane",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          phone: "9876543210"
        },
        items: [
          {
            product: product._id.toString(),
            quantity: 1
          }
        ],
        paymentMethod: "cod"
      })
    });

    const data1 = await res1.json();
    if (!data1.success) {
      throw new Error(`❌ Failed to place Order 1: ${data1.error}`);
    }
    const order1 = data1.order;
    console.log(`✅ Order 1 placed! Order Number: ${order1.orderNumber} (ID: ${order1._id})`);

    // 3. Place Order 2 via HTTP (Vendor / Supplier on behalf of Customer)
    console.log("\n📡 Placing Order 2 (Source: Vendor) via REST API...");
    const res2 = await fetch(`${API_BASE}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId: supplier._id.toString(),
        shippingAddress: {
          fullName: "Duplicate Verification Customer",
          addressLine1: "456 Test Lane",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
          phone: "9876543210"
        },
        items: [
          {
            product: product._id.toString(),
            quantity: 1
          }
        ],
        paymentMethod: "cod"
      })
    });

    const data2 = await res2.json();
    if (!data2.success) {
      throw new Error(`❌ Failed to place Order 2: ${data2.error}`);
    }
    const order2 = data2.order;
    console.log(`✅ Order 2 placed! Order Number: ${order2.orderNumber} (ID: ${order2._id})`);

    // 4. Verify Duplicate Group Status in Database
    console.log("\n🔍 Verifying duplicate engine classification in Database...");
    const dbOrder1 = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(order1._id) });
    const dbOrder2 = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(order2._id) });

    console.log(`Order 1 -> Source: ${dbOrder1.orderSource} | isDuplicateOrder: ${dbOrder1.isDuplicateOrder} | status: ${dbOrder1.status}`);
    console.log(`Order 2 -> Source: ${dbOrder2.orderSource} | isDuplicateOrder: ${dbOrder2.isDuplicateOrder} | status: ${dbOrder2.status}`);

    if (dbOrder1.isDuplicateOrder !== false || dbOrder2.isDuplicateOrder !== true) {
      throw new Error("❌ Duplicate engine did not flag the orders correctly.");
    }
    if (dbOrder2.duplicateStatus !== "pending_review") {
      throw new Error(`❌ Expected duplicateStatus 'pending_review', got '${dbOrder2.duplicateStatus}'`);
    }
    console.log("✅ Classification Check Passed!");

    // 5. Test resolution via API endpoint
    console.log("\n📡 Resolving duplicate group (MERGE) via REST API...");
    const resResolve = await fetch(`${API_BASE}/api/order/duplicates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "merge",
        groupId: dbOrder2.duplicateGroupId.toString()
      })
    });

    const dataResolve = await resResolve.json();
    if (!dataResolve.success) {
      throw new Error(`❌ Resolve API failed: ${dataResolve.error}`);
    }
    console.log(`✅ Resolve Response: ${dataResolve.message}`);

    // 6. Verify that duplicate shadow order has been cancelled and master remains pending
    const dbOrder1After = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(order1._id) });
    const dbOrder2After = await db.collection("orders").findOne({ _id: new mongoose.Types.ObjectId(order2._id) });

    console.log(`After Resolve -> Order 1 Status: ${dbOrder1After.status} | duplicateStatus: ${dbOrder1After.duplicateStatus}`);
    console.log(`After Resolve -> Order 2 Status: ${dbOrder2After.status} | duplicateStatus: ${dbOrder2After.duplicateStatus}`);

    if (dbOrder1After.status !== "pending" || dbOrder2After.status !== "cancelled") {
      throw new Error("❌ Resolution failed: duplicate shadow order was not cancelled, or master order was affected.");
    }
    console.log("✅ Resolution Check Passed!");

    // 7. Cleanup test orders
    console.log("\n🧹 Cleaning up test orders from Database...");
    await db.collection("orders").deleteMany({ "shippingAddress.fullName": "Duplicate Verification Customer" });

    console.log("\n🎉 ALL DUPLICATE SYSTEM INTEGRATION TESTS PASSED!");
    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error("\n💥 Test Script Failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTest();
