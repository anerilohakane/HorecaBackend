// src/app/api/supplier/pending/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db/connect";
import Supplier from "@/lib/db/models/supplier";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "fallback_access_token_secret";

/** token extraction supporting NextRequest and plain headers */
function getTokenFromReq(request) {
  try {
    if (request && typeof request.headers?.get === "function") {
      // NextRequest / Request in app router
      const cookieHeader = request.headers.get("cookie") || "";
      const cookieMatch = cookieHeader.match(/(?:^|;\s*)authToken=([^;]+)/);
      if (cookieMatch) return cookieMatch[1];

      const auth = request.headers.get("authorization") || "";
      if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.split(" ")[1];

      return null;
    }

    // Fallback: plain object headers
    const headers = request?.headers || request;
    if (headers) {
      const cookieHeader = headers.cookie || headers.Cookie || "";
      const cookieMatch = cookieHeader.match(/(?:^|;\s*)authToken=([^;]+)/);
      if (cookieMatch) return cookieMatch[1];

      const auth = headers.authorization || headers.Authorization || "";
      if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.split(" ")[1];
    }
  } catch (err) {
    console.error("[pending:getTokenFromReq] error:", err);
  }
  return null;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    return null;
  }
}

export async function GET(request) {
  await dbConnect();

  // Debug: log headers so we can see what Postman actually sends
  try {
    const rawAuthHeader = request.headers.get ? request.headers.get("authorization") : (request.headers?.authorization || "");
    const rawCookie = request.headers.get ? request.headers.get("cookie") : (request.headers?.cookie || "");
    console.log("[/api/supplier/pending] Headers -> Authorization:", rawAuthHeader, "Cookie:", rawCookie);
  } catch (e) {
    console.log("[/api/supplier/pending] Header read error", e?.message);
  }

  // NOTE: Temporarily allow request to proceed WITHOUT requiring a token.
  // If you want to re-enable auth later, uncomment the block below and adapt to your auth helpers.
  /*
  const token = getTokenFromReq(request);
  if (!token) {
    console.warn("[/api/supplier/pending] no token received");
    return NextResponse.json({ success: false, error: "Unauthorized - no token" }, { status: 401 });
  }
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden - admin only" }, { status: 403 });
  }
  */

  try {
    const pending = await Supplier.find({ status: "pending" }).lean();
    return NextResponse.json({ success: true, data: pending });
  } catch (err) {
    console.error("[/api/supplier/pending] DB error:", err);
    return NextResponse.json({ success: false, error: err.message || "Server error" }, { status: 500 });
  }
}
