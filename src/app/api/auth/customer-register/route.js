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
    const { username, password, email, phone, businessName, gstNumber, licenseImage, name } = body;

    if (!username || !password || !email || !phone || !businessName || !licenseImage) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await Customer.findOne({
      $or: [{ username }, { email }, { phone }]
    });

    if (existingUser) {
      let conflictField = "User";
      if (existingUser.username === username) conflictField = "Username";
      else if (existingUser.email === email) conflictField = "Email";
      else if (existingUser.phone === phone) conflictField = "Phone number";
      
      return NextResponse.json({ success: false, error: `${conflictField} already exists` }, { status: 409 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Normalize Phone
    const numericPhone = phone.replace(/\D/g, "");
    const standardizedPhone = (numericPhone.length === 10) ? `+91${numericPhone}` : 
                              (numericPhone.length === 12 && numericPhone.startsWith("91")) ? `+${numericPhone}` :
                              phone.trim();

    // Create user
    const newUser = await Customer.create({
      username,
      password: hashedPassword,
      email: email.toLowerCase(),
      phone: standardizedPhone,
      name: name || null,
      businessName,
      gstNumber: gstNumber || null,
      licenseImage,
      lastLoginAt: new Date()
    });

    await logger({ 
      level: 'info', 
      message: `New customer registered: ${newUser.username}`, 
      action: 'CUSTOMER_REGISTERED', 
      userId: newUser._id, 
      userModel: 'Customer', 
      metadata: { username, email }, 
      req 
    });

    // Create JWT
    const token = jwt.sign(
      { _id: newUser._id, phone: newUser.phone, category: newUser.category || "D", username: newUser.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      data: {
        accessToken: token,
        user: {
          id: newUser._id,
          username: newUser.username,
          phone: newUser.phone,
          email: newUser.email,
          name: newUser.name,
          businessName: newUser.businessName,
          category: newUser.category
        },
      },
    });
  } catch (err) {
    console.error("🔥 CUSTOMER REGISTRATION ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
