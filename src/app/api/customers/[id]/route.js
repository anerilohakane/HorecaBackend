import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";

export async function GET(req, { params }) {
  await dbConnect();

  try {
    const { id } = params;

    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
