import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ success: false, error: "Phone required" });

    // For development – static OTP
    const otp = "123456";

    await logger({ level: 'info', message: `OTP sent to: ${phone}`, action: 'OTP_SENT', metadata: { phone }, req });

    return NextResponse.json({ success: true, otp }); // Do not send OTP in production.
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
