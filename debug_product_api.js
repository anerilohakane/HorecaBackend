const http = require('http');

const API_URL = "http://localhost:3001/api/products?q=test";

console.log(`🚀 Testing Product API: ${API_URL}`);

http.get(API_URL, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    let data = '';
    
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Response JSON:", JSON.stringify(json, null, 2));
        } catch (e) {
            console.log("Response Body (Not JSON):", data);
        }
    });

}).on('error', (err) => {
    console.error("❌ Request Error:", err.message);
});
