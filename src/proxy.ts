import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

// Only widen the CSP for Google Analytics when a measurement id is configured.
// With the env var unset (local dev, CI, tests) the policy stays exactly as it
// was — no analytics vendor domains are allow-listed.
const analyticsEnabled = /^G-[A-Z0-9]+$/i.test(
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "",
);

function isSecureRequest(request: NextRequest) {
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim()
    .toLowerCase();

  return forwardedProtocol
    ? forwardedProtocol === "https"
    : request.nextUrl.protocol === "https:";
}

export function buildContentSecurityPolicy(
  request: NextRequest,
  production = isProduction,
) {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isProduction ? [] : ["'unsafe-eval'"]),
    "https://static.cloudflareinsights.com",
    ...(analyticsEnabled ? ["https://www.googletagmanager.com"] : []),
  ];

  const connectSrc = [
    "'self'",
    "https://api.fantasypros.com",
    "https://cloudflareinsights.com",
    ...(analyticsEnabled
      ? [
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://region1.google-analytics.com",
        ]
      : []),
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(production && isSecureRequest(request)
      ? ["upgrade-insecure-requests"]
      : []),
  ].join("; ");
}

function withSecurityHeaders(response: NextResponse, request: NextRequest) {
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(request),
  );
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
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/writing", request.url)),
      request,
    );
  }

  if (pathname.startsWith("/blog/")) {
    const slug = pathname.replace("/blog/", "");
    return withSecurityHeaders(
      NextResponse.redirect(new URL(`/writing/${slug}`, request.url)),
      request,
    );
  }

  return withSecurityHeaders(NextResponse.next(), request);
}

// Apply to all routes except static files and API routes.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
