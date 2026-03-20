import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Wishlist from "@/lib/db/models/wishlist";
import jwt from "jsonwebtoken";

export async function GET(request, { params }) {
  await dbConnect();
  try {
    const { productId } = await params;
    
    // Attempt to extract userId from headers if logged in
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        userId = decoded.id || decoded.userId || decoded._id;
      } catch (e) {
        // invalid token
      }
    }

    // fallback userId from query if available and no token decoding worked
    if (!userId) {
       const url = new URL(request.url);
       userId = url.searchParams.get("userId");
    }

    if (!userId) {
      return NextResponse.json({ success: false, isInWishlist: false, error: "Unauthenticated" }, { status: 401 });
    }

    const wishlist = await Wishlist.findOne({ userId }).lean();
    if (!wishlist) {
      return NextResponse.json({ success: true, isInWishlist: false });
    }

    const found = wishlist.items?.some(item => String(item.productId) === String(productId));
    
    return NextResponse.json({ success: true, isInWishlist: !!found });

  } catch (err) {
    console.error("GET /api/wishlist/check/[productId] error", err);
    return NextResponse.json({ success: false, error: err.message, isInWishlist: false }, { status: 500 });
  }
}
