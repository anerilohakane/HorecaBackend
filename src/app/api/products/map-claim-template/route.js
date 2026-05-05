import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Product from "@/lib/db/models/product";

export async function PATCH(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { updates } = body; // Array of { productId, claimTemplateId }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ success: false, error: "Invalid updates format" }, { status: 400 });
    }

    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.productId },
        update: { $set: { claimTemplateId: update.claimTemplateId } }
      }
    }));

    const result = await Product.bulkWrite(bulkOps);

    return NextResponse.json({ 
      success: true, 
      message: `${result.modifiedCount} products updated successfully.` 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
