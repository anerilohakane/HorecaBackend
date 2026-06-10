async function fixDB() {
  const BACKEND_URL = 'https://horeca-backend-six.vercel.app';
  try {
    const res = await fetch(`${BACKEND_URL}/api/products?limit=1000`);
    let text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch(e) {
      console.log('Failed to parse API products:', text.slice(0, 100));
      return;
    }
    
    if (!json.success || !json.data) {
      console.log('Failed to fetch products');
      return;
    }
    
    const products = Array.isArray(json.data) ? json.data : (json.data.items || []);
    let fixedCount = 0;
    
    for (const p of products) {
      if (p.basePrice !== undefined && p.assuredMargin !== undefined) {
        const expectedPrice = p.basePrice + (p.basePrice * p.assuredMargin / 100);
        if (p.price !== expectedPrice) {
          console.log(`Fixing ${p.name}: ${p.price} -> ${expectedPrice}`);
          
          const patchRes = await fetch(`${BACKEND_URL}/api/products/${p._id || p.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: expectedPrice })
          });
          
          let patchText = await patchRes.text();
          try {
            const patchJson = JSON.parse(patchText);
            if (patchJson.success) {
              fixedCount++;
            } else {
              console.error(`Failed to fix ${p.name}:`, patchJson);
            }
          } catch(e) {
            console.error(`Failed to parse PATCH response for ${p.name}:`, patchText);
          }
        }
      }
    }
    
    console.log(`Fixed ${fixedCount} products.`);
  } catch (err) {
    console.error('Error:', err);
  }
}

fixDB();
