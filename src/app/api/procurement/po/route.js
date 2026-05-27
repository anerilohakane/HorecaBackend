import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PurchaseOrder from "@/lib/db/models/inventory/PurchaseOrder";
import PurchaseRequest from "@/lib/db/models/inventory/PurchaseRequest";
import { logger } from "@/lib/logger";

// GET - List POs
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const supplier = searchParams.get("supplier");

    let query = {};
    if (status && status !== "All") query.status = status;
    if (supplier) query["supplier.name"] = { $regex: supplier, $options: "i" };

    const pos = await PurchaseOrder.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: pos });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create PO (potentially from PR)
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // If prId is provided, we might want to check if PR exists and is approved
    if (body.prId) {
      const pr = await PurchaseRequest.findById(body.prId);
      if (!pr || pr.status !== "Approved") {
        return NextResponse.json({ success: false, error: "Approved PR is required to generate PO" }, { status: 400 });
      }
    }

    const po = new PurchaseOrder(body);
    
    // Initial timeline entry
    po.timeline.push({
      status: po.status,
      message: `Purchase Order created${body.prId ? " from PR" : ""}`,
      user: body.createdBy || "Admin"
    });

    await po.save();

    await logger({
      action: "created",
      message: `Created PO: ${po.poNumber}`,
      metadata: { entity: "PurchaseOrder", entityId: po.poNumber },
      req: request,
    });

    return NextResponse.json({ success: true, data: po }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Update PO Status/Notes
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { poId, status, notes, user } = body;

    const po = await PurchaseOrder.findById(poId);
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

    await logger({
      action: "updated",
      message: `Updated PO ${po.poNumber} status to ${status}`,
      metadata: { entity: "PurchaseOrder", entityId: po.poNumber, status },
      req: request,
    });

    return NextResponse.json({ success: true, data: po });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
