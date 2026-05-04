import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import POTemplate from "@/lib/db/models/POTemplate";
import Supplier from "@/lib/db/models/supplier";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query = {};
    if (status && status !== "All") {
      query.status = status;
    }

    const templates = await POTemplate.find(query)
      .populate("supplier", "businessName name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: templates }, { status: 200 });
  } catch (error) {
    console.error("GET /api/procurement/po-templates Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const { templateName, supplier, headers } = body;

    if (!templateName || !supplier || !headers || !Array.isArray(headers) || headers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Template Name, Supplier, and Headers are required." },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const existingSupplier = await Supplier.findById(supplier);
    if (!existingSupplier) {
      return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });
    }

    const newTemplate = new POTemplate({
      templateName,
      supplier,
      headers,
      status: "Active"
    });

    await newTemplate.save();

    return NextResponse.json({ success: true, data: newTemplate }, { status: 201 });
  } catch (error) {
    console.error("POST /api/procurement/po-templates Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
