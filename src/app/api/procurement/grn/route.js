import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import GoodsReceivedNote from "@/lib/db/models/inventory/GoodsReceivedNote";
import PurchaseOrder from "@/lib/db/models/inventory/PurchaseOrder";
import { logger } from "@/lib/logger";

// GET - List GRNs
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get("poNumber");
    const isKachha = searchParams.get("isKachha");

    let query = {};
    if (poNumber) query.poNumber = poNumber;
    if (isKachha !== null) query.isKachha = isKachha === "true";

    const grns = await GoodsReceivedNote.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: grns });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create GRN from PO
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { purchaseOrderId, items } = body;

    const po = await PurchaseOrder.findById(purchaseOrderId);
    if (!po) {
      return NextResponse.json({ success: false, error: "PO not found" }, { status: 404 });
    }

    const grn = new GoodsReceivedNote(body);
    grn.status = "Kachha";
    grn.isKachha = true;

    await grn.save();

    // Smart PO status update: check if ALL items across ALL GRNs are fully received
    const allGrns = await GoodsReceivedNote.find({ purchaseOrderId: po._id });
    const receivedTotals = {};
    allGrns.forEach(g => {
      g.items.forEach(item => {
        receivedTotals[item.productId] = (receivedTotals[item.productId] || 0) + item.receivedQty;
      });
    });

    // Check if every original PO item is satisfied
    const isFullyReceived = po.items.length > 0 && po.items.every(item =>
      (receivedTotals[item.productId] || 0) >= (item.orderedQty || item.quantity || 0)
    );

    const newPoStatus = isFullyReceived ? "Completed" : "Partially Received";

    await PurchaseOrder.updateOne(
      { _id: po._id },
      {
        $set: { status: newPoStatus },
        $push: {
          timeline: {
            status: newPoStatus,
            message: isFullyReceived
              ? `GRN ${grn.grnNumber} generated. All items fully received — PO Completed.`
              : `GRN ${grn.grnNumber} generated. Status: Partially Received.`,
            user: body.receivedBy || "Admin",
            timestamp: new Date()
          }
        }
      }
    );

    await logger({
      action: "created",
      message: `Created GRN: ${grn.grnNumber} for PO: ${po.poNumber}`,
      metadata: { entity: "GoodsReceivedNote", entityId: grn.grnNumber, poId: po._id },
      req: request,
    });

    return NextResponse.json({ success: true, data: grn }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Update QC or Convert to Pakka (Preliminary)
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { grnId, qcStatus, qcDetails, status } = body;

    const grn = await GoodsReceivedNote.findById(grnId);
    if (!grn) {
      return NextResponse.json({ success: false, error: "GRN not found" }, { status: 404 });
    }

    if (qcStatus) grn.qcStatus = qcStatus;
    if (qcDetails) grn.qcDetails = { ...grn.qcDetails, ...qcDetails };
    if (status) {
      grn.status = status;
      if (status === "Pakka") grn.isKachha = false;
    }

    await grn.save();

    await logger({
      action: "updated",
      message: `Updated GRN ${grn.grnNumber} (QC: ${qcStatus}, Status: ${status})`,
      metadata: { entity: "GoodsReceivedNote", entityId: grn.grnNumber },
      req: request,
    });

    return NextResponse.json({ success: true, data: grn });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
