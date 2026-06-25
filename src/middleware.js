import { NextResponse } from "next/server";

// Allowed origins — add your production domains here
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

export function middleware(request) {
  const origin = request.headers.get("origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  // Handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // For all other requests, continue and add CORS headers to the response
  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Only apply this middleware to API routes
export const config = {
  matcher: "/api/:path*",
};
