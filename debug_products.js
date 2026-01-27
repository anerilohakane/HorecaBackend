const axios = require('axios');

async function checkProducts() {
    try {
        console.log("🚀 hitting GET /api/products ...");
        const res = await axios.get('http://localhost:3001/api/products');
        console.log("✅ Success! Status:", res.status);
        console.log("Items:", res.data.data.items.length);
    } catch (err) {
        console.error("❌ Failed! Status:", err.response?.status);
        console.error("Error Data:", JSON.stringify(err.response?.data, null, 2));
    }
}

checkProducts();
