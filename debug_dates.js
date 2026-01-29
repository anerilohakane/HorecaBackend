// Native fetch
const BASE_URL = 'http://localhost:3001/api';

async function run() {
  try {
    console.log('🔍 Inspecting Subscription Dates...');
    const now = new Date();
    // 1. Get User
    const orderRes = await fetch(`${BASE_URL}/order?limit=5`);
    const orderJson = await orderRes.json();
    let userId = orderJson.orders?.[0]?.user?._id || orderJson.orders?.[0]?.user || '693fb21c7b2b7ea2f4e162a3';
    if(typeof userId === 'object') userId = userId._id || userId.id;
    console.log(`👤 User ID: ${userId}`);

    // 2. Get Subs
    const subRes = await fetch(`${BASE_URL}/subscriptions?userId=${userId}`);
    const subJson = await subRes.json();
    const subs = subJson.data || [];

    // 3. Diagnostics for this User
    console.log(`\n🩺 DIAGNOSTICS for User ${userId}:`);
    
    // Address Check
    const lastOrdRes = await fetch(`${BASE_URL}/order?userId=${userId}&limit=1`);
    const lastOrdJson = await lastOrdRes.json();
    const lastOrder = lastOrdJson.orders?.[0];
    const customerRes = await fetch(`${BASE_URL}/customers/${userId}`);
    const customerJson = await customerRes.json();
    const customer = customerJson.data;

    let hasAddress = false;
    if (lastOrder?.shippingAddress?.addressLine1) {
        console.log(`✅ Address Source: Last Order (${lastOrder._id})`);
        hasAddress = true;
    } else if (customer?.address) {
        console.log(`✅ Address Source: Customer Profile`);
        hasAddress = true;
    } else {
        console.log(`❌ FAIL: No valid address found in Order History OR Profile.`);
    }

    // Stock & Status Check
    subs.forEach(sub => {
        const next = new Date(sub.nextOrderDate);
        if (next <= now) {
            console.log(`\nChecking Due Sub: ${sub.productName} (${sub._id})`);
            console.log(`   - Status: ${sub.status} ${sub.status === 'Active' ? '✅' : '❌'}`);
            console.log(`   - Stock:  ${sub.product?.stockQuantity ?? 'Unknown'} ${sub.product?.stockQuantity >= sub.quantity ? '✅' : '❌ (OOS)'}`);
            
            if (hasAddress && sub.status === 'Active' && (sub.product?.stockQuantity >= sub.quantity)) {
                console.log(`   🚀 VERDICT: SHOULD PROCESS.`);
            } else {
                console.log(`   🛑 VERDICT: BLOCKED.`);
            }
        }
    });

  } catch (err) {
    console.error('🔥 Error:', err);
  }
}

run();
