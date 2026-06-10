import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import POTemplate from "@/lib/db/models/POTemplate";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const template = await POTemplate.findById(id).populate("supplier", "businessName name email");
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: template }, { status: 200 });
  } catch (error) {
    console.error("GET /api/procurement/po-templates/[id] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await req.json();

    const template = await POTemplate.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("supplier", "businessName name email");

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: template }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/procurement/po-templates/[id] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const template = await POTemplate.findByIdAndDelete(id);

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Template deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/procurement/po-templates/[id] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
