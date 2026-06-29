import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PriceNegotiation from "@/lib/db/models/PriceNegotiation";
import Product from "@/lib/db/models/product";
import { getUserFromRequest } from "@/lib/serverAuth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401, headers: corsHeaders });
    }

    if (user.role && user.role !== "vendor" && user.role !== "supplier") {
      return NextResponse.json({ success: false, error: "Unauthorized. Vendor role required." }, { status: 403, headers: corsHeaders });
    }

    // 1. Find all products that belong to this vendor
    const vendorProducts = await Product.find({ supplierId: user.id }).select('_id').lean();
    const productIds = vendorProducts.map(p => p._id);

    // 2. Fetch all price negotiations for these products
    const requests = await PriceNegotiation.find({ product: { $in: productIds } })
      .populate("customer", "name phone businessName category")
      .populate("product", "name price sku images")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: requests }, { headers: corsHeaders });
  } catch (err) {
    console.error("[VENDOR_PRICE_REQUESTS_GET]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
