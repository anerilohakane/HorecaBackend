import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";
import crypto from "crypto";

export async function POST(request) {
  await dbConnect();

  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: "Validation Failure: Token and new passphrase are required." }, { status: 400 });
    }

    // Token Hash to compare with DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const supplier = await Supplier.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!supplier) {
      return NextResponse.json({ success: false, error: "Security Alert: Individual reset token is invalid or has expired." }, { status: 401 });
    }

    // Update root password (pre-save hook will hash it)
    supplier.password = newPassword;
    supplier.passwordResetToken = undefined;
    supplier.passwordResetExpires = undefined;
    await supplier.save();

    return NextResponse.json({ 
      success: true, 
      message: "Security Protocol Reset Successful: You can now access your account with new credentials." 
    });

  } catch (err) {
    console.error("Reset Password Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
