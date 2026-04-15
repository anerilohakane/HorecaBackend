import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import CreditNote from "@/lib/db/models/inventory/CreditNote";
import { logger } from "@/lib/logger";

// GET - List credit notes
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { cnNumber: { $regex: search, $options: "i" } },
        { poNumber: { $regex: search, $options: "i" } },
        { grnNumber: { $regex: search, $options: "i" } },
        { "supplier.name": { $regex: search, $options: "i" } },
      ];
    }

    const creditNotes = await CreditNote.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const allCNs = await CreditNote.find({}).lean();
    const stats = {
      total: allCNs.length,
      kaccha: allCNs.filter((cn) => cn.type === "Kaccha").length,
      pakka: allCNs.filter((cn) => cn.type === "Pakka").length,
      provisional: allCNs.filter((cn) => cn.status === "Provisional").length,
      confirmed: allCNs.filter((cn) => cn.status === "Confirmed").length,
      cancelled: allCNs.filter((cn) => cn.status === "Cancelled").length,
      totalCreditAmount: allCNs
        .filter((cn) => cn.status !== "Cancelled")
        .reduce((sum, cn) => sum + (cn.totalCreditAmount || 0), 0),
      provisionalAmount: allCNs
        .filter((cn) => cn.status === "Provisional")
        .reduce((sum, cn) => sum + (cn.totalCreditAmount || 0), 0),
      confirmedAmount: allCNs
        .filter((cn) => cn.status === "Confirmed")
        .reduce((sum, cn) => sum + (cn.totalCreditAmount || 0), 0),
    };

    await logger({
      action: "read",
      message: `Fetched credit notes (count: ${creditNotes.length})`,
      metadata: { entity: "CreditNote", count: creditNotes.length },
      req: request,
    });

    return NextResponse.json({
      success: true,
      data: creditNotes,
      stats,
      count: creditNotes.length,
    });
  } catch (error) {
    console.error("Error in credit notes GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch credit notes",
      },
      { status: 500 }
    );
  }
}

// POST - Manually create a credit note
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const cn = new CreditNote(body);
    await cn.save();

    await logger({
      action: "created",
      message: `Created ${cn.type} Credit Note: ${cn.cnNumber}`,
      metadata: { entity: "CreditNote", entityId: cn.cnNumber },
      req: request,
    });

    return NextResponse.json({ success: true, data: cn }, { status: 201 });
  } catch (error) {
    console.error("Error in credit notes POST:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create credit note",
      },
      { status: 500 }
    );
  }
}

// PATCH - Confirm or cancel a credit note
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.cnId) {
      return NextResponse.json(
        { success: false, error: "cnId is required" },
        { status: 400 }
      );
    }

    const update = {};
    if (body.action === "confirm") {
      update.status = "Confirmed";
      update.type = "Pakka";
      update.confirmedAt = new Date();
      update.confirmedBy = body.user || "Admin";
    } else if (body.action === "cancel") {
      update.status = "Cancelled";
      update.cancelledAt = new Date();
      update.cancelledBy = body.user || "Admin";
    }
    if (body.notes) update.notes = body.notes;

    const updated = await CreditNote.findByIdAndUpdate(
      body.cnId,
      { $set: update },
      { new: true }
    );

    await logger({
      action: "updated",
      message: `${body.action === "confirm" ? "Confirmed" : "Cancelled"} CN: ${updated?.cnNumber}`,
      metadata: { entity: "CreditNote", entityId: updated?.cnNumber },
      req: request,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error in credit notes PATCH:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update credit note",
      },
      { status: 500 }
    );
  }
}
