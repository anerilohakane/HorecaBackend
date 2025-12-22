// src/lib/serverAuth.js
import { getTokenFromReq, verifyToken } from "./utils/auth.js";

/**
 * Returns user object derived from JWT or null.
 * Works with NextRequest (app router) or plain node request.
 */
export async function getUserFromRequest(request) {
  const token = getTokenFromReq(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  // Normalize: return minimal user info commonly used across app
  return {
    id: decoded.id || decoded._id || null,
    role: decoded.role || null,
    email: decoded.email || null,
    // keep full token payload if needed:
    payload: decoded
  };
}

export function requireAdmin(user) {
  return !!(user && user.role === "admin");
}
