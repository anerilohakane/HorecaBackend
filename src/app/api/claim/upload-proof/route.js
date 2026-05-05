import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";

export async function POST(req) {
  try {
    await connectDB();
    const { claimId, proofUrl } = await req.json();

    if (!claimId || !proofUrl) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const claim = await Claim.findByIdAndUpdate(
      claimId,
      { proofUrl, status: 'RAISED' }, // Automatically move to RAISED if proof is uploaded? Or just update proof.
      { new: true }
    );

    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: claim });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
