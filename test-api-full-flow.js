const BACKEND_URL = "https://horeca-backend-six.vercel.app";
const TIMESTAMP = Date.now();
const EMAIL = `tester_${TIMESTAMP}@example.com`;
const PASSWORD = "testpassword123";

async function runTest() {
  try {
    // 1. REGISTER
    console.log(`[1] Registering ${EMAIL}...`);
    const regResp = await fetch(`${BACKEND_URL}/api/supplier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: "Test Labs INC",
        email: EMAIL,
        password: PASSWORD,
        phone: "9988776655",
        businessType: "other",
        status: "active" // Trying to set status directly (might be ignored by backend default 'pending')
      })
    });

    const regResult = await regResp.json();
    console.log("Register Status:", regResp.status);
    console.log("Register Response:", JSON.stringify(regResult, null, 2));

    if (!regResp.ok) {
       console.error("Stopping test because registration failed.");
       return;
    }

    // 2. LOGIN (Wait for deployment if not yet)
    console.log(`\n[2] Logging in as ${EMAIL}...`);
    const logResp = await fetch(`${BACKEND_URL}/api/supplier/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD
      })
    });

    const logResult = await logResp.json();
    console.log("Login Status:", logResp.status);
    console.log("Login JSON:", JSON.stringify(logResult, null, 2));

    if (logResp.status === 404) {
      console.warn("\nWARNING: Received 404. The /api/supplier/login route might not be deployed yet on Vercel.");
    }

  } catch (err) {
    console.error("Test Error:", err);
  }
}

runTest();
