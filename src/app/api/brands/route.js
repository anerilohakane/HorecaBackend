

// /app/api/brands/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Brand from "@/lib/db/models/brand";
import Product from "@/lib/db/models/product"; // optional if you later want to include products



// /app/api/brands/route.js (GET only root brands + populate children)
export async function GET(request) {
  await dbConnect();
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, parseInt(url.searchParams.get("limit") || "50", 10));
    const skip = (page - 1) * limit;

    const filter = {};
    const isActive = url.searchParams.get('isActive');
    if (isActive === 'true') filter.isActive = true;
    if (isActive === 'false') filter.isActive = false;

    const list = await Brand.find(filter)
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Brand.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: { items: list, pagination: { total, page, limit, pages: Math.ceil(total / limit) } }
    });
  } catch (err) {
    console.error("GET /api/brands error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


// Single POST handler (subBrand-aware)
export async function POST(request) {
  await dbConnect();
  try {
    const body = await request.json();

    // Basic required check
    if (!body.name || String(body.name).trim() === "") {
      return NextResponse.json({ success: false, error: "Brand name required" }, { status: 400 });
    }

    // Normalize name
    const name = String(body.name).trim();

    // If parent provided, validate it's a valid ObjectId and exists
    let parentId = null;
    if (body.parent) {
      const maybeParent = String(body.parent).trim();
      if (!/^[0-9a-fA-F]{24}$/.test(maybeParent)) {
        return NextResponse.json({ success: false, error: "Invalid parent id" }, { status: 400 });
      }

      const parentDoc = await Brand.findById(maybeParent).lean();
      if (!parentDoc) {
        return NextResponse.json({ success: false, error: "Parent Brand not found" }, { status: 404 });
      }
      parentId = maybeParent;
    }

    // Prevent duplicate sibling name: same name under same parent
    const siblingFilter = parentId ? { parent: parentId, name } : { parent: null, name };
    const existing = await Brand.findOne(siblingFilter).lean();
    if (existing) {
      return NextResponse.json({ success: false, error: "Brand with the same name already exists under this parent" }, { status: 409 });
    }

    // Build Brand payload
    const payload = {
      name,
      description: body.description ?? undefined,
      image: body.image ?? undefined,
      parent: parentId ?? null,
      handlingFee: typeof body.handlingFee === "number" ? body.handlingFee : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      createdBy: body.createdBy ?? undefined,
    };

    const newBrand = new Brand(payload);
    await newBrand.save();

    // Optionally return parent basic info so client can update UI without another fetch
    let parentInfo = null;
    if (parentId) {
      const p = await Brand.findById(parentId).select("_id name image").lean();
      if (p) {
        parentInfo = {
          id: String(p._id),
          name: p.name,
          image: p.image?.url ?? null,
        };
      }
    }

    const result = {
      id: String(newBrand._id),
      name: newBrand.name,
      description: newBrand.description ?? "",
      image: newBrand.image ?? null,
      parent: parentInfo,
      handlingFee: newBrand.handlingFee ?? 0,
      isActive: newBrand.isActive,
      createdAt: newBrand.createdAt,
      updatedAt: newBrand.updatedAt,
    };

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    console.error("POST /api/brands error", err);
    if (err && err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}

