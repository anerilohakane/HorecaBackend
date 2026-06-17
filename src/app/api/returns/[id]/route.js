import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import ReturnRequest from "@/lib/db/models/returnRequest";
import ReturnActivityLog from "@/lib/db/models/returnActivityLog";
import Order from "@/lib/db/models/order";
import User from "@/lib/db/models/User";
import Supplier from "@/lib/db/models/supplier";
import Product from "@/lib/db/models/product";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const returnReq = await ReturnRequest.findById(id)
      .populate("order")
      .populate("items.product", "name sku")
      .populate("requester", "name email phone")
      .populate("supplier", "name");

    if (!returnReq) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    }

    const activityLogs = await ReturnActivityLog.find({ returnRequest: id }).sort({ createdAt: -1 });

    return NextResponse.json({ data: returnReq, logs: activityLogs }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const returnReq = await ReturnRequest.findById(id);
    if (!returnReq) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
    }

    const oldStatus = returnReq.status;
    
    // Update fields
    Object.keys(body).forEach((key) => {
      // Don't arbitrarily overwrite specific protected objects unless handled
      if (key !== "action" && key !== "performedBy" && key !== "userType" && key !== "remarks") {
        returnReq[key] = body[key];
      }
    });

    if (body.status === "Vendor Approved") {
      // Set Pickup SLA to 3 days from approval
      returnReq.pickupSlaDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      returnReq.vendorActedAt = new Date();
    } else if (body.status === "Awaiting Pickup Confirmation") {
      returnReq.vendorActedAt = new Date();
    } else if (body.status === "Pending SCM Assignment") {
      returnReq.pickupConfirmedAt = new Date();
    }

    await returnReq.save();

    if (body.action || body.status !== oldStatus) {
      await ReturnActivityLog.create({
        returnRequest: id,
        action: body.action || "Status Updated",
        oldStatus,
        newStatus: returnReq.status,
        remarks: body.remarks || `Status changed from ${oldStatus} to ${returnReq.status}`,
        performedBy: body.performedBy || null,
        userType: body.userType || "System"
      });
    }

    return NextResponse.json({ message: "Updated successfully", data: returnReq }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
}
