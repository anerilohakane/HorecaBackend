import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import ClaimTemplate from "@/lib/db/models/ClaimTemplate";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const id = params.id;
    const body = await req.json();

    const template = await ClaimTemplate.findByIdAndUpdate(id, body, { new: true });
    
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const id = params.id;

    const template = await ClaimTemplate.findByIdAndDelete(id);
    
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
