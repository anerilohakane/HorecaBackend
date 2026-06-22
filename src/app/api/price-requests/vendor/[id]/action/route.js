import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PriceNegotiation from "@/lib/db/models/PriceNegotiation";
import Product from "@/lib/db/models/product";
import { getUserFromRequest } from "@/lib/serverAuth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const reqId = resolvedParams?.id;

    if (!reqId) {
      return NextResponse.json({ success: false, error: "Price Request ID is missing" }, { status: 400, headers: corsHeaders });
    }

    await dbConnect();
    const user = await getUserFromRequest(request);
    const body = await request.json();
    const { action, reason, remarks } = body;

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401, headers: corsHeaders });
    }

    if (user.role && user.role !== "vendor" && user.role !== "supplier") {
      return NextResponse.json({ success: false, error: "Unauthorized. Vendor role required." }, { status: 403, headers: corsHeaders });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400, headers: corsHeaders });
    }

    const priceRequest = await PriceNegotiation.findById(reqId);
    if (!priceRequest) {
      return NextResponse.json({ success: false, error: "Price request not found" }, { status: 404, headers: corsHeaders });
    }

    // Verify product belongs to vendor
    const product = await Product.findById(priceRequest.product).select('supplierId');
    if (!product || product.supplierId.toString() !== user.id.toString()) {
      return NextResponse.json({ success: false, error: "Unauthorized. Product does not belong to your account." }, { status: 403, headers: corsHeaders });
    }

    if (priceRequest.vendorStatus !== "pending") {
      return NextResponse.json({ success: false, error: `Price request is already vendor ${priceRequest.vendorStatus}` }, { status: 400, headers: corsHeaders });
    }

    if (action === "approve") {
      priceRequest.vendorStatus = "approved";
      priceRequest.vendorActionDate = new Date();
      priceRequest.vendorActionBy = user.name || user.email;
      
      if (!priceRequest.remarks) priceRequest.remarks = [];
      if (remarks) {
        priceRequest.remarks.push({
          senderType: "Sales", // Using Sales for now to fit the schema, though it's technically Vendor
          senderId: user.id,
          senderModel: "User",
          message: `Vendor Approved. Remarks: ${remarks}`
        });
      }
    } else if (action === "reject") {
      priceRequest.vendorStatus = "rejected";
      priceRequest.status = "rejected"; // Rejecting it completely since vendor said no
      priceRequest.vendorRejectionReason = reason || "No reason provided";
      priceRequest.vendorActionDate = new Date();
      priceRequest.vendorActionBy = user.name || user.email;

      if (!priceRequest.remarks) priceRequest.remarks = [];
      if (remarks || reason) {
        priceRequest.remarks.push({
          senderType: "Sales",
          senderId: user.id,
          senderModel: "User",
          message: `Vendor Rejected. Reason: ${priceRequest.vendorRejectionReason}. Remarks: ${remarks || "None"}`
        });
      }
    }

    await priceRequest.save();

    return NextResponse.json({
      success: true,
      message: `Price request ${action}d by vendor successfully`,
      data: priceRequest
    }, { headers: corsHeaders });

  } catch (error) {
    console.error(`[VENDOR_PRICE_REQUEST_ACTION_ERROR]`, error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
