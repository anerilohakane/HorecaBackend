import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PriceNegotiation from "@/lib/db/models/PriceNegotiation";
import Notification from "@/lib/db/models/notification";

export async function POST(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await request.json();
    const { salesRepresentativeId, remark } = body;

    const priceRequest = await PriceNegotiation.findById(id);
    if (!priceRequest) {
      return NextResponse.json({ success: false, error: "Price request not found" }, { status: 404 });
    }

    if (priceRequest.status !== "pending") {
      return NextResponse.json({ success: false, error: "Only pending requests can be rejected" }, { status: 400 });
    }

    priceRequest.status = "rejected";
    if (salesRepresentativeId) {
      priceRequest.salesRepresentative = salesRepresentativeId;
    }

    if (remark) {
      priceRequest.remarks.push({
        senderType: "Sales",
        senderId: salesRepresentativeId,
        senderModel: "User",
        message: remark
      });
    }

    await priceRequest.save();

    try {
      await priceRequest.populate("product", "name");
      const productName = priceRequest.product?.name || "Product";
      await Notification.create({
        user: priceRequest.customer,
        title: "Price Request Rejected",
        message: `Your price request for ${productName} at ₹${priceRequest.requestedPrice} has been rejected.`,
        type: "error",
        metadata: { priceNegotiationId: priceRequest._id, status: "rejected" }
      });
    } catch (notifErr) {
      console.error("Failed to create rejection notification:", notifErr);
    }

    return NextResponse.json({ success: true, data: priceRequest });
  } catch (err) {
    console.error("POST /api/price-requests/[id]/reject error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
