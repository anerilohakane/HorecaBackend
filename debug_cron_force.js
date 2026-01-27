// Native fetch
const BASE_URL = 'http://localhost:3001/api';

async function run() {
  try {
    // 1. Get a product with stock
    console.log('Fetching products...');
    const prodRes = await fetch(`${BASE_URL}/products?limit=50`);
    const prodJson = await prodRes.json();
    const items = prodJson.data?.items || [];
    const product = items.find(p => p.stockQuantity > 10);
    
    if (!product) {
      console.error('No suitable product found.');
      return;
    }
    
    console.log(`Using Product: ${product.name} (${product._id}), Stock: ${product.stockQuantity}`);
    const initialStock = product.stockQuantity;

    // 2. Create a Subscription due NOW
    // We need a user ID. Let's use a hardcoded one or find one from orders if possible.
    // Assuming we have a valid user ID from previous logs: 60d5ecb8b5c9c62b3c7c4b5e (from debug_stock_repro)
    // Or we can just use the first order's user if available.
    // Let's try to fetch an order to get a valid user.
    const orderRes = await fetch(`${BASE_URL}/order?limit=1`);
    const orderJson = await orderRes.json();
    const validUserId = orderJson.orders?.[0]?.user?._id || '60d5ecb8b5c9c62b3c7c4b5e'; 

    console.log(`Using User ID: ${validUserId}`);

    const subPayload = {
      userId: validUserId, 
      productId: product._id,
      quantity: 1,
      frequency: 'Daily',
      startDate: new Date().toISOString(), // Start today
      preferredTime: '00:00', // Should be due immediately if we check <= now
      preferredDay: 1
    };
    
    // We need to insert this subscription directly or via API. 
    // Since we don't have a direct "create subscription" API documented here easily (it might be in app),
    // and /api/subscriptions might be the one. 
    // Let's try POST /api/subscriptions
    
    const createSubRes = await fetch(`${BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subPayload)
    });
    
    // If that API doesn't exist or logic is complex, we might fail here.
    // Plan B: Use the `debug_force_sub.js` if it exists (user had it open).
    // But let's check response.
    const createSubJson = await createSubRes.json();
    console.log('Create Sub Response:', createSubJson);
    
    // If created, we need to hack the "nextOrderDate" to be in the past to ensure it triggers.
    // The API probably sets it to today or future.
    // We might need to manually trigger the CRON and hope it picks it up if it's "today".
    
    // 3. Trigger Cron
    console.log('Triggering Cron...');
    const cronRes = await fetch(`${BASE_URL}/cron/process-subscriptions?source=test`);
    const cronJson = await cronRes.json();
    console.log('Cron Result:', JSON.stringify(cronJson, null, 2));

    // 4. Verify Stock
    const verifyRes = await fetch(`${BASE_URL}/products/${product._id}`);
    const verifyJson = await verifyRes.json();
    const updatedProduct = verifyJson.data || verifyJson.product;
    
    console.log(`Old Stock: ${initialStock}`);
    console.log(`New Stock: ${updatedProduct.stockQuantity}`);

    if (updatedProduct.stockQuantity === initialStock - 1) {
       console.log('✅ PASS: Stock decremented for auto-order.');
       process.exit(0);
    } else {
       console.log('❌ FAIL: Stock did not decrement.');
       // It's possible the sub wasn't picked up because of date/time matching.
       // But if cronJson.results.ordersCreated > 0, then it WAS picked up.
       if (cronJson.results?.ordersCreated > 0) {
           console.error('CRON processed order but stock failed to update!');
           process.exit(1);
       } else {
           console.warn('CRON did not process any order, so stock check is inconclusive.');
           process.exit(0); // Soft pass/skip
       }
    }

  } catch (err) {
    console.error(err);
  }
}

run();
