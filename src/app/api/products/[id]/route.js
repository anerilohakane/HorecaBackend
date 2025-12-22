  // // /app/api/products/[id]/route.js
  // import { NextResponse } from "next/server";
  // import dbConnect from "@/lib/db/connect";
  // import Product from "@/lib/db/models/product";

  // /**
  //  * Helper: basic ObjectId shape check to avoid Mongoose cast errors early
  //  */
  // function isValidObjectIdString(id) {
  //   return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  // }

  // export async function GET(request, { params }) {
  //   await dbConnect();
  //   try {
  //     const { id } = await params; // IMPORTANT: await params
  //     if (!isValidObjectIdString(id)) {
  //       return NextResponse.json({ success: false, error: "Invalid product id" }, { status: 400 });
  //     }

  //     const product = await Product.findById(id).lean();
  //     if (!product) {
  //       return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  //     }
  //     return NextResponse.json({ success: true, data: product });
  //   } catch (err) {
  //     console.error("GET /api/products/[id]", err);
  //     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  //   }
  // }

  // export async function PUT(request, { params }) {
  //   await dbConnect();
  //   try {
  //     const { id } = await params; // IMPORTANT: await params
  //     if (!isValidObjectIdString(id)) {
  //       return NextResponse.json({ success: false, error: "Invalid product id" }, { status: 400 });
  //     }

  //     const body = await request.json();
  //     const updated = await Product.findByIdAndUpdate(id, body, {
  //       new: true,
  //       runValidators: true,
  //       overwrite: true,
  //     });

  //     if (!updated) {
  //       return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  //     }
  //     return NextResponse.json({ success: true, data: updated });
  //   } catch (err) {
  //     console.error("PUT /api/products/[id]", err);
  //     if (err.name === "ValidationError") {
  //       const errors = Object.values(err.errors).map(e => e.message);
  //       return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
  //     }
  //     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  //   }
  // }

  // export async function PATCH(request, { params }) {
  //   await dbConnect();
  //   try {
  //     const { id } = await params; // IMPORTANT: await params
  //     if (!isValidObjectIdString(id)) {
  //       return NextResponse.json({ success: false, error: "Invalid product id" }, { status: 400 });
  //     }

  //     const body = await request.json();
  //     const updated = await Product.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
  //     if (!updated) {
  //       return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  //     }
  //     return NextResponse.json({ success: true, data: updated });
  //   } catch (err) {
  //     console.error("PATCH /api/products/[id]", err);
  //     if (err.name === "ValidationError") {
  //       const errors = Object.values(err.errors).map(e => e.message);
  //       return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
  //     }
  //     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  //   }
  // }

  // export async function DELETE(request, { params }) {
  //   await dbConnect();
  //   try {
  //     const { id } = await params; // IMPORTANT: await params
  //     if (!isValidObjectIdString(id)) {
  //       return NextResponse.json({ success: false, error: "Invalid product id" }, { status: 400 });
  //     }

  //     const deleted = await Product.findByIdAndDelete(id);
  //     if (!deleted) {
  //       return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  //     }
  //     return NextResponse.json({ success: true, data: deleted });
  //   } catch (err) {
  //     console.error("DELETE /api/products/[id]", err);
  //     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  //   }
  // }

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Product from "@/lib/db/models/product";
import Category from "@/lib/db/models/category";

/** Validate ObjectId */
function isValidObjectIdString(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

/** -------------------------------------------------------
 * GET /api/products/:id
 * Returns product + category info
 ------------------------------------------------------- */
export async function GET(request, { params }) {
  await dbConnect();
  try {
    const { id } = params;

    if (!isValidObjectIdString(id)) {
      return NextResponse.json({ success: false, error: "Invalid product id" }, { status: 400 });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // Fetch category for the product
    const cat = product.categoryId
      ? await Category.findById(product.categoryId)
          .select("_id name image slug parent")
          .lean()
      : null;

    const out = {
      ...product,
      category: cat
        ? {
            id: String(cat._id),
            name: cat.name,
            slug: cat.slug ?? null,
            image: cat.image ?? null,
            parent: cat.parent ?? null,
          }
        : null,
    };

    return NextResponse.json({ success: true, data: out });
  } catch (err) {
    console.error("GET /api/products/[id]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** -------------------------------------------------------
 * PUT /api/products/:id
 * Fully replace product document
 ------------------------------------------------------- */
export async function PUT(request, { params }) {
  await dbConnect();
  try {
    const { id } = params;

    if (!isValidObjectIdString(id)) {
      return NextResponse.json({ success: false, error: "Invalid product id" }, { status: 400 });
    }

    const body = await request.json();

    const updated = await Product.findByIdAndUpdate(id, body, {
      new: true,
      overwrite: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("PUT /api/products/[id] error:", err);

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** -------------------------------------------------------
 * PATCH /api/products/:id
 * Partial update
 ------------------------------------------------------- */
export async function PATCH(request, { params }) {
  await dbConnect();
  try {
    const { id } = params;

    if (!isValidObjectIdString(id)) {
      return NextResponse.json({ success: false, error: "Invalid product id" }, { status: 400 });
    }

    const body = await request.json();

    const updated = await Product.findByIdAndUpdate(id, { $set: body }, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("PATCH /api/products/[id] error:", err);

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** -------------------------------------------------------
 * DELETE /api/products/:id
 ------------------------------------------------------- */
export async function DELETE(request, { params }) {
  await dbConnect();
  try {
    const { id } = params;

    if (!isValidObjectIdString(id)) {
      return NextResponse.json({ success: false, error: "Invalid product id" }, { status: 400 });
    }

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (err) {
    console.error("DELETE /api/products/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
