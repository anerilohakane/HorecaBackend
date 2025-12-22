// app/api/suppliers/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";
import jwt from "jsonwebtoken";

// cloudinary server-side config - available if you want to process images server-side later
import cloudinary from "cloudinary";
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "fallback_access_token_secret";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    if (!body.email || !body.password) {
      return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
    }

    const existing = await Supplier.findOne({ email: body.email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 });
    }

    const supplier = new Supplier(body);
    await supplier.save();

    const safeObj = supplier.toObject();
    delete safeObj.password;

    // Generate token and set cookie (you asked previously to print token)
    const token = jwt.sign({ id: supplier._id.toString(), role: supplier.role || "supplier" }, ACCESS_SECRET, { expiresIn: `${TOKEN_MAX_AGE}s` });

    console.log("Token from register:", token);

    const cookie = `authToken=${token}; Path=/; HttpOnly; Max-Age=${TOKEN_MAX_AGE}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

    return NextResponse.json(
      { success: true, data: safeObj, token },
      {
        status: 201,
        headers: { "Set-Cookie": cookie }
      }
    );
  } catch (err) {
    console.error("POST /api/suppliers error", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  await dbConnect();
  try {
    const suppliers = await Supplier.find().limit(100).lean();
    return NextResponse.json({ success: true, data: suppliers });
  } catch (err) {
    console.error("GET /api/suppliers error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
