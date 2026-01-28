// Native fetch
const BASE_URL = 'http://localhost:3001/api';

async function run() {
  try {
    // 1. Get a product
    console.log('Fetching products...');
    const prodRes = await fetch(`${BASE_URL}/products?limit=20`);
    const prodJson = await prodRes.json();
    const items = prodJson.data?.items || [];
    const product = items.find(p => p.stockQuantity > 10);

    if (!product) { console.error('No product found'); return; }
    console.log(`Using Product: ${product.name} (${product._id})`);

    // 2. Get a User (via Orders if possible, or just use a known valid one if we can confirm)
    // Let's try to list ORDERS and pick a user from there.
    const orderRes = await fetch(`${BASE_URL}/order?limit=5`);
    const orderJson = await orderRes.json();
    let userId = orderJson.orders?.[0]?.user?._id || orderJson.orders?.[0]?.user;
    
    // Fallback if no orders: We can't easily "list users". 
    // We will try the ID from test_subscription_api.js as a hail mary if order lookup fails.
    if (!userId) userId = '693fb21c7b2b7ea2f4e162a3';
    
    // Normalize ID if it's an object
    if (typeof userId === 'object') userId = userId._id || userId.id;

    console.log(`Using User ID: ${userId}`);

    // 3. Create a Subscription due TODAY/NOW
    const subPayload = {
      userId: userId,
      productId: product._id,
      quantity: 1,
      frequency: 'Daily',
      startDate: new Date().toISOString().split('T')[0], // Today
      preferredTime: '00:00', // Midnight today => should be past due
      preferredDay: new Date().getDate(),
      timezoneOffset: -330
    };

    console.log('Creating Test Subscription...');
    const createRes = await fetch(`${BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subPayload)
    });
    const createJson = await createRes.json();
    
    if (!createJson.success) {
        console.error('Failed to create sub:', createJson);
        // If user not found, we are stuck.
        return;
    }
    const subId = createJson.data._id;
    console.log(`Created Subscription: ${subId}`);
    console.log(`Next Order Date (Server Assigned): ${createJson.data.nextOrderDate}`);

    // 4. Trigger Cron Check (simulation)
    // We call the API directly and see if it picks it up.
    console.log('Triggering Cron...');
    const cronRes = await fetch(`${BASE_URL}/cron/process-subscriptions?source=debug`);
    const cronJson = await cronRes.json();
    // console.log('Cron Response:', JSON.stringify(cronJson, null, 2));
    console.log(`Cron Result: processed=${cronJson.results?.processed}, created=${cronJson.results?.ordersCreated}`);

    if (cronJson.results?.processed > 0) {
        console.log('✅ Cron picked up the subscription!');
    } else {
        console.log('❌ Cron DID NOT pick up the subscription.');
        console.log('Debug Hint: Check server logs for [CRON] output.');
        
        // Check the sub again to see if dates are weird
        const checkRes = await fetch(`${BASE_URL}/subscriptions?userId=${userId}`);
        const checkJson = await checkRes.json();
        const mySub = checkJson.data?.find(s => s._id === subId);
        if(mySub) {
             console.log('My Sub Current State:', mySub);
             const now = new Date();
             const next = new Date(mySub.nextOrderDate);
             console.log(`Now (Local Script): ${now.toISOString()}`);
             console.log(`Next (DB): ${next.toISOString()}`);
             console.log(`Is Due? ${next <= now}`);
        }
    }

  } catch (err) {
    console.error(err);
  }
}

run();
