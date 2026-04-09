import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";
import { logger } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { phone, otp, lat, lng } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: "Missing fields" });
    }

    if (otp !== "123456") {
      return NextResponse.json({ success: false, error: "Invalid OTP" });
    }

    // 1️⃣ Normalize Phone and Find/Create Customer
    await dbConnect();
    
    // Normalize: strip non-digits
    const numericPhone = phone.replace(/\D/g, "");
    // Standardize: ensure +91 for 10-digit Indian numbers
    const standardizedPhone = (numericPhone.length === 10) ? `+91${numericPhone}` : 
                              (numericPhone.length === 12 && numericPhone.startsWith("91")) ? `+${numericPhone}` :
                              phone.trim();

    // Look for variations to match existing users
    const variations = [phone.trim(), standardizedPhone, numericPhone];
    if (numericPhone.length === 12 && numericPhone.startsWith("91")) {
        variations.push(numericPhone.slice(2)); // handle without 91
    } else if (numericPhone.length === 10) {
        variations.push("91" + numericPhone); // handle with 91
    }

    let user = await Customer.findOne({ phone: { $in: variations } });

    if (user) {
        console.log(`[AUTH] Found existing user: ${user._id} (${user.phone})`);
        user.lastLoginAt = new Date();
        if (lat !== undefined) user.lat = lat;
        if (lng !== undefined) user.lng = lng;
        await user.save();
        await logger({ level: 'info', message: `User logged in: ${user.phone}`, action: 'USER_LOGIN', userId: user._id, userModel: 'Customer', metadata: { phone: user.phone }, req });
    } else {
        console.log(`[AUTH] Creating new user for: ${standardizedPhone}`);
        user = await Customer.create({
            phone: standardizedPhone,
            lastLoginAt: new Date(),
            lat: lat || null,
            lng: lng || null
        });
        await logger({ level: 'info', message: `New user registered: ${user.phone}`, action: 'USER_REGISTERED', userId: user._id, userModel: 'Customer', metadata: { phone: user.phone }, req });
    }

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
