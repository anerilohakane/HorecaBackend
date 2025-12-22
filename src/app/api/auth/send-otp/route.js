import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ success: false, error: "Phone required" });

    // For development – static OTP
    const otp = "123456";

    return NextResponse.json({ success: true, otp }); // Do not send OTP in production.
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
