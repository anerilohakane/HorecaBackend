// app/api/suppliers/approved/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";

export async function GET() {
  await dbConnect();
  try {
    const list = await Supplier.find({ status: "approved" }).select("-password").lean();
    return NextResponse.json({ success: true, data: list });
  } catch (err) {
    console.error("GET /api/suppliers/approved", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
