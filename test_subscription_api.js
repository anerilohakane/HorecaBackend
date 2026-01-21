const https = require('https');

const data = JSON.stringify({
  userId: '693fb21c7b2b7ea2f4e162a3', // Using ID from user logs
  productId: '695e5b88fd1a940d49cfe0de',
  quantity: 1,
  frequency: 'Once',
  startDate: '2026-01-23',
  preferredTime: '10:00',
  timezoneOffset: -330
});

const options = {
  hostname: 'horeca-backend-six.vercel.app',
  path: '/api/subscriptions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
