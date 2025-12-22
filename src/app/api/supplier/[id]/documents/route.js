// src/app/api/supplier/[id]/documents/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function isValidObjectIdString(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

/* ===========================
   GET documents for supplier
   =========================== */
export async function GET(request, { params }) {
  await dbConnect();
  try {
    // MUST await params (Next.js may provide a thenable)
    const { id } = await params;
    if (!isValidObjectIdString(id)) return NextResponse.json({ success: false, error: "Invalid supplier id" }, { status: 400 });

    const sup = await Supplier.findById(id).select("documents status verificationNotes verifiedAt verifiedBy").lean();
    if (!sup) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: {
        documents: sup.documents || [],
        status: sup.status,
        verificationNotes: sup.verificationNotes,
        verifiedAt: sup.verifiedAt
      }
    });
  } catch (err) {
    console.error("GET /api/supplier/[id]/documents error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/* ===========================
   POST - add a document metadata
   =========================== */
export async function POST(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    if (!isValidObjectIdString(id)) return NextResponse.json({ success: false, error: "Invalid supplier id" }, { status: 400 });

    const body = await request.json();
    if (!body || !body.url || !body.publicId) return NextResponse.json({ success: false, error: "Missing document metadata (url, publicId)" }, { status: 400 });

    const doc = {
      url: body.url,
      publicId: body.publicId,
      filename: body.filename || body.name || "",
      format: body.format || body.type || "",
      size: body.size || 0,
      category: body.category || "",
      status: "pending",
      uploadedAt: body.uploadDate ? new Date(body.uploadDate) : new Date(),
      notes: body.notes || ""
    };

    const updated = await Supplier.findByIdAndUpdate(id, { $push: { documents: doc }, $set: { status: "pending" } }, { new: true }).select("-password");
    if (!updated) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    const pushed = updated.documents?.[updated.documents.length - 1] || doc;
    return NextResponse.json({ success: true, data: pushed, supplier: updated }, { status: 201 });
  } catch (err) {
    console.error("POST /api/supplier/[id]/documents error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/* ===========================
   PATCH - update a specific document
   Accepts: { documentId | publicId | url | id, fieldsToUpdate }
   This replacement first tries an atomic positional update using mongoose.
   If that fails, it falls back to loading the supplier doc, mutating and saving.
   =========================== */
export async function PATCH(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    if (!isValidObjectIdString(id)) {
      return NextResponse.json({ success: false, error: "Invalid supplier id" }, { status: 400 });
    }

    const body = await request.json();
    const identifier = body?.documentId || body?.docId || body?.publicId || body?.url || body?.id;
    const updates = body?.fieldsToUpdate || body?.updates || (function () {
      // build updates by removing identifier keys if present
      const copy = { ...body };
      delete copy.documentId;
      delete copy.docId;
      delete copy.publicId;
      delete copy.url;
      delete copy.id;
      return copy;
    })();

    if (!identifier) return NextResponse.json({ success: false, error: "Missing documentId/publicId/url" }, { status: 400 });
    if (!updates || typeof updates !== "object" || Object.keys(updates).length === 0) return NextResponse.json({ success: false, error: "Missing updates payload" }, { status: 400 });

    // sanitize allowed update fields
    const allowed = new Set(["url", "publicId", "filename", "format", "size", "category", "status", "notes", "uploadedAt"]);
    const setOps = {};
    for (const [k, v] of Object.entries(updates)) {
      if (!allowed.has(k)) continue;
      // if uploadedAt, convert to Date
      if (k === "uploadedAt" && v) {
        setOps[`documents.$.${k}`] = new Date(v);
      } else {
        setOps[`documents.$.${k}`] = v;
      }
    }

    if (Object.keys(setOps).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    // Try atomic positional update by _id first (if identifier looks like ObjectId)
    let updatedSupplier = null;
    let updatedDoc = null;

    if (isValidObjectIdString(identifier)) {
      // identifier is a document _id (subdoc id)
      updatedSupplier = await Supplier.findOneAndUpdate(
        { _id: id, "documents._id": identifier },
        { $set: setOps },
        { new: true }
      ).select("-password").lean();
    }

    // If not found and identifier is not objectId or previous didn't match, try by publicId
    if (!updatedSupplier) {
      updatedSupplier = await Supplier.findOneAndUpdate(
        { _id: id, "documents.publicId": identifier },
        { $set: setOps },
        { new: true }
      ).select("-password").lean();
    }

    // If still not found, try by url
    if (!updatedSupplier) {
      updatedSupplier = await Supplier.findOneAndUpdate(
        { _id: id, "documents.url": identifier },
        { $set: setOps },
        { new: true }
      ).select("-password").lean();
    }

    // If atomic update succeeded, extract updated doc
    if (updatedSupplier) {
      updatedDoc = (updatedSupplier.documents || []).find(d =>
        (d && (String(d._id) === String(identifier) || d.publicId === identifier || d.url === identifier))
      ) || null;

      // return fresh supplier and updated doc
      return NextResponse.json({ success: true, data: updatedDoc, supplier: updatedSupplier }, { status: 200 });
    }

    // --- FALLBACK: load supplier, mutate and save ---
    const supplier = await Supplier.findById(id);
    if (!supplier) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    // find by subdoc id / publicId / url / contains
    const foundIndex = supplier.documents.findIndex(d =>
      (d && (
        (d._id && String(d._id) === String(identifier)) ||
        (d.publicId && d.publicId === identifier) ||
        (d.url && d.url === identifier) ||
        (d.publicId && identifier.includes(d.publicId)) ||
        (d.url && identifier.includes(d.url))
      ))
    );

    if (foundIndex === -1) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const doc = supplier.documents[foundIndex];

    // apply updates
    for (const [k, v] of Object.entries(updates)) {
      if (!allowed.has(k)) continue;
      if (k === "uploadedAt" && v) {
        doc.uploadedAt = new Date(v);
      } else {
        doc[k] = v;
      }
    }

    await supplier.save();

    const fresh = await Supplier.findById(id).select("-password").lean();
    const freshDoc = (fresh.documents || []).find(d =>
      (d && (String(d._id) === String(identifier) || d.publicId === identifier || d.url === identifier))
    ) || null;

    return NextResponse.json({ success: true, data: freshDoc, supplier: fresh }, { status: 200 });

  } catch (err) {
    console.error("PATCH /api/supplier/[id]/documents error", err);
    return NextResponse.json({ success: false, error: err.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  await dbConnect();
  try {
    const { id } = await params;
    if (!isValidObjectIdString(id)) {
      return NextResponse.json({ success: false, error: "Invalid supplier id" }, { status: 400 });
    }

    // === Safely parse request body (won't throw on empty body) ===
    let body = {};
    try {
      // read raw text first
      const txt = await request.text();
      if (txt && txt.trim().length > 0) {
        // try parse JSON if text present
        try {
          body = JSON.parse(txt);
        } catch (parseErr) {
          console.warn("[DELETE documents] Failed to parse JSON body:", parseErr?.message || parseErr);
          return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
        }
      } else {
        // empty body
        body = {};
      }
    } catch (readErr) {
      console.warn("[DELETE documents] request.text() failed:", readErr?.message || readErr);
      body = {};
    }

    const identifier = body?.documentId || body?.docId || body?.publicId || body?.url || body?.id;
    if (!identifier) {
      console.warn("[DELETE documents] Missing identifier in body. Received body:", body);
      return NextResponse.json({ success: false, error: "Missing documentId or publicId or url in request body" }, { status: 400 });
    }

    const supplier = await Supplier.findById(id);
    if (!supplier) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    // find document
    const found = (function findDocByIdentifier(supplier, identifier) {
      if (!supplier || !Array.isArray(supplier.documents)) return null;
      if (typeof supplier.documents.id === "function" && isValidObjectIdString(identifier)) {
        const f = supplier.documents.id(identifier);
        if (f) return { doc: f, index: supplier.documents.indexOf(f), via: "mongooseId" };
      }
      const byPlainIdIndex = supplier.documents.findIndex(d => d && d._id && String(d._id) === String(identifier));
      if (byPlainIdIndex !== -1) return { doc: supplier.documents[byPlainIdIndex], index: byPlainIdIndex, via: "plainId" };
      const byPublicIndex = supplier.documents.findIndex(d => d && d.publicId === identifier);
      if (byPublicIndex !== -1) return { doc: supplier.documents[byPublicIndex], index: byPublicIndex, via: "publicId" };
      const byUrlIndex = supplier.documents.findIndex(d => d && d.url === identifier);
      if (byUrlIndex !== -1) return { doc: supplier.documents[byUrlIndex], index: byUrlIndex, via: "url" };
      const byContainsIndex = supplier.documents.findIndex(d => (d && d.publicId && identifier.includes(d.publicId)) || (d && d.url && identifier.includes(d.url)));
      if (byContainsIndex !== -1) return { doc: supplier.documents[byContainsIndex], index: byContainsIndex, via: "contains" };
      return null;
    })(supplier, identifier);

    if (!found) {
      console.warn("[DELETE documents] Document not found for identifier:", identifier, "supplierId:", id);
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const { doc, index } = found;
    const removedDoc = (doc && typeof doc.toObject === "function") ? doc.toObject() : { ...doc };

    // delete cloudinary asset if configured
    const publicId = removedDoc.publicId || removedDoc.cloudinaryId || removedDoc.id;
    if (publicId && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        await cloudinary.v2.uploader.destroy(publicId, { resource_type: 'auto' });
        console.log(`Cloudinary asset deleted: ${publicId}`);
      } catch (err) {
        console.warn(`Failed to delete cloudinary asset ${publicId}:`, err?.message || err);
      }
    }

    // remove subdoc
    if (typeof supplier.documents.id === "function" && removedDoc._id && isValidObjectIdString(String(removedDoc._id))) {
      const sub = supplier.documents.id(removedDoc._id);
      if (sub) sub.remove();
    } else {
      supplier.documents.splice(index, 1);
    }

    await supplier.save();

    const updatedSupplier = await Supplier.findById(id).select("-password");
    return NextResponse.json({ success: true, data: removedDoc, supplier: updatedSupplier }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/supplier/[id]/documents error", err);
    return NextResponse.json({ success: false, error: err.message || "Server error" }, { status: 500 });
  }
}
