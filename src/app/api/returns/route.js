import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ReturnRequest from "@/lib/db/models/returnRequest";
import ReturnActivityLog from "@/lib/db/models/returnActivityLog";
import Order from "@/lib/db/models/order";
import User from "@/lib/db/models/User";
import Customer from "@/lib/db/models/customer";
import Supplier from "@/lib/db/models/supplier";
import Product from "@/lib/db/models/product";

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
    const orderId = searchParams.get("orderId");
    
    const query = {};
    if (customerId) query.requester = customerId;
    if (vendorId) query.supplier = vendorId;
    if (orderId) query.order = orderId;

    const returns = await ReturnRequest.find(query)
      .populate("order", "orderId orderNumber totalAmount")
      .populate("requester", "name email")
      .populate("supplier", "brand businessName")
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

    // Find the order to validate quantities and get supplier
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404, headers: corsHeaders });
    }
    const supplier = order.supplier || null;

    // Fetch past returns to calculate cumulative previously returned quantities
    const existingReturns = await ReturnRequest.find({ order: orderId });

    // Format and validate items
    const formattedItems = [];
    for (const item of selectedItems) {
      const pId = item.product?._id || item.productId || item.product;
      const orderItem = order.items.find(i => String(i.product) === String(pId));
      if (!orderItem) continue;

      const orderedQty = orderItem.quantity;
      const deliveredQty = orderItem.quantity; // Assuming full delivery for now
      
      let prevReturned = 0;
      existingReturns.forEach(ret => {
        // Exclude cancelled/rejected returns if needed, but for safe max calculation we count all non-rejected
        if (ret.status !== "Vendor Rejected" && ret.status !== "Return Closed") {
          const retItem = ret.items.find(ri => String(ri.product) === String(pId));
          if (retItem && retItem.status !== "Rejected") {
            prevReturned += (retItem.requestedReturnQty || retItem.quantity || 0);
          }
        }
      });

      const reqQty = Number(item.requestedReturnQty || item.quantity);
      if (reqQty <= 0) {
        return NextResponse.json({ error: "Invalid return quantity" }, { status: 400, headers: corsHeaders });
      }
      
      if (reqQty + prevReturned > deliveredQty) {
        return NextResponse.json({ 
          error: `Cannot return ${reqQty} of ${orderItem.name}. Maximum allowed is ${deliveredQty - prevReturned}` 
        }, { status: 400, headers: corsHeaders });
      }

      formattedItems.push({
        product: pId,
        requestedReturnQty: reqQty,
        orderedQuantity: orderedQty,
        deliveredQuantity: deliveredQty,
        previouslyReturnedQuantity: prevReturned,
        reason: reason,
        condition: "Unknown",
        status: "Pending"
      });
    }

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
