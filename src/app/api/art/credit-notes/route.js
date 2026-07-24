import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import CustomerCreditNote from "@/lib/db/models/art/CustomerCreditNote";
import User from "@/lib/db/models/User";
import Customer from "@/lib/db/models/customer";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const assignedArtMember = searchParams.get("assignedArtMember");
    const communicationStatus = searchParams.get("communicationStatus");
    const customer = searchParams.get("customer");
    
    const query = {};
    if (assignedArtMember) query.assignedArtMember = assignedArtMember;
    if (communicationStatus) query.communicationStatus = communicationStatus;
    if (customer) query.customer = customer;

    const notes = await CustomerCreditNote.find(query)
      .populate("customer", "name email phone businessName advanceBalance cnBalance")
      .populate("assignedArtMember", "name email")
      .sort({ createdAt: -1 });

    // 🔄 Auto-correct CN amounts to exact product prices if needed
    for (const note of notes) {
      if (note.items && note.items.length > 0) {
        const itemSum = note.items.reduce((sum, item) => sum + (Number(item.amount) || (Number(item.quantity || 0) * Number(item.rate || 0))), 0);
        if (itemSum > 0 && Math.abs(note.amount - itemSum) > 0.01) {
          note.amount = itemSum;
          await CustomerCreditNote.findByIdAndUpdate(note._id, { $set: { amount: itemSum } });
        }
      }
    }

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error("GET Credit Notes Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    if (!body.customer || !body.amount || !body.reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Attempt to auto-assign to an ART member if not provided
    let assignedArtMember = body.assignedArtMember;
    if (!assignedArtMember) {
      const artUsers = await User.find({ "jobDetails.department": "ART" });
      if (artUsers.length > 0) {
        assignedArtMember = artUsers[Math.floor(Math.random() * artUsers.length)]._id;
      }
    }

    const cn = await CustomerCreditNote.create({
      ...body,
      assignedArtMember,
      communicationStatus: "Pending"
    });

    // 💳 Increment customer's CN balance
    await Customer.findByIdAndUpdate(body.customer, {
      $inc: { cnBalance: Number(body.amount) }
    });

    const populatedCn = await CustomerCreditNote.findById(cn._id)
      .populate("customer", "name email phone businessName advanceBalance cnBalance")
      .populate("assignedArtMember", "name email");

    return NextResponse.json({ success: true, data: populatedCn }, { status: 201 });
  } catch (error) {
    console.error("POST Credit Notes Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
