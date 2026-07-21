import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ProductRequest from "@/lib/db/models/ProductRequest";
import { getTokenFromReq, verifyToken } from "@/lib/utils/auth";

export async function GET(req) {
  try {
    await dbConnect();
    
    // Auth for vendor
    const token = getTokenFromReq(req);
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const requests = await ProductRequest.find({ vendorId: decoded.id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("GET Product Requests error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    
    // Auth for vendor
    const token = getTokenFromReq(req);
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, sku, price, unit, categoryId, categoryName, imageUrl } = body;

    if (!name || !sku || !price || !categoryId || !unit) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const newRequest = new ProductRequest({
      vendorId: decoded.id,
      name,
      sku,
      price:
        typeof price === "string" ? parseFloat(price) : price,
      unit,
      categoryId,
      categoryName,
      imageUrl,
      status: "Pending"
    });

    await newRequest.save();
    return NextResponse.json({ success: true, message: "Request created successfully", data: newRequest });
  } catch (error) {
    console.error("POST Product Request error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
