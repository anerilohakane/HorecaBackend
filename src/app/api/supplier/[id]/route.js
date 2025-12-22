// app/api/suppliers/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";

// cloudinary setup (server-side)
import cloudinary from "cloudinary";
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// DEBUG (runs when module is loaded)
(() => {
  try {
    console.log("🔧 suppliers/[id] route loaded");
    console.log("  • NODE_ENV:", process.env.NODE_ENV);
    console.log("  • Cloudinary env present:",
      {
        CLOUDINARY_CLOUD_NAME: !!(process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
        CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET
      }
    );
    // show cloudinary config summary (do NOT print secrets)
    const conf = cloudinary.v2.config();
    console.log("  • Cloudinary config cloud_name:", conf && conf.cloud_name ? conf.cloud_name : "(not configured)");
  } catch (e) {
    console.warn("Failed to log Cloudinary debug info:", e?.message || e);
  }
})();

function isValidObjectIdString(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

export async function GET(request, { params }) {
  await dbConnect();
  try {
    // MUST await params in App Router
    const { id } = await params;
    console.log("[GET /api/suppliers/[id]] supplierId:", id);

    if (!isValidObjectIdString(id)) return NextResponse.json({ success: false, error: "Invalid supplier id" }, { status: 400 });

    const sup = await Supplier.findById(id).select("-password").lean();
    if (!sup) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: sup });
  } catch (err) {
    console.error("GET /api/suppliers/[id] error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    console.log("[PATCH /api/suppliers/[id]] supplierId:", id);

    if (!isValidObjectIdString(id)) return NextResponse.json({ success: false, error: "Invalid supplier id" }, { status: 400 });

    const body = await request.json();
    if (body.email) {
      const exists = await Supplier.findOne({ email: body.email.toLowerCase().trim(), _id: { $ne: id } });
      if (exists) return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
      body.email = body.email.toLowerCase().trim();
    }

    // Do not update password here (pre-save hooks won't run). Use a dedicated password-change route if needed.
    const updated = await Supplier.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true, context: "query" }).select("-password");
    if (!updated) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("PATCH /api/suppliers/[id] error", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    console.log("[DELETE /api/suppliers/[id]] supplierId:", id);

    if (!isValidObjectIdString(id)) return NextResponse.json({ success: false, error: "Invalid supplier id" }, { status: 400 });

    // Try to find the supplier first to collect any document public_ids for deletion
    const supplier = await Supplier.findById(id).select("-password").lean();
    if (!supplier) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    // If supplier has documents with cloudinary public ids, attempt to delete them
    if (Array.isArray(supplier.documents) && supplier.documents.length > 0) {
      console.log(`[DELETE] supplier has ${supplier.documents.length} document(s) — attempting cloudinary cleanup (if configured)`);
      for (const doc of supplier.documents) {
        const publicId = doc.publicId || doc.cloudinaryId || doc.id;
        if (publicId && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
          try {
            await cloudinary.v2.uploader.destroy(publicId, { resource_type: 'auto' });
            console.log(`Deleted cloudinary asset ${publicId}`);
          } catch (err) {
            console.warn(`Failed to delete cloudinary asset ${publicId}:`, err?.message || err);
            // don't fail supplier deletion if cloudinary deletion fails
          }
        } else if (publicId) {
          console.log(`Cloudinary publicId present (${publicId}) but CLOUDINARY_API_KEY/SECRET not configured — skipping delete`);
        }
      }
    }

    const deleted = await Supplier.findByIdAndDelete(id).select("-password");
    if (!deleted) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: deleted });
  } catch (err) {
    console.error("DELETE /api/suppliers/[id] error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
