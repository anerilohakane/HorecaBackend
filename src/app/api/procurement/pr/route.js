import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import PurchaseRequest from "@/lib/db/models/inventory/PurchaseRequest";
import { logger } from "@/lib/logger";

// GET - List PRs
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const department = searchParams.get("department");

    let query = {};
    if (status && status !== "All") query.status = status;
    if (department) query.department = department;

    const prs = await PurchaseRequest.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: prs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Create PR
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const pr = new PurchaseRequest(body);
    await pr.save();

    await logger({
      action: "created",
      message: `Created PR: ${pr.prNumber}`,
      metadata: { entity: "PurchaseRequest", entityId: pr.prNumber },
      req: request,
    });

    return NextResponse.json({ success: true, data: pr }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Approve/Reject PR
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { prId, status, comments, approvedBy } = body;

    if (!prId || !status) {
      return NextResponse.json({ success: false, error: "prId and status are required" }, { status: 400 });
    }

    const pr = await PurchaseRequest.findById(prId);
    if (!pr) {
      return NextResponse.json({ success: false, error: "PR not found" }, { status: 404 });
    }

    pr.status = status;
    pr.approvalDetails = {
      approvedBy: approvedBy || "Admin",
      approvedAt: new Date(),
      comments,
    };

    await pr.save();

    await logger({
      action: "updated",
      message: `PR ${pr.prNumber} status updated to ${status}`,
      metadata: { entity: "PurchaseRequest", entityId: pr.prNumber, status },
      req: request,
    });

    return NextResponse.json({ success: true, data: pr });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
