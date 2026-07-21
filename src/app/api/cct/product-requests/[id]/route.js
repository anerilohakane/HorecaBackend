import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ProductRequest from "@/lib/db/models/ProductRequest";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const requestId = resolvedParams.id;
    const body = await req.json();
    const { action, cctRemarks, isColdStorage, margin } = body;

    let status;
    if (action === 'approve') status = 'Approved';
    else if (action === 'reject') status = 'Rejected';
    else status = body.status; // fallback if they actually send status

    if (!requestId || !status) {
      return NextResponse.json({ success: false, error: "Missing required fields or invalid action" }, { status: 400 });
    }

    // Prepare update object
    const updateData = { status };
    if (cctRemarks !== undefined) updateData.cctRemarks = cctRemarks;
    if (isColdStorage !== undefined) updateData.isColdStorage = isColdStorage;
    if (margin !== undefined) updateData.margin = margin;

    const updatedRequest = await ProductRequest.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    );

    if (!updatedRequest) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error) {
    console.error("PATCH /api/cct/product-requests/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, context) {
  return PATCH(req, context);
}
