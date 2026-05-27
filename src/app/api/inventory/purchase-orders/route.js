import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PurchaseOrder from "@/lib/db/models/inventory/PurchaseOrder";
import { logger } from "@/lib/logger";

// GET - List purchase orders
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const supplier = searchParams.get("supplier");
    const search = searchParams.get("search");

    let query = {};
    if (status && status !== "All") query.status = status;
    if (supplier) query["supplier.name"] = { $regex: supplier, $options: "i" };
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: "i" } },
        { "supplier.name": { $regex: search, $options: "i" } },
        { "items.productName": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await PurchaseOrder.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const allOrders = await PurchaseOrder.find({}).lean();
    const stats = {
      total: allOrders.length,
      draft: allOrders.filter((o) => o.status === "Draft").length,
      sent: allOrders.filter((o) => o.status === "Sent").length,
      partiallyReceived: allOrders.filter(
        (o) => o.status === "Partially Received"
      ).length,
      completed: allOrders.filter((o) => o.status === "Completed").length,
      totalValue: allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };

    await logger({
      action: "read",
      message: `Fetched purchase orders (count: ${orders.length})`,
      metadata: { entity: "PurchaseOrder", count: orders.length },
      req: request,
    });

    return NextResponse.json({
      success: true,
      data: orders,
      stats,
      count: orders.length,
    });
  } catch (error) {
    console.error("Error in PO GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch POs" },
      { status: 500 }
    );
  }
}

// POST - Create a new purchase order
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const po = new PurchaseOrder(body);
    await po.save();

    await logger({
      action: "created",
      message: `Created PO: ${po.poNumber} for ${po.supplier?.name}`,
      metadata: {
        entity: "PurchaseOrder",
        entityId: po.poNumber,
        supplier: po.supplier?.name,
        items: po.items.length,
        total: po.totalAmount,
      },
      req: request,
    });

    return NextResponse.json({ success: true, data: po }, { status: 201 });
  } catch (error) {
    console.error("Error in PO POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create PO" },
      { status: 500 }
    );
  }
}

// PATCH - Update PO status
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.poId) {
      return NextResponse.json(
        { success: false, error: "poId is required" },
        { status: 400 }
      );
    }

    const update = {};
    if (body.status) update.status = body.status;
    if (body.notes) update.notes = body.notes;

    const updated = await PurchaseOrder.findByIdAndUpdate(
      body.poId,
      { $set: update },
      { new: true }
    );

    await logger({
      action: "updated",
      message: `Updated PO ${updated?.poNumber} status to ${body.status}`,
      metadata: { entity: "PurchaseOrder", entityId: updated?.poNumber },
      req: request,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error in PO PATCH:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update PO" },
      { status: 500 }
    );
  }
}
