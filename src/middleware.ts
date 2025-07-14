import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Combine auth middleware with security headers
export default withAuth(
  function middleware(req: NextRequest) {
    const response = NextResponse.next();
    
    // Security headers
    const headers = {
      // Content Security Policy
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self'",
        "connect-src 'self' https://api.fantasypros.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join("; "),
      
      // Other security headers
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      
      // HSTS (HTTP Strict Transport Security)
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
    };
    
    // Apply headers
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Configure which paths require authentication
export const config = {
  matcher: [
    // Protect admin routes
    "/admin/:path*",
    // Apply security headers to all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};