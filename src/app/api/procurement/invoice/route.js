import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ProcurementInvoice from "@/lib/db/models/inventory/ProcurementInvoice";
import GoodsReceivedNote from "@/lib/db/models/inventory/GoodsReceivedNote";
import PurchaseOrder from "@/lib/db/models/inventory/PurchaseOrder";
import AccountingEntry from "@/lib/db/models/inventory/AccountingEntry";
import { logger } from "@/lib/logger";

// GET - List Invoices
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = {};
    if (status) query.status = status;

    const invoices = await ProcurementInvoice.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create Invoice & Match
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { poId, grnId, items } = body;

    const po = await PurchaseOrder.findById(poId);
    const grn = await GoodsReceivedNote.findById(grnId);

    if (!po || !grn) {
      return NextResponse.json({ success: false, error: "PO or GRN not found" }, { status: 404 });
    }

    // Matching Logic (Simplistic for now)
    let mismatches = [];
    items.forEach((item, index) => {
      const poItem = po.items.find(i => i.productId === item.productId);
      const grnItem = grn.items.find(i => i.productId === item.productId);

      if (!poItem || !grnItem) {
        mismatches.push({ field: "productId", expected: "Exists", actual: "Missing", itemIndex: index });
        return;
      }

      if (item.qty > grnItem.receivedQty) {
        mismatches.push({ field: "qty", expected: grnItem.receivedQty, actual: item.qty, itemIndex: index });
      }
      if (item.unitPrice !== poItem.unitPrice) {
        mismatches.push({ field: "unitPrice", expected: poItem.unitPrice, actual: item.unitPrice, itemIndex: index });
      }
    });

    const invoice = new ProcurementInvoice({
      ...body,
      status: mismatches.length > 0 ? "Mismatch" : "Matched",
      matchingDetails: {
        isMatched: mismatches.length === 0,
        mismatches,
      }
    });

    await invoice.save();

    await logger({
      action: "created",
      message: `Created Invoice ${invoice.invoiceNumber} (Matched: ${mismatches.length === 0})`,
      metadata: { entity: "ProcurementInvoice", entityId: invoice.invoiceNumber },
      req: request,
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Pakka Conversion
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { invoiceId, action } = body;

    const invoice = await ProcurementInvoice.findById(invoiceId);
    if (!invoice) return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });

    if (action === "PAKKA") {
      if (invoice.status !== "Matched") {
        return NextResponse.json({ success: false, error: "Invoice must be Matched before Pakka conversion" }, { status: 400 });
      }

      // Finalize Invoice
      invoice.status = "Pakka";
      await invoice.save();

      // Update GRN to Pakka
      const grn = await GoodsReceivedNote.findById(invoice.grnId);
      if (grn) {
        grn.status = "Pakka";
        grn.isKachha = false;
        await grn.save();
      }

      // Generate Accounting Entry
      const accounting = new AccountingEntry({
        referenceId: invoice._id,
        referenceType: "ProcurementInvoice",
        remarks: `Journal entry for Invoice ${invoice.invoiceNumber}`,
        entries: [
          { accountName: "Inventory Account", accountType: "Asset", debit: invoice.subTotal, credit: 0 },
          { accountName: "GST Input Account", accountType: "Asset", debit: invoice.taxTotal, credit: 0 },
          { accountName: "Vendor Payable", accountType: "Liability", debit: 0, credit: invoice.grandTotal },
        ],
        status: "Posted"
      });
      await accounting.save();

      await logger({
        action: "converted",
        message: `Converted Invoice ${invoice.invoiceNumber} to Pakka and generated Accounting Entry`,
        metadata: { entity: "ProcurementInvoice", entityId: invoice.invoiceNumber },
        req: request,
      });

      return NextResponse.json({ success: true, data: invoice, accounting });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
