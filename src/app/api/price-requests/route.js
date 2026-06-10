import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PriceNegotiation from "@/lib/db/models/PriceNegotiation";
import Customer from "@/lib/db/models/customer";
import Product from "@/lib/db/models/product";
import User from "@/lib/db/models/User";
import Setting from "@/lib/db/models/Setting";

export async function GET(request) {
  await dbConnect();
  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");
    const status = url.searchParams.get("status");

    let filter = {};
    if (customerId) filter.customer = customerId;
    if (status) filter.status = status;

    const requests = await PriceNegotiation.find(filter)
      .populate("customer", "name phone businessName category")
      .populate("product", "name price sku images")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: requests });
  } catch (err) {
    console.error("GET /api/price-requests error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { customerId, productId, requestedPrice, quantity, remark } = body;

    if (!customerId || !productId || !requestedPrice || !quantity) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Check if customer is eligible
    const customer = await Customer.findById(customerId).lean();
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const settings = await Setting.findOne({ key: "priceNegotiationEligibleTiers" }).lean();
    const eligibleTiers = settings && Array.isArray(settings.value) ? settings.value : ["A"];

    if (!eligibleTiers.includes(customer.category)) {
      return NextResponse.json({ success: false, error: "Customer is not eligible for price negotiation" }, { status: 403 });
    }

    // Get original price
    const product = await Product.findById(productId).lean();
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const remarks = [];
    if (remark) {
      remarks.push({
        senderType: "Customer",
        senderId: customerId,
        senderModel: "Customer",
        message: remark
      });
    }

    const priceRequest = new PriceNegotiation({
      customer: customerId,
      product: productId,
      originalPrice: product.price,
      requestedPrice,
      quantity,
      remarks,
      status: "pending"
    });

    await priceRequest.save();

    return NextResponse.json({ success: true, data: priceRequest }, { status: 201 });
  } catch (err) {
    console.error("POST /api/price-requests error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
