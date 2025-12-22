// // src/middleware.js
// import { NextResponse } from 'next/server';
// import jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET;

// // Public routes
// const publicRoutes = ['/auth/login', '/auth/register'];

// // Role-based protected routes
// const protectedRoutes = [
//   { path: '/dashboard', roles: ['admin', 'employee'] },
//   { path: '/dashboard/payroll', roles: ['admin'] },
//   { path: '/dashboard/tasks', roles: ['employee'] },
// ];

// export function middleware(req) {
//   const { pathname } = req.nextUrl;

//   // Allow public routes
//   if (publicRoutes.some(route => pathname.startsWith(route))) {
//     return NextResponse.next();
//   }

//   // Find protected route config
//   const routeConfig = protectedRoutes.find(route =>
//     pathname.startsWith(route.path)
//   );

//   if (!routeConfig) return NextResponse.next(); // Route not protected

//   // Check for token in cookies
//   const token = req.cookies.get('authToken')?.value;

//   if (!token) {
//     const url = req.nextUrl.clone();
//     url.pathname = '/auth/login';
//     url.searchParams.set('message', 'Please login first');
//     return NextResponse.redirect(url);
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);

//     // Role-based access check
//     if (!routeConfig.roles.includes(decoded.role)) {
//       const url = req.nextUrl.clone();
//       url.pathname = '/unauthorized';
//       url.searchParams.set('message', 'You do not have access to this page');
//       return NextResponse.redirect(url);
//     }

//     return NextResponse.next();
//   } catch {
//     const url = req.nextUrl.clone();
//     url.pathname = '/auth/login';
//     url.searchParams.set('message', 'Session expired. Please login again.');
//     return NextResponse.redirect(url);
//   }
// }

// // Apply middleware to all routes except static & API
// export const config = {
//   matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
// };

// src/middleware.js   (100% working – handles CORS + Auth in one file)

// import { NextResponse } from "next/server";
// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET;

// // Your frontend origin (change only this line when deploying)
// const ALLOWED_ORIGIN = ["*", 'http://localhost:3000', 'http://localhost:3001'];
// process.env.NODE_ENV === "production"
//   ? "https://yourdomain.com" // Change to your real domain
//   : "http://localhost:3000"; // Dev

// // Public routes (no auth needed)
// const publicRoutes = ["/auth/login", "/auth/register"];

// // Protected dashboard routes
// const protectedRoutes = [
//   { path: "/dashboard", roles: ["admin", "employee"] },
//   { path: "/dashboard/payroll", roles: ["admin"] },
//   { path: "/dashboard/tasks", roles: ["employee"] },
// ];

// export function middleware(req) {
//   const { pathname, origin } = req.nextUrl;
//   const method = req.method;

//   // ─────────────────────────────────────────────────────────────
//   // 1. Handle CORS Preflight (OPTIONS) – MUST come first
//   // ─────────────────────────────────────────────────────────────
//   if (method === "OPTIONS") {
//     return new NextResponse(null, {
//       status: 200,
//       headers: {
//         "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
//         "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
//         "Access-Control-Allow-Headers":
//           "Content-Type, Authorization, X-Requested-With",
//         "Access-Control-Allow-Credentials": "true",
//       },
//     });
//   }

//   // ─────────────────────────────────────────────────────────────
//   // 2. Add CORS headers to ALL responses (including API routes)
//   // ─────────────────────────────────────────────────────────────
//   const response = NextResponse.next();

//   response.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
//   response.headers.set("Access-Control-Allow-Credentials", "true");
//   // Optional: expose headers if needed
//   // response.headers.set('Access-Control-Expose-Headers', 'Set-Cookie');

//   // ─────────────────────────────────────────────────────────────
//   // 3. Public routes – just pass through
//   // ─────────────────────────────────────────────────────────────
//   if (publicRoutes.some((route) => pathname.startsWith(route))) {
//     return response;
//   }

//   // ─────────────────────────────────────────────────────────────
//   // 4. Protected routes – check auth + role
//   // ─────────────────────────────────────────────────────────────
//   const routeConfig = protectedRoutes.find((r) => pathname.startsWith(r.path));
//   if (routeConfig) {
//     const token = req.cookies.get("authToken")?.value;

//     if (!token) {
//       const url = req.nextUrl.clone();
//       url.pathname = "/auth/login";
//       url.searchParams.set("message", "Please login first");
//       return NextResponse.redirect(url);
//     }

//     try {
//       const decoded = jwt.verify(token, JWT_SECRET);

//       if (!routeConfig.roles.includes(decoded.role)) {
//         const url = req.nextUrl.clone();
//         url.pathname = "/unauthorized";
//         return NextResponse.redirect(url);
//       }

//       return response; // Authorized
//     } catch (err) {
//       const url = req.nextUrl.clone();
//       url.pathname = "/auth/login";
//       url.searchParams.set("message", "Session expired");
//       return NextResponse.redirect(url);
//     }
//   }

