import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ProductRequest from "@/lib/db/models/ProductRequest";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = {};
    if (status && status !== "All") {
      query.status = status;
    }

    const requests = await ProductRequest.find(query)
      .populate("vendorId", "businessName ownerName email phone")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("GET /api/cct/product-requests error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { requestId, status, cctRemarks } = body;

    if (!requestId || !status) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const updatedRequest = await ProductRequest.findByIdAndUpdate(
      requestId,
      { status, cctRemarks },
      { new: true }
    );

    if (!updatedRequest) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error) {
    console.error("PATCH /api/cct/product-requests error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  return PATCH(req);
}
