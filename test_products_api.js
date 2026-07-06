const jwt = require("jsonwebtoken");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "ae6vg43fnq6c36nx4qcn4g6rcq";
const customerId = "6a2a53be06e49bf47455dadd"; // Aneri Lohakane

async function run() {
  const token = jwt.sign(
    { _id: customerId, phone: "+9109322506730", category: "C", username: "aneri" },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  console.log("Generated Token:", token);

  const res = await axios.get("http://localhost:3003/api/products", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log("Status:", res.status);
  console.log("Response Products count:", res.data.data.items?.length);
  console.log("Response Products:", res.data.data.items?.map(p => ({ _id: p._id, name: p.name })));
}

run().catch(console.error);
