const LOCAL_URL = "http://localhost:3001";
const TIMESTAMP = Date.now();
const EMAIL = `tester_${TIMESTAMP}@example.com`;
const PASSWORD = "testpassword123";

async function runLocalTest() {
  try {
    // 1. REGISTER
    console.log(`[1] Registering ${EMAIL}...`);
    const regResp = await fetch(`${LOCAL_URL}/api/supplier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: "Local Test INC",
        email: EMAIL,
        password: PASSWORD,
        phone: "9988776655",
        businessType: "other",
        status: "active"
      })
    });

    const regResult = await regResp.json();
    console.log("Register Status:", regResp.status);
    console.log("Register Response:", JSON.stringify(regResult, null, 2));

    if (!regResp.ok) return;

    // 2. LOGIN
    console.log(`\n[2] Logging in as ${EMAIL}...`);
    const logResp = await fetch(`${LOCAL_URL}/api/supplier/login`, {
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

  } catch (err) {
    console.error("Test Error:", err);
  }
}

runLocalTest();
