const BACKEND_URL = "https://horeca-backend-six.vercel.app";

async function testLogin() {
  const payload = {
    email: "test@example.com", // Replace with a real supplier email
    password: "wrong_password"
  };

  try {
    console.log(`Testing Login at ${BACKEND_URL}/api/supplier/login`);
    const resp = await fetch(`${BACKEND_URL}/api/supplier/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await resp.json();
    console.log("Status:", resp.status);
    console.log("Response:", JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("Test Request Failed:", err);
  }
}

testLogin();
