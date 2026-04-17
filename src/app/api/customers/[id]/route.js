import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Customer from "@/lib/db/models/customer";

/**
 * PATCH /api/customers/[id]
 * Update customer details: isVerified, category.
 */
export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await req.json();

    const allowedUpdates = ["isVerified", "category"];
    const updates = {};
    
    Object.keys(body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    const customer = await Customer.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (err) {
    console.error(`🔥 ERROR in PATCH /api/customers/${params.id}:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/customers/[id]
 */
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    console.log(`🔎 [BACKEND] GET /api/customers/${id} - Searching for customer...`);
    
    const customer = await Customer.findById(id).lean();
    console.log(`📦 [BACKEND] Customer found:`, customer ? "YES" : "NO");

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (err) {
    console.error(`🔥 ERROR in GET /api/customers/${params.id}:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}
