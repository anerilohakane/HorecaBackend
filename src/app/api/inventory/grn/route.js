import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import GoodsReceivedNote from "@/lib/db/models/inventory/GoodsReceivedNote";
import PurchaseOrder from "@/lib/db/models/inventory/PurchaseOrder";
import CreditNote from "@/lib/db/models/inventory/CreditNote";
import { logger } from "@/lib/logger";

// GET - List GRNs
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const hasShortage = searchParams.get("hasShortage");
    const poId = searchParams.get("poId");

    let query = {};
    if (hasShortage === "true") query.hasShortage = true;
    if (poId) query.purchaseOrderId = poId;
    if (search) {
      query.$or = [
        { grnNumber: { $regex: search, $options: "i" } },
        { poNumber: { $regex: search, $options: "i" } },
        { "supplier.name": { $regex: search, $options: "i" } },
      ];
    }

    const grns = await GoodsReceivedNote.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const allGrns = await GoodsReceivedNote.find({}).lean();
    const stats = {
      total: allGrns.length,
      withShortage: allGrns.filter((g) => g.hasShortage).length,
      totalShortageValue: allGrns.reduce(
        (sum, g) => sum + (g.totalShortageValue || 0),
        0
      ),
      totalReceived: allGrns.reduce(
        (sum, g) => sum + (g.totalReceived || 0),
        0
      ),
    };

    await logger({
      action: "read",
      message: `Fetched GRNs (count: ${grns.length})`,
      metadata: { entity: "GoodsReceivedNote", count: grns.length },
      req: request,
    });

    return NextResponse.json({
      success: true,
      data: grns,
      stats,
      count: grns.length,
    });
  } catch (error) {
    console.error("Error in GRN GET:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch GRNs" },
      { status: 500 }
    );
  }
}

// POST - Create GRN and auto-generate Kaccha CN if shortage detected
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Fetch the PO to get PO number and supplier info
    const po = await PurchaseOrder.findById(body.purchaseOrderId);
    if (!po) {
      return NextResponse.json(
        { success: false, error: "Purchase Order not found" },
        { status: 404 }
      );
    }

    // Set PO info on the GRN
    body.poNumber = po.poNumber;
    if (!body.supplier) {
      body.supplier = po.supplier;
    }

    const grn = new GoodsReceivedNote(body);
    await grn.save();

    // Update PO status based on receipt
    const totalOrdered = po.items.reduce((s, i) => s + i.orderedQty, 0);
    const totalReceived = grn.items.reduce((s, i) => s + i.receivedQty, 0);

    if (totalReceived >= totalOrdered) {
      po.status = "Completed";
    } else if (totalReceived > 0) {
      po.status = "Partially Received";
    }
    await po.save();

    // Auto-generate Kaccha Credit Note if shortage detected
    let creditNote = null;
    if (grn.hasShortage) {
      const shortageItems = grn.items
        .filter((item) => item.shortageQty > 0)
        .map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          shortageQty: item.shortageQty,
          unitPrice: item.unitPrice,
          creditAmount: item.shortageQty * item.unitPrice,
        }));

      const cn = new CreditNote({
        type: "Kaccha",
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        purchaseOrderId: po._id,
        poNumber: po.poNumber,
        supplier: grn.supplier,
        items: shortageItems,
        status: "Provisional",
      });
      await cn.save();
      creditNote = cn;
    }

    await logger({
      action: "created",
      message: `Created GRN: ${grn.grnNumber} against PO: ${po.poNumber}${
        creditNote ? ` → Auto-generated Kaccha CN: ${creditNote.cnNumber}` : ""
      }`,
      metadata: {
        entity: "GoodsReceivedNote",
        entityId: grn.grnNumber,
        shortage: grn.hasShortage,
        shortageValue: grn.totalShortageValue,
      },
      req: request,
    });

    return NextResponse.json(
      {
        success: true,
        data: grn,
        creditNote: creditNote || null,
        message: creditNote
          ? `GRN created. Kaccha Credit Note ${creditNote.cnNumber} auto-generated for shortage.`
          : "GRN created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in GRN POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create GRN" },
      { status: 500 }
    );
  }
}
