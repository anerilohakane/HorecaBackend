import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";
import { logger } from "@/lib/logger";
import { sendCustomerPasswordResetEmail } from "@/lib/mail";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    await dbConnect();

    // Find customer by email (case-insensitive)
    const customer = await Customer.findOne({ email: email.toLowerCase() });
    
    if (!customer) {
      return NextResponse.json({ 
        success: false, 
        error: "No account found with this email address. Please check and try again." 
      }, { status: 404 });
    }

    // Generate a reset token (valid for 7 days, matching the welcome email)
    const resetToken = jwt.sign(
      { customerId: customer._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send the password reset email
    let mailResult = null;
    try {
      mailResult = await sendCustomerPasswordResetEmail({
        email: customer.email,
        name: customer.name,
        businessName: customer.businessName,
        resetToken: resetToken,
      });

      console.log(`[Forgot Password Email Result] Success: ${mailResult?.success} | Error: ${mailResult?.error}`);
    } catch (mailErr) {
      console.error("[Email Notification Error] Failed to send forgot password email:", mailErr);
      return NextResponse.json({ success: false, error: "Failed to send reset email. Please try again later." }, { status: 500 });
    }

    await logger({
      level: 'info',
      message: `Password reset requested for customer: ${customer.username || customer.email}`,
      action: 'CUSTOMER_PASSWORD_RESET_REQUESTED',
      userId: customer._id,
      userModel: 'Customer',
      req
    });

    return NextResponse.json({ 
      success: true, 
      message: "If an account exists with this email, a password reset link has been sent." 
    });

  } catch (err) {
    console.error("Error in customer forgot password:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
