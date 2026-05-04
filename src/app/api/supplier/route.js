// app/api/suppliers/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";
import Product from "@/lib/db/models/product";
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

    const { email, phone, gstNumber, panNumber } = body;
    
    const existing = await Supplier.findOne({ 
      $or: [
        { email: email?.toLowerCase().trim() },
        { phone },
        { gstNumber },
        { panNumber }
      ] 
    });

    if (existing) {
      let conflictField = "Credential";
      if (existing.email === email?.toLowerCase().trim()) conflictField = "Email";
      else if (existing.phone === phone) conflictField = "Phone Number";
      else if (existing.gstNumber === gstNumber) conflictField = "GST Number";
      else if (existing.panNumber === panNumber) conflictField = "PAN ID";

      return NextResponse.json({ 
        success: false, 
        error: `${conflictField} is already registered in the central system.` 
      }, { status: 400 });
    }

    const supplier = new Supplier(body);
    await supplier.save();

    // Create products in the global Product collection
    if (body.products && Array.isArray(body.products)) {
      for (const p of body.products) {
        const productDoc = new Product({
          supplierId: supplier._id,
          name: p.productName,
          sku: p.productCode,
          categoryId: p.category || undefined,
          subcategoryId: p.subcategory || undefined,
          unit: p.uom,
          basePrice: Number(p.basePrice || 0),
          assuredMargin: Number(p.assuredMargin || 0),
          poTemplateId: p.poTemplateId || undefined,
          images: p.image ? [{ url: p.image, publicId: `sup_${supplier._id}_${Date.now()}`, isMain: true }] : []
        });
        await productDoc.save();
      }
    }

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
      const errors = Object.values(err.errors).map((e) => e.message);
      return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message, details: err.details || [] }, { status: 500 });
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
