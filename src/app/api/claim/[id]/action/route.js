import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";
import { notifyODTTeam } from "@/lib/utils/odtNotifications";
import { getUserFromRequest } from "@/lib/serverAuth";

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const user = await getUserFromRequest(req);
    const claimId = params.id;
    const body = await req.json();
    const { action, reason } = body;

    if (!user || user.role !== "sales") {
      return NextResponse.json({ success: false, error: "Unauthorized. Sales role required." }, { status: 403 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
    }

    if (claim.status !== "REQUESTED" && claim.status !== "PENDING") {
      return NextResponse.json({ success: false, error: `Claim is already ${claim.status.toLowerCase()}` }, { status: 400 });
    }

    if (action === "approve") {
      claim.status = "APPROVED";
      claim.vendorResponseStatus = "APPROVED";
      claim.approvalDate = new Date();
      claim.approvedBy = user.name || user.email;

      if (!claim.actionLog) claim.actionLog = [];
      claim.actionLog.push({
        action: "SALES_APPROVED",
        note: "Approved by Sales Representative via Dashboard",
        performedBy: user.name || user.email,
        timestamp: new Date()
      });
    } else if (action === "reject") {
      claim.status = "REJECTED";
      claim.vendorResponseStatus = "REJECTED";
      claim.rejectionReason = reason || "No reason provided";

      if (!claim.actionLog) claim.actionLog = [];
      claim.actionLog.push({
        action: "SALES_REJECTED",
        note: `Rejected by Sales Representative via Dashboard. Reason: ${claim.rejectionReason}`,
        performedBy: user.name || user.email,
        timestamp: new Date()
      });
    }

    await claim.save();

    // Notify ODT Team
    if (claim.orderId) {
      await notifyODTTeam(claim.orderId);
    }

    return NextResponse.json({
      success: true,
      message: `Claim ${action}d successfully`,
      claim
    });

  } catch (error) {
    console.error(`[CLAIM_ACTION_ERROR]`, error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
