import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PurchaseReturnNote from "@/lib/db/models/inventory/PurchaseReturnNote";
import GoodsReceivedNote from "@/lib/db/models/inventory/GoodsReceivedNote";
import PurchaseOrder from "@/lib/db/models/inventory/PurchaseOrder";
import Product from "@/lib/db/models/product";
import { logger } from "@/lib/logger";

// GET - List PRNs
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = {};
    if (status && status !== "All") query.status = status;

    const prns = await PurchaseReturnNote.find(query)
      .populate("grnId", "grnNumber")
      .populate("poId", "poNumber supplier")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: prns });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create PRN
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { grnId, poId, items, requestedBy, remarks, locationId } = body;

    if (!grnId || !poId || !items || !items.length || !requestedBy) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const prn = new PurchaseReturnNote(body);
    await prn.save();

    await logger({
      action: "created",
      message: `Created PRN: ${prn.prnNumber} for GRN: ${grnId}`,
      metadata: { entity: "PurchaseReturnNote", entityId: prn.prnNumber, grnId },
      req: request,
    });

    return NextResponse.json({ success: true, data: prn }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Update PRN Status
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { prnId, status, remarks } = body;

    if (!prnId || !status) {
      return NextResponse.json({ success: false, error: "prnId and status are required" }, { status: 400 });
    }

    const prn = await PurchaseReturnNote.findById(prnId);
    if (!prn) {
      return NextResponse.json({ success: false, error: "PRN not found" }, { status: 404 });
    }

    prn.status = status;
    if (remarks) prn.remarks = remarks;

    // If the return is marked as Completed, adjust stockQuantity in database for all products returned
    if (status === "Completed") {
      for (const item of prn.items) {
        // Decrement product stock quantity
        await Product.findOneAndUpdate(
          { _id: item.productId },
          { $inc: { stockQuantity: -item.quantity } }
        );
      }
    }

    await prn.save();

    await logger({
      action: "updated",
      message: `Updated PRN ${prn.prnNumber} status to ${status}`,
      metadata: { entity: "PurchaseReturnNote", entityId: prn.prnNumber, status },
      req: request,
    });

    return NextResponse.json({ success: true, data: prn });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
