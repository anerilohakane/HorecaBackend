import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Claim from "@/lib/db/models/Claim";

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
    await claim.save();

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
