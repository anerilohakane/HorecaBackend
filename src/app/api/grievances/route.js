import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Grievance from "@/lib/db/models/grievance";
import GrievanceActivityLog from "@/lib/db/models/grievanceActivityLog";
import mongoose from "mongoose";

// Define TAT hours based on category
const TAT_HOURS = {
  "Delivery Delay": 24,
  "Missing Item": 48,
  "Product Quality Issue": 72,
  "Payment Issue": 24,
  "Wrong Product": 48,
  "Other": 48,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const orderId = searchParams.get("orderId");

    const query = {};
    if (customerId) query.customerId = customerId;
    if (orderId) query.orderId = orderId;

    const grievances = await Grievance.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ data: grievances }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { category, customerId, description } = body;

    if (!category || !customerId || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    // Generate dueAt
    const hours = TAT_HOURS[category] || 48;
    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + hours);

    // Generate a simple grievance ID
    const randomHex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
    const grievanceIdStr = `GRV-${new Date().toISOString().slice(2,10).replace(/-/g,"")}-${randomHex}`;

    const newGrievance = await Grievance.create({
      ...body,
      grievanceId: grievanceIdStr,
      dueAt,
    });

    await GrievanceActivityLog.create({
      grievanceId: newGrievance._id,
      actionType: "Created",
      newValue: "Open",
      notes: "Grievance raised by customer",
      performedBy: customerId, // Customer ID
    });

    return NextResponse.json({ message: "Grievance created", data: newGrievance }, { status: 201, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
}
