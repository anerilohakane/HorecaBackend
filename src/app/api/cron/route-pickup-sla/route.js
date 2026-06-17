import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ReturnRequest from "@/lib/db/models/returnRequest";
import ReturnActivityLog from "@/lib/db/models/returnActivityLog";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();

    // Find returns that are assigned to a route planner but not picked up within the SLA
    const breachedReturns = await ReturnRequest.find({
      status: { $in: ["Route Planner Assigned", "Pickup Scheduled", "Pickup In Progress"] },
      pickupSlaDueDate: { $lt: new Date() }
    });

    let count = 0;
    for (const returnReq of breachedReturns) {
      returnReq.status = "Pickup Delayed";
      returnReq.notes = (returnReq.notes || "") + "\nEscalated automatically: Route planner failed to complete pickup within 3 days.";
      await returnReq.save();

      await ReturnActivityLog.create({
        returnRequest: returnReq._id,
        action: "SLA Breached",
        oldStatus: returnReq.status, // Before save status technically, but we know it's one of the array
        newStatus: "Pickup Delayed",
        remarks: "Route planner did not complete pickup within the 3-day SLA.",
        userType: "System"
      });

      count++;
    }

    return NextResponse.json({ message: "Route SLA Cron executed", escalatedCount: count }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
