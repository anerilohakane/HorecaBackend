// // /app/api/categories/[id]/route.js
// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/db/connect";
// import Category from "@/lib/db/models/category";

// export async function GET(request, { params }) {
//   await dbConnect();
//   try {
//     const { id } = params;
//     const category = await Category.findById(id).lean();
//     if (!category) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
//     return NextResponse.json({ success: true, data: category });
//   } catch (err) {
//     console.error("GET /api/categories/[id] error", err);
//     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
//   }
// }

// export async function PATCH(request, { params }) {
//   await dbConnect();
//   try {
//     const { id } = params;
//     const body = await request.json();
//     const updated = await Category.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
//     if (!updated) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
//     return NextResponse.json({ success: true, data: updated });
//   } catch (err) {
//     console.error("PATCH /api/categories/[id] error", err);
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
//     const { id } = params;
//     const deleted = await Category.findByIdAndDelete(id);
//     if (!deleted) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
//     return NextResponse.json({ success: true, data: deleted });
//   } catch (err) {
//     console.error("DELETE /api/categories/[id] error", err);
//     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
//   }
// }



// /app/api/categories/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Category from "@/lib/db/models/category";
import Product from "@/lib/db/models/product";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  await dbConnect();
  try {
    const { id } = params;
    const url = new URL(request.url);
    const include = (url.searchParams.get("include") || "").toLowerCase(); // children | products | descendants | all
    const productsLimit = Math.min(100, parseInt(url.searchParams.get("productsLimit") || "20", 10));

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid category id" }, { status: 400 });
    }

    // If caller wants full descendant tree, use aggregation with $graphLookup
    if (include === "descendants" || include === "all") {
      // aggregate to get category + descendants + children + products preview
      const pipeline = [
        { $match: { _id: mongoose.Types.ObjectId(id) } },
        {
          $graphLookup: {
            from: "categories",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "parent",
            as: "descendants",
            depthField: "depth",
            maxDepth: 10
          }
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "parent",
            as: "children"
          }
        },
        {
          $lookup: {
            from: "products",
            let: { catId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryId", "$$catId"] }, isActive: true } },
              { $sort: { createdAt: -1 } },
              { $limit: productsLimit },
              { $project: { name: 1, price: 1, images: 1, unit: 1, averageRating: 1, offerPercentage: 1 } }
            ],
            as: "products"
          }
        },
        {
          $lookup: {
            from: "products",
            let: { catId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$categoryId", "$$catId"] }, isActive: true } },
              { $count: "count" }
            ],
            as: "productCountArr"
          }
        },
        {
          $addFields: {
            productCount: { $ifNull: [{ $arrayElemAt: ["$productCountArr.count", 0] }, 0] }
          }
        },
        {
          $project: { productCountArr: 0, __v: 0 }
        }
      ];

      const [doc] = await Category.aggregate(pipeline).allowDiskUse(true);
      if (!doc) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });

      const mapped = {
        id: String(doc._id),
        name: doc.name,
        description: doc.description ?? '',
        image: doc.image?.url ?? null,
        productCount: doc.productCount ?? 0,
        products: (doc.products || []).map(p => ({
          id: String(p._id), name: p.name, price: p.price, unit: p.unit, images: p.images, averageRating: p.averageRating, offerPercentage: p.offerPercentage
        })),
        children: (doc.children || []).map(c => ({ id: String(c._id), name: c.name, image: c.image?.url ?? null })),
        descendants: (doc.descendants || []).map(d => ({ id: String(d._id), name: d.name, parent: d.parent ? String(d.parent) : null, image: d.image?.url ?? null })),
      };

      return NextResponse.json({ success: true, data: mapped });
    }

    // Otherwise, simple find + optional children/products
    const category = await Category.findById(id).lean();
    if (!category) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });

    const out = {
      id: String(category._id),
      name: category.name,
      description: category.description ?? '',
      image: category.image?.url ?? null,
    };

    if (include === "children" || include === "all") {
      const children = await Category.find({ parent: category._id, isActive: true }).sort({ name: 1 }).lean();
      out.children = (children || []).map(c => ({ id: String(c._id), name: c.name, image: c.image?.url ?? null }));
    }

    if (include === "products" || include === "all") {
      const products = await Product.find({ categoryId: category._id, isActive: true })
        .sort({ createdAt: -1 })
        .limit(productsLimit)
        .select('name price images unit averageRating offerPercentage')
        .lean();
      const count = await Product.countDocuments({ categoryId: category._id, isActive: true });

      out.products = (products || []).map(p => ({ id: String(p._id), name: p.name, price: p.price, unit: p.unit, images: p.images, averageRating: p.averageRating, offerPercentage: p.offerPercentage }));
      out.productCount = count;
    }

    return NextResponse.json({ success: true, data: out });
  } catch (err) {
    console.error("GET /api/categories/[id] error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  await dbConnect();
  try {
    const { id } = params;
    const body = await request.json();
    const updated = await Category.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("PATCH /api/categories/[id] error", err);
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
    const { id } = params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: deleted });
  } catch (err) {
    console.error("DELETE /api/categories/[id] error", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
