import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import CustomerPO from "@/lib/db/models/CustomerPO";
import "@/lib/db/models/customer";
import "@/lib/db/models/supplier";
import "@/lib/db/models/product";
import { logger } from "@/lib/logger";

// GET - List Customer POs
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    let query = {};
    if (status && status !== "All") query.status = status;
    if (customerId) query.customer = customerId;

    const pos = await CustomerPO.find(query)
      .populate("customer", "name businessName email phone addresses")
      .populate("supplier", "name businessName")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: pos });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create Customer PO
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const po = new CustomerPO({
      customer: body.customer,
      supplier: body.supplier || null,
      items: body.items,
      notes: body.notes || ""
    });
    
    // Initial timeline entry
    po.timeline.push({
      status: po.status,
      message: `Customer PO created`,
      user: body.createdBy || "Customer"
    });

    await po.save();

    await logger({
      action: "created",
      message: `Created Customer PO: ${po.poNumber}`,
      metadata: { entity: "CustomerPO", entityId: po.poNumber },
      req: request,
    });

    return NextResponse.json({ success: true, data: po }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Update Customer PO Status (and convert to Order if Approved)
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { poId, status, notes, user } = body;

    const po = await CustomerPO.findById(poId).populate("customer");
    if (!po) {
      return NextResponse.json({ success: false, error: "PO not found" }, { status: 404 });
    }

    const oldStatus = po.status;
    if (status) po.status = status;
    if (notes) po.notes = notes;

    if (status && status !== oldStatus) {
      po.timeline.push({
        status,
        message: `Status changed from ${oldStatus} to ${status}`,
        user: user || "Admin"
      });
    }

    await po.save();

    // If Approved, convert to Order
    if (status === "Approved" && oldStatus !== "Approved") {
      const orderItems = po.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        price: item.unitPrice 
      }));

      let shippingAddress = null;
      if (po.customer.addresses && po.customer.addresses.length > 0) {
        shippingAddress = po.customer.addresses.find(a => a.isDefault) || po.customer.addresses[0];
      } else {
        shippingAddress = {
          fullName: po.customer.businessName || po.customer.name || "Customer",
          phone: po.customer.phone || "0000000000",
          street: "Default Street",
          city: "Default City",
          state: "Default State",
          country: "India",
          zipCode: "000000"
        };
      }

      const orderPayload = {
        userId: po.customer._id,
        items: orderItems,
        shippingAddress,
        notes: po.notes || "Converted from Customer PO",
        b2b: { purchaseOrderNumber: po.poNumber },
        poNumber: po.poNumber,
        department: "ODT",
        status: "pending",
        movApplied: true,
        paymentMethod: "cod"
      };

      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const host = request.headers.get("host");
      const apiUrl = `${protocol}://${host}/api/order`;

      const orderRes = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        throw new Error(`Order creation failed: ${orderData.error || orderData.message}`);
      }

      await logger({
        action: "updated",
        message: `Approved Customer PO ${po.poNumber} and created Order`,
        metadata: { entity: "CustomerPO", entityId: po.poNumber, status },
        req: request,
      });

      return NextResponse.json({ success: true, data: po, order: orderData.order || orderData.data });
    }

    await logger({
      action: "updated",
      message: `Updated Customer PO ${po.poNumber} status to ${status}`,
      metadata: { entity: "CustomerPO", entityId: po.poNumber, status },
      req: request,
    });

    return NextResponse.json({ success: true, data: po });
  } catch (error) {
    console.error("PATCH CustomerPO error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
