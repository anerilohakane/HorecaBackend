import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Transaction from "@/lib/db/models/transaction";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type"); // Optional filter

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const supplierId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const query = { userId: supplierId };
    if (type) query.type = type;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error("GET /api/wallet/transactions error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
