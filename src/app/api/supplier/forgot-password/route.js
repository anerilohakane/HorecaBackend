import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";
import crypto from "crypto";
import { sendEmail } from "@/lib/mail";

export async function POST(request) {
  await dbConnect();

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Target email address is mandatory." }, { status: 400 });
    }

    const supplier = await Supplier.findOne({ email: email.toLowerCase().trim() });
    if (!supplier) {
      // For security reasons, don't confirm if user doesn't exist.
      // But in specific developer tasks, usually, error is okay.
      return NextResponse.json({ success: false, error: "Registry entry not found for this identity." }, { status: 404 });
    }

    // Generate Reset Token via Model Method
    const resetToken = supplier.generatePasswordResetToken();
    await supplier.save({ validateBeforeSave: false });

    // Construct Reset URL (Point to VendorSide dashboard frontend)
    // Assuming the user will configure the frontend reset URL
    const resetUrl = `${process.env.RESET_URL_BASE || "http://localhost:3000"}/reset-password/${resetToken}`;

    const mailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #fff; padding: 40px; border-radius: 20px; border: 1px solid #f1f5f9;">
        <h1 style="color: #f97316; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Unifoods Security Protocol</h1>
        <p style="font-size: 16px; margin-bottom: 20px;">Identity recovery has been requested for your vendor account. If this wasn't you, please ignore this email.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="background: #0f172a; color: #fff; text-decoration: none; padding: 18px 30px; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Reset Access Credentials</a>
        </div>
        <p style="font-size: 14px; color: #64748b;">This link will expire in 10 minutes. <br/> If the button above doesn't work, copy and paste this link:</p>
        <p style="font-size: 12px; word-break: break-all; color: #94a3b8;">${resetUrl}</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 11px; font-weight: 700; color: #cbd5e1; text-transform: uppercase;">
          Automated Transmission - Unifoods Inc.
        </div>
      </div>
    `;

    // Pre-flight check for SMTP config (Mandatory for Vercel deployment)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ 
        success: false, 
        error: "Incomplete Infrastructure Configuration: SMTP credentials missing on server." 
      }, { status: 500 });
    }

    const mailRes = await sendEmail({
      to: email,
      subject: "Unifoods Access Recovery Protocol",
      html: mailHtml,
    });

    if (!mailRes.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Transmission Node Failure: The recovery server was unable to reach your identity. Please verify registry status." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Reset token dispatched to your registered identity address." 
    });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