//   // ─────────────────────────────────────────────────────────────
//   // 5. All other routes (including /api/*) – just allow with CORS
//   // ─────────────────────────────────────────────────────────────
//   return response;
// }

// // Apply to everything except static files
// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
// };


// middleware.ts (or .js)
// import { NextResponse } from "next/server";
// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET;

// // List of origins you really want to allow
// const ALLOWED_ORIGINS = [
//   "http://localhost:3000",
//   "http://localhost:3001",
//   "https://yourdomain.com",        // ← change in production
//   "https://www.yourdomain.com",
// ];

// // Helper: return the correct origin string (or "*" if you don't need credentials)
// function getAllowedOrigin(requestOrigin) {
//   // If you are using credentials (cookies), you CANNOT use "*"
//   if (!requestOrigin) return ALLOWED_ORIGINS[0]; // fallback

//   return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];
// }

// export async function middleware(req) {
//   const { pathname, origin } = req.nextUrl;
//   const method = req.method;
//   const requestOrigin = req.headers.get("origin");

//   // 1. Handle preflight
//   if (method === "OPTIONS") {
//     return new NextResponse(null, {
//       status: 200,
//       headers: {
//         "Access-Control-Allow-Origin": getAllowedOrigin(requestOrigin),
//         "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
//         "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
//         "Access-Control-Allow-Credentials": "true",
//       },
//     });
//   }

//   // 2. Normal response – add CORS headers
//   const response = NextResponse.next();

//   response.headers.set("Access-Control-Allow-Origin", getAllowedOrigin(requestOrigin));
//   response.headers.set("Access-Control-Allow-Credentials", "true");

//   // ─────────────────────────────────────────────────────────────
//   // Your existing auth logic (unchanged)
//   // ─────────────────────────────────────────────────────────────
//   const publicRoutes = ["/auth/login", "/auth/register"];
//   const protectedRoutes = [
//     { path: "/dashboard", roles: ["admin", "employee"] },
//     { path: "/dashboard/payroll", roles: ["admin"] },
//     { path: "/dashboard/tasks", roles: ["employee"] },
//   ];

//   if (publicRoutes.some((route) => pathname.startsWith(route))) {
//     return response;
//   }

//   const routeConfig = protectedRoutes.find((r) => pathname.startsWith(r.path));
//   if (routeConfig) {
//     const token = req.cookies.get("authToken")?.value;

//     if (!token) {
//       const url = req.nextUrl.clone();
//       url.pathname = "/auth/login";
//       url.searchParams.set("message", "Please login first");
//       return NextResponse.redirect(url);
//     }

//     try {
//       const decoded = jwt.verify(token, JWT_SECRET);

//       if (!routeConfig.roles.includes(decoded.role)) {
//         const url = req.nextUrl.clone();
//         url.pathname = "/unauthorized";
//         return NextResponse.redirect(url);
//       }

//       return response;
//     } catch (err) {
//       const url = req.nextUrl.clone();
//       url.pathname = "/auth/login";
//       url.searchParams.set("message", "Session expired");
//       return NextResponse.redirect(url);
//     }
//   }

//   // Everything else (API routes, pages, etc.)
//   return response;
// }

// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
// };


// middleware.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Allow these origins
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://horeca-user-end.vercel.app"
];

// Allow only real frontends
function getAllowedOrigin(origin) {
  if (!origin) return ALLOWED_ORIGINS[0];
  return ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const method = req.method;
  const requestOrigin = req.headers.get("origin");

  // -------------------------------
  // 1. CORS Preflight
  // -------------------------------
  if (method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": getAllowedOrigin(requestOrigin),
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  const res = NextResponse.next();

  res.headers.set("Access-Control-Allow-Origin", getAllowedOrigin(requestOrigin));
  res.headers.set("Access-Control-Allow-Credentials", "true");

  // ---------------------------------------
  // 2. Allow ALL Auth and Public API routes
  // ---------------------------------------
  if (
    pathname.startsWith("/api/auth/") ||         // send-otp, verify-otp
    pathname.startsWith("/api/customers/create") // customer create API must be public
  ) {
    return res;
  }

  // ---------------------------------------
  // 3. Allow ALL non-dashboard API routes
  // ---------------------------------------
 if (pathname.startsWith("/api/") && !pathname.startsWith("/api/admin/")) {
  return res;
}


  // ---------------------------------------
  // 4. Dashboard Protected Routes
  // ---------------------------------------
  const protectedRoutes = [
    { path: "/dashboard", roles: ["admin", "employee"] },
    { path: "/dashboard/payroll", roles: ["admin"] },
    { path: "/dashboard/tasks", roles: ["employee"] },
  ];

  const rule = protectedRoutes.find((r) => pathname.startsWith(r.path));

  if (rule) {
    const token = req.cookies.get("authToken")?.value;

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("message", "Please login first");
      return NextResponse.redirect(url);
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      if (!rule.roles.includes(decoded.role)) {
        const url = req.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    } catch (err) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("message", "Session expired");
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


