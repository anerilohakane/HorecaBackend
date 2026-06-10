import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PriceNegotiation from "@/lib/db/models/PriceNegotiation";
import User from "@/lib/db/models/User";
import Customer from "@/lib/db/models/customer";
import Product from "@/lib/db/models/product";

export async function GET(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    const priceRequest = await PriceNegotiation.findById(id)
      .populate("customer", "name phone businessName category")
      .populate("product", "name price sku images")
      .populate("salesRepresentative", "name email")
      .lean();

    if (!priceRequest) {
      return NextResponse.json({ success: false, error: "Price request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: priceRequest });
  } catch (err) {
    console.error("GET /api/price-requests/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    const body = await request.json();
    const { remark, senderType, senderId } = body;

    if (!remark || !senderType || !senderId) {
      return NextResponse.json({ success: false, error: "Missing remark details" }, { status: 400 });
    }

    const priceRequest = await PriceNegotiation.findById(id);
    if (!priceRequest) {
      return NextResponse.json({ success: false, error: "Price request not found" }, { status: 404 });
    }

    if (priceRequest.status !== "pending") {
      return NextResponse.json({ success: false, error: "Cannot add remarks to a non-pending request" }, { status: 400 });
    }

    priceRequest.remarks.push({
      senderType,
      senderId,
      senderModel: senderType === "Customer" ? "Customer" : "User",
      message: remark
    });

    if (senderType === "Sales") {
        priceRequest.salesRepresentative = senderId;
    }

    await priceRequest.save();

    return NextResponse.json({ success: true, data: priceRequest });
  } catch (err) {
    console.error("PATCH /api/price-requests/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
