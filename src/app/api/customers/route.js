import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";

/**
 * GET /api/customers
 * Fetch all customers with optional searching and pagination.
 */
export async function GET(req) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const query = {};

    // ── Search Filters ──────────────────────────────────────────
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");
    const email = searchParams.get("email");

    if (phone) {
      // Basic numeric-only search for phone number matching
      const numeric = phone.replace(/\D/g, "");
      query.phone = { $regex: numeric, $options: "i" };
    }

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    // ── Pagination ──────────────────────────────────────────────
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    // ── Fetch Results ───────────────────────────────────────────
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: customers,
    });
    
  } catch (err) {
    console.error("🔥 ERROR in GET /api/customers:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}
