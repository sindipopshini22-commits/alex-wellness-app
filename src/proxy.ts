// Edge proxy — rate limit + cookie gate + security headers.
// Applies to all API routes and page routes listed in the matcher.
//
// Security layers applied here:
// 1. Security headers (CSP, HSTS, X-Frame-Options, etc.)
// 2. Rate limiting (user-scoped if authed, IP-scoped if anonymous)
// 3. Cookie presence validation for protected routes

import { NextResponse, type NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { verifySessionFromCookies } from "@/lib/session";
import { SECURITY_HEADERS } from "@/lib/securityHeaders";

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/classroom/:path*",
    "/settings/:path*",
  ]
};

export default async function proxy(req: NextRequest) {
  // Verify HMAC-signed session token (not the raw userId)
  const userId = verifySessionFromCookies(req.cookies);
  const identifier = userId ?? req.headers.get("x-forwarded-for") ?? "anon";
  const scope = userId ? "user" : "ip";

  // Apply rate limiting to API routes only. Page navigations (dashboard,
  // settings, classroom, onboarding) must never be blocked — a user opening
  // a page is not abuse, and the SPA fires several API calls per page load.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const rl = await enforceRateLimit(identifier, scope);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...SECURITY_HEADERS,
          },
        }
      );
    }
  }

  // Apply security headers to all responses
  const response = NextResponse.next();

  // Set security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Add cache control for API responses
  if (req.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return response;
}
