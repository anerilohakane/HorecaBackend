import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PriceNegotiation from "@/lib/db/models/PriceNegotiation";

export async function POST(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing orderId" }, { status: 400 });
    }

    const priceRequest = await PriceNegotiation.findById(id);
    if (!priceRequest) {
      return NextResponse.json({ success: false, error: "Price request not found" }, { status: 404 });
    }

    priceRequest.orderId = orderId;
    priceRequest.status = "closed"; // Optional: change status to closed once order is placed

    await priceRequest.save();

    return NextResponse.json({ success: true, data: priceRequest });
  } catch (err) {
    console.error("POST /api/price-requests/[id]/link-order error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
