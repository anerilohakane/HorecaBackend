const http = require('http');

const API_URL = "http://localhost:3001/api/cron/process-subscriptions?source=simulation";

console.log("⏰ Starting Local Cron Simulator...");
console.log(`Target: ${API_URL}`);
console.log("This script will trigger the subscription processor every 30 seconds.");
console.log("Press Ctrl+C to stop.");

function triggerCron() {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🚀 Triggering Cron API...`);
    
    http.get(API_URL, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
             console.log(`[${new Date().toLocaleTimeString()}] ✅ Status: ${res.statusCode}`);
             try {
                 const json = JSON.parse(data);
                 console.log("Result:", JSON.stringify(json.results || json, null, 2));
             } catch (e) {
                 console.log("Body:", data.substring(0, 100) + "...");
             }
        });
    }).on('error', (err) => {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Error: ${err.message}`);
        console.log("Make sure the Backend Server is running on port 3001!");
    });
}

// Trigger immediately, then interval
triggerCron();
setInterval(triggerCron, 30000); // Every 30 seconds
