import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ReturnRequest from "@/lib/db/models/returnRequest";
import ReturnActivityLog from "@/lib/db/models/returnActivityLog";
import Order from "@/lib/db/models/order";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const vendorId = searchParams.get("vendorId");
    
    const query = {};
    if (customerId) query.requester = customerId;
    if (vendorId) query.supplier = vendorId;

    const returns = await ReturnRequest.find(query)
      .populate("order", "orderId orderNumber totalAmount")
      .populate("requester", "name email")
      .populate("supplier", "name")
      .populate("items.product", "name sku")
      .sort({ createdAt: -1 });

    return NextResponse.json({ data: returns }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { orderId, customerId, selectedItems, reason, comment, images } = body;

    if (!orderId || !customerId || !selectedItems || selectedItems.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    // Generate unique Return Request Number (RRN)
    const randomHex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
    const rrn = `RRN-${new Date().toISOString().slice(2,10).replace(/-/g,"")}-${randomHex}`;

    // Format items
    const formattedItems = selectedItems.map((item) => ({
      product: item.product?._id || item.productId || item.product,
      quantity: item.quantity,
      reason: reason,
      condition: "Unknown",
    }));

    // Find the order to get the supplier if available
    const order = await Order.findById(orderId);
    const supplier = order?.supplier || null;

    // Determine initial status based on vendor assignment
    let initialStatus = "Pending Vendor Approval";
    if (!supplier) {
      initialStatus = "Routed to SCM"; // Auto-route to SCM if no vendor
    }

    const newReturn = await ReturnRequest.create({
      rrn,
      order: orderId,
      requester: customerId,
      supplier,
      items: formattedItems,
      comments: comment,
      images: images || [],
      status: initialStatus,
      vendorApprovalSlaDueDate: supplier ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
    });

    await ReturnActivityLog.create({
      returnRequest: newReturn._id,
      action: "Return Request Created",
      newStatus: initialStatus,
      remarks: "Customer initiated return.",
      performedBy: customerId,
      userType: "Customer"
    });

    return NextResponse.json({ message: "Return Request created", data: newReturn }, { status: 201, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
}
