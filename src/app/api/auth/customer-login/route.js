import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";
import { logger } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json({ success: false, error: "Missing username/email or password" }, { status: 400 });
    }

    await dbConnect();

    // Find user by either username or email
    const user = await Customer.findOne({
      $or: [
        { username: identifier },
        { email: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Check if user has a password set (legacy users might only have OTP)
    if (!user.password) {
      return NextResponse.json({ success: false, error: "Please use OTP to login or reset your password." }, { status: 401 });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    await logger({ 
      level: 'info', 
      message: `Customer logged in: ${user.username || user.email}`, 
      action: 'CUSTOMER_LOGIN', 
      userId: user._id, 
      userModel: 'Customer', 
      metadata: { identifier }, 
      req 
    });

    // Create JWT
    const token = jwt.sign(
      { _id: user._id, phone: user.phone, category: user.category || "D", username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      data: {
        accessToken: token,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          name: user.name,
          businessName: user.businessName,
          category: user.category
        },
      },
    });
  } catch (err) {
    console.error("🔥 CUSTOMER LOGIN ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
