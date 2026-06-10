import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    const claims = await Claim.find({ approvalToken: token })
      .populate("productId", "name sku basePrice assuredMargin images")
      .populate("orderId", "orderNumber status placedAt")
      .populate("vendorId", "businessName email")
      .lean();

    if (!claims || claims.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: claims });
  } catch (error) {
    console.error("View bulk claims error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
