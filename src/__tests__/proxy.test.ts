/** @jest-environment node */

import { NextRequest } from "next/server";
import { buildContentSecurityPolicy, proxy, config } from "@/proxy";

describe("proxy security headers", () => {
  it("keeps CSP enabled for HTML routes without analytics vendor domains", () => {
    expect(config.matcher).toContain("/((?!_next/static|_next/image|favicon.ico|api/).*)");

    const response = proxy(new NextRequest("https://example.com/about"));
    const contentSecurityPolicy = response.headers.get("Content-Security-Policy");

    expect(contentSecurityPolicy).toBeTruthy();
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com");
    expect(contentSecurityPolicy).not.toContain("googletagmanager");
    expect(contentSecurityPolicy).not.toContain("google-analytics.com");
    expect(contentSecurityPolicy).not.toContain("contentsquare");
    expect(response.headers.get("Netlify-CDN-Cache-Control")).toBe("no-store");
  });

  it("keeps security headers on legacy writing redirects", () => {
    const response = proxy(new NextRequest("https://example.com/blog/example-post"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/writing/example-post");
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("only upgrades subresources for browser-facing HTTPS requests", () => {
    const localRequest = new NextRequest(
      "http://localhost:3000/fantasy-football",
    );
    const forwardedRequest = new NextRequest(
      "http://internal:3000/fantasy-football",
      { headers: { "x-forwarded-proto": "https" } },
    );

    expect(buildContentSecurityPolicy(localRequest, true)).not.toContain(
      "upgrade-insecure-requests",
    );
    expect(buildContentSecurityPolicy(forwardedRequest, true)).toContain(
      "upgrade-insecure-requests",
    );
  });
});
