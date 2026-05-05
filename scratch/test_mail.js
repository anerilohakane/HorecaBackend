require('dotenv').config();
const { sendEmail } = require('../src/lib/mail');

async function test() {
  console.log("Testing email with user:", process.env.SMTP_USER);
  const result = await sendEmail({
    to: "gaikwadsameer422@gmail.com", // Test with owner's email first
    subject: "Test Claim Mail",
    html: "<h1>Test</h1>"
  });
  console.log("Result:", result);
}

test();
