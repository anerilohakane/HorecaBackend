const http = require('http');

console.log('Starting Cron Simulator... Checking every 30 seconds.');

function triggerCron() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/cron/process-subscriptions',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      const time = new Date().toLocaleTimeString();
      console.log(`[${time}] Cron Triggered. Status: ${res.statusCode}`);
      // console.log('Response:', body); // Uncomment for verbose logs
    });
  });

  req.on('error', (e) => {
    console.error(`[CRON ERROR] ${e.message}`);
  });

  req.end();
}

// Trigger immediately then interval
triggerCron();
setInterval(triggerCron, 30000);
