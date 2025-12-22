// app/api/suppliers/[id]/verify/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";
// import { getUserFromRequest, requireAdmin } from "@/lib/serverAuth";

/**
 * Helper: simple ObjectId string check
 */
function isValidObjectIdString(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

export async function PUT(request, { params }) {
  await dbConnect();

  // NOTE: Temporarily bypassing auth for verification flow.
  // To re-enable, uncomment the imports above and use:
  // const user = await getUserFromRequest(request);
  // if (!requireAdmin(user)) { return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }); }

  try {
    // IMPORTANT: await params before accessing properties (Next.js requirement)
    const { id } = await params;

    if (!isValidObjectIdString(id)) {
      return NextResponse.json({ success: false, error: "Invalid supplier id" }, { status: 400 });
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const supplier = await Supplier.findById(id);
    if (!supplier) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    supplier.status = status;
    supplier.verificationNotes = notes || "";
    supplier.verifiedAt = new Date();
    // optionally set verifiedBy to admin id from token:
    // supplier.verifiedBy = user?.id || null;

    await supplier.save();

    const obj = supplier.toObject();
    delete obj.password;

    return NextResponse.json({ success: true, data: obj });
  } catch (err) {
    console.error("PUT /api/suppliers/[id]/verify error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
