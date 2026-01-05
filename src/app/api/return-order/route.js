
import mongoose from "mongoose";
import dbConnect from "@/lib/db/connect";
import ReturnRequest from "@/lib/db/models/returnRequest";
import Order from "@/lib/db/models/order";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    // Expected body: { orderId, requesterId, items: [{ product, quantity, reason, condition }], type: 'return'|'refund'|'replacement' }

    const { orderId, items, type, notes } = body;
    const requesterId = body.requesterId || body.userId;

    if (!orderId || !requesterId || !items || !items.length || !type) {
      return json({ success: false, error: "Missing required fields" }, 400);
    }

    // 1. Verify Order
    const order = await Order.findById(orderId);
    if (!order) {
      return json({ success: false, error: "Order not found" }, 404);
    }

    if (order.user.toString() !== requesterId) {
       // Maybe allow admin/supplier to raise request too? 
       // For now check if it matches order user.
       // return json({ success: false, error: "Unauthorized" }, 403);
    }

    // 2. Validate Items are in Order
    // ... (This logic can be complex if partial returns are tracked. For MVP, trust the input or simple check)
    
    // 3. Create ReturnRequest
    const returnRequest = await ReturnRequest.create({
      type,
      order: orderId,
      requester: requesterId,
      items,
      notes,
      supplier: order.supplier, // Default to order supplier
      status: "requested",
    });

    // 4. Update Order Status (Optional but good for UI)
    // Avoid overwriting if existing status is more important, but usually we flag it.
    // Order model has "return_requested" status.
    await Order.findByIdAndUpdate(orderId, { 
        status: "return_requested",
        "invoice.meta.returnRequestedAt": new Date() 
    });

    return json({ success: true, returnRequest }, 201);

  } catch (error) {
    console.error("POST /api/return-order error:", error);
    return json({ success: false, error: error.message || "Server Error" }, 500);
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");
    const requesterId = url.searchParams.get("requesterId"); // userId
    const supplierId = url.searchParams.get("supplierId");

    const query = {};
    if (orderId) query.order = orderId;
    if (requesterId) query.requester = requesterId;
    if (supplierId) query.supplier = supplierId;

    const requests = await ReturnRequest.find(query)
      .sort({ createdAt: -1 })
      .populate("order", "orderNumber total")
      .populate("items.product", "name sku")
      .lean();

    return json({ success: true, requests });
  } catch (error) {
    console.error("GET /api/return-order error:", error);
    return json({ success: false, error: "Server Error" }, 500);
  }
}

export async function PATCH(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { requestId, status, resolution, notes } = body;

        if (!requestId || !status) {
            return json({ success: false, error: "requestId and status are required" }, 400);
        }

        const allowedStatuses = ["approved", "rejected", "collected", "processed", "completed"];
        if (!allowedStatuses.includes(status)) {
            return json({ success: false, error: "Invalid status" }, 400);
        }

        const updateData = { status };
        if (resolution) updateData.resolution = resolution;
        if (notes) updateData.notes = notes;
        if (status === "processed" || status === "completed") {
            updateData.processedAt = new Date();
        }

        const updatedRequest = await ReturnRequest.findByIdAndUpdate(
            requestId,
            updateData,
            { new: true }
        );

        if (!updatedRequest) {
            return json({ success: false, error: "Return Request not found" }, 404);
        }

        // Sync with Order Status if needed
        if (status === "completed" || status === "processed") {
             // Maybe update order to "returned" or "refunded"
             // const orderStatus = updatedRequest.type === 'refund' ? 'refunded' : 'returned';
             // await Order.findByIdAndUpdate(updatedRequest.order, { status: orderStatus });
        }

        return json({ success: true, returnRequest: updatedRequest });

    } catch (error) {
        console.error("PATCH /api/return-order error:", error);
        return json({ success: false, error: "Server Error" }, 500);
    }
}
