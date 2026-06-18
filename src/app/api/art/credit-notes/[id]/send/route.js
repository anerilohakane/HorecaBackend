import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import CustomerCreditNote from "@/lib/db/models/art/CustomerCreditNote";

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { sentVia } = body; // 'Email' or 'WhatsApp'

    if (!sentVia) {
      return NextResponse.json({ success: false, error: "sentVia (Email or WhatsApp) is required" }, { status: 400 });
    }

    const cn = await CustomerCreditNote.findById(id);
    if (!cn) {
      return NextResponse.json({ success: false, error: "Credit Note not found" }, { status: 404 });
    }

    // Mark as Sent
    cn.communicationStatus = "Sent";
    cn.sentVia = sentVia;
    cn.sentAt = new Date();

    await cn.save();

    const updatedCn = await CustomerCreditNote.findById(id)
      .populate("customer", "name email phone businessName")
      .populate("assignedArtMember", "name email");

    return NextResponse.json({ success: true, data: updatedCn }, { status: 200 });
  } catch (error) {
    console.error("PATCH Credit Note Send Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
