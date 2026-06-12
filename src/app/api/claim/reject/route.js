import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";
import { notifyODTTeam } from "@/lib/utils/odtNotifications";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 400 });
    }

    const claim = await Claim.findOne({ approvalToken: token });
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim not found or token expired" }, { status: 404 });
    }

    if (claim.status !== "REQUESTED") {
      return NextResponse.json({ success: false, error: `Claim already ${claim.status.toLowerCase()}` });
    }

    claim.status = "REJECTED";
    claim.vendorResponseStatus = "REJECTED";
    
    if (!claim.actionLog) claim.actionLog = [];
    claim.actionLog.push({
      action: "VENDOR_REJECTED",
      note: "Rejected by vendor sales representative via email direct link",
      performedBy: "Vendor Representative",
      timestamp: new Date()
    });

    await claim.save();

    if (claim.orderId) {
      await notifyODTTeam(claim.orderId);
    }

    return new Response(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #ef4444;">Rejected</h1>
        <p>The claim request ${claim.claimId} has been rejected.</p>
        <p>The order will remain in pending state.</p>
      </div>
    `, { headers: { "Content-Type": "text/html" } });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { claimId, proofUrl, rejectionReason, performedBy, department } = await req.json();

    if (!claimId) {
      return NextResponse.json({ success: false, error: "Claim ID is required" }, { status: 400 });
    }

    if (department && department.toLowerCase() !== 'sales' && department.toLowerCase() !== 'admin') {
      return NextResponse.json({ success: false, error: "Only Sales team can reject claims" }, { status: 403 });
    }

    const claim = await Claim.findOne({ claimId });
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
    }

    if (claim.status !== "PENDING" && claim.status !== "REQUESTED") {
      return NextResponse.json({ success: false, error: `Claim cannot be rejected in its current status: ${claim.status}` }, { status: 400 });
    }

    const actor = performedBy || "Admin Dashboard";

    claim.status = "REJECTED";
    claim.vendorResponseStatus = "REJECTED";
    if (rejectionReason) claim.rejectionReason = rejectionReason;
    if (proofUrl) claim.proofUrl = proofUrl;

    if (!claim.actionLog) claim.actionLog = [];
    claim.actionLog.push({
      action: "ODT_REJECTED",
      note: `Rejected by SCM/ODT team. Reason: ${rejectionReason || "No reason specified"}. Proof uploaded: ${proofUrl ? "Yes" : "No"}`,
      performedBy: actor,
      timestamp: new Date()
    });

    await claim.save();

    if (claim.orderId) {
      await notifyODTTeam(claim.orderId);
    }

    return NextResponse.json({ success: true, message: "Claim rejected successfully", data: claim });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
