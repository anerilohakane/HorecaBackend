import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ProcurementPayment from "@/lib/db/models/inventory/ProcurementPayment";
import ProcurementInvoice from "@/lib/db/models/inventory/ProcurementInvoice";
import AccountingEntry from "@/lib/db/models/inventory/AccountingEntry";
import { logger } from "@/lib/logger";

// GET - List Payments
export async function GET(request) {
  try {
    await dbConnect();
    const payments = await ProcurementPayment.find({}).sort({ paymentDate: -1 }).lean();
    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create Payment
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { invoiceIds, amount } = body;

    const payment = new ProcurementPayment(body);
    await payment.save();

    // Optionally update invoice status if fully paid
    // For now, just generate a payment journal entry
    const accounting = new AccountingEntry({
      referenceId: payment._id,
      referenceType: "ProcurementPayment",
      remarks: `Payment entry ${payment.paymentNumber}`,
      entries: [
        { accountName: "Vendor Payable", accountType: "Liability", debit: amount, credit: 0 },
        { accountName: "Bank Account", accountType: "Asset", debit: 0, credit: amount },
      ],
      status: "Posted"
    });
    await accounting.save();

    await logger({
      action: "created",
      message: `Created Payment ${payment.paymentNumber} for amount ${amount}`,
      metadata: { entity: "ProcurementPayment", entityId: payment.paymentNumber },
      req: request,
    });

    return NextResponse.json({ success: true, data: payment, accounting });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
