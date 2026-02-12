// Test script for Server-Side Search
// (Using native fetch in Node 18+)

const API_URL = "http://localhost:3001/api/products";

async function testSearch(query) {
    console.log(`\n🔎 Testing Search for: "${query}"`);
    try {
        const res = await fetch(`${API_URL}?q=${query}&limit=5`);
        const data = await res.json();

        if (data.success) {
            console.log(`✅ Success! Found ${data.data.items.length} items.`);
            data.data.items.forEach(item => {
                console.log(`   - ${item.name} (Category: ${item.category?.name})`);
            });
        } else {
            console.error("❌ API Error:", data.error);
        }
    } catch (err) {
        console.error("🚨 Network Error:", err.message);
    }
}

// Run tests
(async () => {
    await testSearch("oil");   // Should find products with "oil" in name or description
    await testSearch("z");     // Should find products with "z"
    await testSearch("xyz123"); // Should find nothing
})();
