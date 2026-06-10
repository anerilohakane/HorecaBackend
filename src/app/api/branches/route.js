import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Branch from "@/lib/db/models/Branch";

export async function GET(req) {
  try {
    await dbConnect();
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json({ success: true, data: branches });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const branch = await Branch.create(body);
    return NextResponse.json({ success: true, data: branch }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Branch name or code already exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
