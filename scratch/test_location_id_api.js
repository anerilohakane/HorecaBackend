const http = require('http');

const API_BASE = "http://localhost:3001/api/products";

function request(method, url, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  console.log("🚀 Starting LocationID Integration Test...");

  // 1. Create a Product with locationId
  console.log("\n1. Creating Product with locationId...");
  const createRes = await request('POST', API_BASE, {
    name: "3D Test Product " + Date.now(),
    price: 100,
    stockQuantity: 50,
    images: [{ url: "https://example.com/test.jpg", publicId: "test_id" }],
    categoryId: "fruits", // Using slug as fallback if exists
    locationId: "BIN-A1-SECTION-4"
  });

  if (createRes.statusCode !== 201 || !createRes.body.success) {
    console.error("❌ Failed to create product:", createRes.body);
    process.exit(1);
  }

  const productId = createRes.body.data._id;
  console.log(`✅ Product created with ID: ${productId}`);
  console.log(`📍 LocationID: ${createRes.body.data.locationId}`);

  if (createRes.body.data.locationId !== "BIN-A1-SECTION-4") {
    console.error("❌ LocationID mismatch in creation response!");
    process.exit(1);
  }

  // 2. Retrieve Product via GET and Verify
  console.log("\n2. Verifying LocationID via GET...");
  const getRes = await request('GET', `${API_BASE}/${productId}`);
  
  if (getRes.statusCode !== 200 || !getRes.body.success) {
    console.error("❌ Failed to retrieve product:", getRes.body);
    process.exit(1);
  }

  console.log(`✅ Retrieved LocationID: ${getRes.body.data.locationId}`);
  if (getRes.body.data.locationId !== "BIN-A1-SECTION-4") {
    console.error("❌ LocationID lost in GET response!");
    process.exit(1);
  }

  // 3. Update LocationID via PATCH
  console.log("\n3. Updating LocationID via PATCH...");
  const patchRes = await request('PATCH', `${API_BASE}/${productId}`, {
    locationId: "BIN-Z9-SECTION-99"
  });

  if (patchRes.statusCode !== 200 || !patchRes.body.success) {
    console.error("❌ Failed to update product:", patchRes.body);
    process.exit(1);
  }

  console.log(`✅ Updated LocationID: ${patchRes.body.data.locationId}`);
  if (patchRes.body.data.locationId !== "BIN-Z9-SECTION-99") {
    console.error("❌ LocationID update failed!");
    process.exit(1);
  }

  // 4. Cleanup
  console.log("\n4. Cleaning up test product...");
  const deleteRes = await request('DELETE', `${API_BASE}/${productId}`);
  if (deleteRes.statusCode === 200) {
    console.log("✅ Test product deleted successfully.");
  } else {
    console.warn("⚠️ Cleanup failed, product may still exist.");
  }

  console.log("\n🎉 ALL TESTS PASSED!");
}

runTest().catch(err => {
  console.error("💥 Test crashed:", err);
  process.exit(1);
});
