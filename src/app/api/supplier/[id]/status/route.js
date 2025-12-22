// src/app/api/supplier/[id]/status/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";

function isValidObjectIdString(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

export async function PATCH(request, ctx) {
  await dbConnect();

  try {
    // ⚠️ MUST AWAIT PARAMS
    const { id } = await ctx.params;

    if (!isValidObjectIdString(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid supplier id" },
        { status: 400 }
      );
    }

    const body = await request.json();
    if (!body.status) {
      return NextResponse.json(
        { success: false, error: "Missing status in body" },
        { status: 400 }
      );
    }

    const valid = ["pending", "approved", "rejected", "active", "inactive", "blocked"];
    if (!valid.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updated = await Supplier.findByIdAndUpdate(
      id,
      { $set: { status: body.status, verificationNotes: body.notes || "" } },
      { new: true }
    ).select("-password");

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("PATCH /api/supplier/[id]/status error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
