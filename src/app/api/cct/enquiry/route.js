import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { productName, productSku, customerName, customerPhone, customerEmail, notes } = body;

    if (!productName) {
      return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    }

    // Construct lead document
    const lead = {
      name: customerName || "Enquiry Customer",
      company: `Product Enquiry: ${productName}`,
      email: customerEmail || "",
      phone: customerPhone || "",
      status: "new",
      source: "website",
      value: 0,
      notes: notes || `Enquiry for ${productName} (SKU: ${productSku || "N/A"}). Customer is interested but product is not mapped.`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const leadsCollection = mongoose.connection.db.collection("leads");
    const result = await leadsCollection.insertOne(lead);

    return NextResponse.json({
      success: true,
      message: "Enquiry registered successfully",
      leadId: result.insertedId
    });
  } catch (error) {
    console.error("POST /api/cct/enquiry error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
