import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";

export async function POST(req) {
  try {
    await connectDB();
    const { token, claimIds } = await req.json();

    if (!token || !claimIds || !Array.isArray(claimIds)) {
      return NextResponse.json({ success: false, error: "Token and claimIds array are required" }, { status: 400 });
    }

    if (claimIds.length === 0) {
      return NextResponse.json({ success: true, message: "No claims to approve" });
    }

    const result = await Claim.updateMany(
      { approvalToken: token, claimId: { $in: claimIds }, status: "REQUESTED" },
      { $set: { status: "APPROVED", approvalDate: new Date() } }
    );

    return NextResponse.json({ 
      success: true, 
      message: `${result.modifiedCount} claims approved successfully` 
    });
  } catch (error) {
    console.error("Approve bulk claims error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
