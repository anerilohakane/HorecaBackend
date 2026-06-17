import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ReturnRequest from "@/lib/db/models/returnRequest";
import ReturnActivityLog from "@/lib/db/models/returnActivityLog";

export async function GET(request) {
  try {
    // Vercel cron security (optional based on setup, commonly uses auth headers)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();

    // Find returns that are past their Vendor Approval SLA Due Date
    // and have not been confirmed for pickup or acted upon properly
    const breachedReturns = await ReturnRequest.find({
      status: "Vendor Approved",
      pickupSlaDueDate: { $lt: new Date() }
    });

    let count = 0;
    for (const returnReq of breachedReturns) {
      returnReq.status = "Escalated";
      returnReq.notes = (returnReq.notes || "") + "\nEscalated automatically: Vendor failed to confirm pickup readiness within 3 days.";
      await returnReq.save();

      await ReturnActivityLog.create({
        returnRequest: returnReq._id,
        action: "SLA Breached",
        oldStatus: "Vendor Approved",
        newStatus: "Escalated",
        remarks: "Vendor did not confirm pickup readiness within the 3-day SLA.",
        userType: "System"
      });

      count++;
    }

    return NextResponse.json({ message: "SLA Cron executed", escalatedCount: count }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
