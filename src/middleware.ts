import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Custom middleware that applies security headers to all routes 
// but only enforces authentication for admin routes via the component itself
export default function middleware(req: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers for all routes
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
  
  // Apply headers to all responses
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Apply to all routes except static files and API routes
export const config = {
  matcher: [
    // Apply security headers to all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};