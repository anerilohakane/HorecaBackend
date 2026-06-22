import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";
import { notifyODTTeam } from "@/lib/utils/odtNotifications";
import { getUserFromRequest } from "@/lib/serverAuth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    const claimId = params.id;
    const body = await req.json();
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

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404, headers: corsHeaders });
    }

    // Verify claim belongs to this vendor
    if (claim.vendorId.toString() !== user.id.toString()) {
      return NextResponse.json({ success: false, error: "Unauthorized. Claim does not belong to your account." }, { status: 403, headers: corsHeaders });
    }

    if (claim.status !== "REQUESTED" && claim.status !== "PENDING") {
      return NextResponse.json({ success: false, error: `Claim is already ${claim.status.toLowerCase()}` }, { status: 400, headers: corsHeaders });
    }

    if (action === "approve") {
      claim.status = "APPROVED";
      claim.vendorResponseStatus = "APPROVED";
      claim.approvalDate = new Date();
      claim.approvedBy = user.name || user.email;

      if (!claim.actionLog) claim.actionLog = [];
      claim.actionLog.push({
        action: "VENDOR_APPROVED",
        note: `Approved by Vendor via Dashboard. Remarks: ${remarks || "None"}`,
        performedBy: user.name || user.email,
        timestamp: new Date()
      });
    } else if (action === "reject") {
      claim.status = "REJECTED";
      claim.vendorResponseStatus = "REJECTED";
      claim.rejectionReason = reason || "No reason provided";

      if (!claim.actionLog) claim.actionLog = [];
      claim.actionLog.push({
        action: "VENDOR_REJECTED",
        note: `Rejected by Vendor via Dashboard. Reason: ${claim.rejectionReason}. Remarks: ${remarks || "None"}`,
        performedBy: user.name || user.email,
        timestamp: new Date()
      });
    }

    await claim.save();

    // Notify ODT Team
    if (claim.orderId) {
      try {
        await notifyODTTeam(claim.orderId);
      } catch (err) {
        console.error("Failed to notify ODT team", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Claim ${action}d successfully`,
      claim
    }, { headers: corsHeaders });

  } catch (error) {
    console.error(`[VENDOR_CLAIM_ACTION_ERROR]`, error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
