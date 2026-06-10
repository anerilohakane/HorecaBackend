import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Brand from "@/lib/db/models/brand";

export async function GET(request) {
  await dbConnect();
  try {
    const url = new URL(request.url);
    const isActive = url.searchParams.get("isActive");

    // Only fetch root-level brands (parent = null) as they act as categories
    const filter = { parent: null };
    if (isActive === "true") filter.isActive = true;
    else if (isActive === "false") filter.isActive = false;
    else filter.isActive = true; // Default: only active categories

    const categories = await Brand.find(filter)
      .sort({ name: 1 })
      .lean();

    const mapped = categories.map((cat) => ({
      _id: String(cat._id),
      id: String(cat._id),
      name: cat.name,
      description: cat.description ?? "",
      image:
        (cat.image && typeof cat.image === "object" ? cat.image.url : cat.image) ?? null,
      isActive: cat.isActive,
      handlingFee: cat.handlingFee ?? 0,
      createdAt: cat.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (err) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
