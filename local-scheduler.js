const { exec } = require('child_process');

// Config
const CRON_URL = 'https://horeca-backend-six.vercel.app/api/cron/process-subscriptions'; // Production URL
const INTERVAL_MS = 1000 * 60 * 1; // 1 Minute

console.log(`[LOCAL-SCHEDULER] Starting...`);
console.log(`[LOCAL-SCHEDULER] Target: ${CRON_URL}`);
console.log(`[LOCAL-SCHEDULER] Interval: ${INTERVAL_MS / 1000 / 60} minutes`);

function triggerCron() {
    const now = new Date().toISOString();
    console.log(`[${now}] Triggering Cron...`);
    
    // Use curl or fetch. Using curl via exec for simplicity or native fetch if Node 18+
    fetch(CRON_URL)
        .then(res => res.json())
        .then(data => {
            console.log(`[${now}] Success:`, JSON.stringify(data));
            if (data.results && data.results.ordersCreated > 0) {
                console.log(`🎉 ORDER CREATED!`);
            }
        })
        .catch(err => {
            console.error(`[${now}] Failed:`, err.message);
            console.log(`Make sure your Next.js server is running on port 3001!`);
        });
}

// Initial Run
triggerCron();

// Scheduled Run
setInterval(triggerCron, INTERVAL_MS);
