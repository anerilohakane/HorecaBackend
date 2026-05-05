import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Product from "@/lib/db/models/product";

export async function PATCH(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ success: false, error: "Invalid updates format" }, { status: 400 });
    }

    // Perform bulk update
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { poTemplateId: update.poTemplateId || null } }
      }
    }));

    await Product.bulkWrite(bulkOps);

    return NextResponse.json({ success: true, message: "Products updated successfully" });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
