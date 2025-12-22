import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: "Missing fields" });
    }

    if (otp !== "123456") {
      return NextResponse.json({ success: false, error: "Invalid OTP" });
    }

    // 1️⃣ Create or fetch customer
    const customerRes = await fetch("https://horeca-backend-six.vercel.app/api/customers/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const customer = await customerRes.json();

    if (!customer.success) {
      return NextResponse.json({ success: false, error: customer.error });
    }

    const user = customer.data; // must include _id

    // 2️⃣ Create JWT
    const token = jwt.sign(
      { _id: user._id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      data: {
        accessToken: token,
        user,
      },
    });
  } catch (err) {
    console.error("🔥 VERIFY OTP ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
