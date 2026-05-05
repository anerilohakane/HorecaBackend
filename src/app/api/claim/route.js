import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";
import Product from "@/lib/db/models/product";
import Supplier from "@/lib/db/models/supplier";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");

    let query = {};
    if (status && status !== "ALL") query.status = status;
    if (vendorId) query.vendorId = vendorId;

    console.log("[GET /api/claim] Query:", query);
    const claims = await Claim.find(query)
      .populate("vendorId", "businessName email phone")
      .populate("productId", "name sku basePrice assuredMargin")
      .populate("orderId", "orderNumber status placedAt total")
      .sort({ createdAt: -1 });

    console.log(`[GET /api/claim] Found ${claims.length} claims`);
    return NextResponse.json({ success: true, data: claims });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
