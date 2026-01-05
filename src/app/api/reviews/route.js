
import mongoose from "mongoose";
import dbConnect from "@/lib/db/connect";
import Review from "@/lib/db/models/review";
import Order from "@/lib/db/models/order";
// import Product from "@/lib/db/models/product"; // If needed to update avg rating
import User from "@/lib/db/models/User";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { userId, productId, orderId, rating, comment, images } = body;

    // 1. Validate required fields
    if (!userId || !productId || !orderId || !rating || !comment) {
      return json(
        { success: false, error: "Missing required fields (userId, productId, orderId, rating, comment)" },
        400
      );
    }

    if (rating < 1 || rating > 5) {
      return json({ success: false, error: "Rating must be between 1 and 5" }, 400);
    }

    // 2. Verify Order Existence & Ownership
    const order = await Order.findById(orderId);
    if (!order) {
      return json({ success: false, error: "Order not found" }, 404);
    }

    // Check if user matches
    if (order.user.toString() !== userId) {
      return json({ success: false, error: "Unauthorized: Order does not belong to this user" }, 403);
    }

    // Check if product is in the order
    const hasProduct = order.items.some(
      (item) => item.product.toString() === productId
    );

    if (!hasProduct) {
      return json(
        { success: false, error: "Product not found in this order" },
        400
      );
    }
    
    // Check if order is delivered (Optional policy: can only review delivered items)
    if (order.status !== 'delivered' && order.status !== 'completed') {
        // You might want to allow it, but typically only delivered items are reviewed. 
        // For now, I'll allow it but warn or strict it if requested. 
        // Let's strict it to 'delivered' to be safe, or at least 'shipped'.
        // Assuming 'delivered' is the standard for reviews.
        // if (order.status !== 'delivered') return json({ success: false, error: "Order must be delivered to leave a review"}, 400);
    }

    // Normalize images (handle array of strings or array of objects with url property)
    let processedImages = [];
    if (Array.isArray(images)) {
      processedImages = images.map((img) => {
        if (typeof img === "string") return img;
        if (typeof img === "object" && img?.url) return img.url;
        return null;
      }).filter(Boolean);
    }

    // 3. Create Review
    // Review schema has unique index on { order, product, user } so duplicates will fail automatically
    const review = await Review.create({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      comment,
      images: processedImages,
    });

    // 4. (Optional) Update Product Average Rating
    // We can do this in an aggregation or a separate worker. For simplicity, just saving the review now.

    return json({ success: true, review }, 201);
  } catch (error) {
    if (error.code === 11000) {
      return json(
        { success: false, error: "You have already reviewed this product from this order." },
        409
      );
    }
    console.error("POST /api/reviews error:", error);
    return json({ success: false, error: error.message || "Server Error" }, 500);
  }
}

// export async function GET(request) {
//   try {
//     await dbConnect();
//     const url = new URL(request.url);
//     const productId = url.searchParams.get("productId");
//     const userId = url.searchParams.get("userId");
//     const limit = parseInt(url.searchParams.get("limit") || "20");
//     const page = parseInt(url.searchParams.get("page") || "1");
//     const skip = (page - 1) * limit;

//     const query = {};
//     if (productId) query.product = productId;
//     if (userId) query.user = userId;
    
//     // Default: find approved reviews only, unless searching by own user? 
//     // Usually public API shows approved reviews.
//     // query.isApproved = true; 

//     // If both are missing, maybe return error or all reviews (admin?)
//     if (!productId && !userId) {
//        // Allow fetching all if admin logic exists, otherwise restricted default.
//        // For now, allow listing recent reviews.
//     }

//     const reviews = await Review.find(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate("user", "name") // Show reviewer name
//       .lean();
    
//     const total = await Review.countDocuments(query);

//     return json({ success: true, count: total, reviews });
//   } catch (error) {
//     console.error("GET /api/reviews error:", error);
//     return json({ success: false, error: "Server Error" }, 500);
//   }
// }

export async function GET(request) {
  try {
    await dbConnect();

    const url = new URL(request.url);

    const productId = url.searchParams.get("productId");
    const userId = url.searchParams.get("userId");

    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query = {};

    if (productId) query.product = productId;
    if (userId) query.user = userId;


    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name")
      .lean();

    const total = await Review.countDocuments(query);

    return json({
      success: true,
      total,
      page,
      limit,
      reviews,
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return json(
      { success: false, error: "Server error" },
      500
    );
  }
}

