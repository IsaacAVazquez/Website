import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

function buildContentSecurityPolicy() {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isProduction ? [] : ["'unsafe-eval'"]),
    "https://static.cloudflareinsights.com",
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.fantasypros.com https://cloudflareinsights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Prevent Netlify Durable Cache from storing HTML pages.
  // Static assets (/_next/static/) are excluded by the proxy matcher.
  response.headers.set("Netlify-CDN-Cache-Control", "no-store");

  return response;
}

// Apply security headers to HTML routes. Admin auth is handled by NextAuth.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/blog") {
    return withSecurityHeaders(NextResponse.redirect(new URL("/writing", request.url)));
  }

  if (pathname.startsWith("/blog/")) {
    const slug = pathname.replace("/blog/", "");
    return withSecurityHeaders(NextResponse.redirect(new URL(`/writing/${slug}`, request.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

// Apply to all routes except static files and API routes.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
