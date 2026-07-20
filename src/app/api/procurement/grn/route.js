import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import GoodsReceivedNote from "@/lib/db/models/inventory/GoodsReceivedNote";
import PurchaseOrder from "@/lib/db/models/inventory/PurchaseOrder";
import { logger } from "@/lib/logger";
import OpenStorage from "@/lib/db/models/inventory/OpenStorage";
import Inventory from "@/lib/db/models/scm/Inventory";
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

    // Save received products to OpenStorage and update Inventory
    try {
      const openStorageEntries = grn.items
        .filter((item) => item.receivedQty > 0)
        .map((item) => {
          const itemObj = item.toObject ? item.toObject() : { ...item };
          delete itemObj._id;
          return {
            ...itemObj,
            quantity: item.receivedQty,
            supplier: grn.supplier,
            poNumber: grn.poNumber,
            grnNumber: grn.grnNumber,
            grnId: grn._id,
            poId: po._id,
            templateId: po.templateId,
            headers: po.headers,
            status: "Available",
            receivedDate: grn.receivedDate || new Date(),
          };
        });

      if (openStorageEntries.length > 0) {
        for (const entry of openStorageEntries) {
          // 1. Update OpenStorage
          const existing = await OpenStorage.findOne({
            productId: entry.productId,
            status: "Available"
          });
          if (existing) {
            existing.quantity = (existing.quantity || 0) + entry.quantity;
            existing.totalPrice = (existing.totalPrice || 0) + (entry.totalPrice || (entry.quantity * entry.unitPrice));
            
            if (entry.poNumber) {
              if (existing.poNumber) {
                const pos = existing.poNumber.split(',').map(p => p.trim());
                if (!pos.includes(entry.poNumber)) {
                  existing.poNumber = `${existing.poNumber}, ${entry.poNumber}`;
                }
              } else {
                existing.poNumber = entry.poNumber;
              }
            }

            if (entry.grnNumber) {
              if (existing.grnNumber) {
                const grns = existing.grnNumber.split(',').map(g => g.trim());
                if (!grns.includes(entry.grnNumber)) {
                  existing.grnNumber = `${existing.grnNumber}, ${entry.grnNumber}`;
                }
              } else {
                existing.grnNumber = entry.grnNumber;
              }
            }

            existing.receivedDate = entry.receivedDate || new Date();
            await existing.save();
          } else {
            await OpenStorage.create(entry);
          }

          // 2. Update Inventory Stock
          try {
            const existingInventory = await Inventory.findOne({ productId: entry.productId });
            if (existingInventory) {
              existingInventory.currentStock = (existingInventory.currentStock || 0) + entry.quantity;
              existingInventory.stockQuantity = (existingInventory.stockQuantity || 0) + entry.quantity;
              existingInventory.lastMovementDate = new Date();
              await existingInventory.save();
            } else {
              await Inventory.create({
                productId: entry.productId,
                productName: entry.productName,
                currentStock: entry.quantity,
                stockQuantity: entry.quantity,
                lastMovementDate: new Date(),
              });
            }
          } catch (invErr) {
            console.error(`Error updating Inventory for product ${entry.productId}:`, invErr);
          }
        }
      }
    } catch (storageError) {
      console.error("Error saving to OpenStorage:", storageError);
    }

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
