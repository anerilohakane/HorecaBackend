import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import AccountingEntry from "@/lib/db/models/inventory/AccountingEntry";

// GET - List Accounting Entries
export async function GET(request) {
  try {
    await dbConnect();
    const entries = await AccountingEntry.find({}).sort({ transactionDate: -1 }).lean();
    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
