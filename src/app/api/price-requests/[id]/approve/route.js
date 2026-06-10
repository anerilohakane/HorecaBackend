import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PriceNegotiation from "@/lib/db/models/PriceNegotiation";

export async function POST(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await request.json();
    const { salesRepresentativeId, proofImageUrl } = body;

    const priceRequest = await PriceNegotiation.findById(id);
    if (!priceRequest) {
      return NextResponse.json({ success: false, error: "Price request not found" }, { status: 404 });
    }

    if (priceRequest.status !== "pending") {
      return NextResponse.json({ success: false, error: "Only pending requests can be approved" }, { status: 400 });
    }

    priceRequest.status = "approved";
    if (salesRepresentativeId) {
      priceRequest.salesRepresentative = salesRepresentativeId;
    }
    if (proofImageUrl) {
      priceRequest.proofImageUrl = proofImageUrl;
    }

    await priceRequest.save();

    return NextResponse.json({ 
      success: true, 
      data: priceRequest
    });
  } catch (err) {
    console.error("POST /api/price-requests/[id]/approve error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
