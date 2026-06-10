import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";
import { notifyODTTeam } from "@/lib/utils/odtNotifications";

export async function POST(req) {
  try {
    await connectDB();
    const { token, claimIds } = await req.json();

    if (!token || !claimIds || !Array.isArray(claimIds)) {
      return NextResponse.json({ success: false, error: "Token and claimIds array are required" }, { status: 400 });
    }

    if (claimIds.length === 0) {
      return NextResponse.json({ success: true, message: "No claims to reject" });
    }

    // Find a claim to get orderId before updating
    const firstClaim = await Claim.findOne({ approvalToken: token, claimId: { $in: claimIds } });
    const orderId = firstClaim ? firstClaim.orderId : null;

    const result = await Claim.updateMany(
      { approvalToken: token, claimId: { $in: claimIds }, status: "REQUESTED" },
      { 
        $set: { 
          status: "REJECTED",
          vendorResponseStatus: "REJECTED"
        },
        $push: {
          actionLog: {
            action: "VENDOR_REJECTED",
            note: "Rejected by vendor via bulk approval portal",
            performedBy: "Vendor",
            timestamp: new Date()
          }
        }
      }
    );

    if (orderId) {
      await notifyODTTeam(orderId);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${result.modifiedCount} claims rejected successfully` 
    });
  } catch (error) {
    console.error("Reject bulk claims error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
